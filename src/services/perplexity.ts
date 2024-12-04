import { findSimilarAnswer, cacheAnswer } from './pinecone';
import { checkQueryRelevancy } from './openai';
import { NotRelevantError } from './errors';
import { CachedAnswer } from '../types/answers';
import { OpenPerplexSource } from '../types/openperplex';
import { convertSourcesToCitations, addCitationsToPoints, parseContentSections } from '../utils/sourceParser';
import { auth } from '../config/firebase';

function parseOpenPerplexResponse(content: string, sources: OpenPerplexSource[] = []): CachedAnswer {
  const { pros, cons } = parseContentSections(content);
  
  if (pros.length === 0 && cons.length === 0) {
    throw new Error('Invalid response format: no pros or cons found');
  }

  const citations = convertSourcesToCitations(sources);
  
  return {
    pros: addCitationsToPoints(pros, citations.length),
    cons: addCitationsToPoints(cons, citations.length),
    citations
  };
}

export async function queryPerplexity(question: string): Promise<CachedAnswer> {
  try {
    const { isRelevant } = await checkQueryRelevancy(question);
    
    if (!isRelevant) {
      throw new NotRelevantError();
    }

    const cachedAnswer = await findSimilarAnswer(question);
    if (cachedAnswer) {
      return cachedAnswer;
    }

    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/.netlify/functions/query-openperplex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ question })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    const result = parseOpenPerplexResponse(
      data.choices[0].message.content,
      data.sources || []
    );

    // Cache the answer asynchronously
    setTimeout(() => {
      cacheAnswer(question, result).catch(() => {});
    }, 0);

    return result;
  } catch (error) {
    if (error instanceof NotRelevantError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to get scientific analysis. Please try again.');
  }
}