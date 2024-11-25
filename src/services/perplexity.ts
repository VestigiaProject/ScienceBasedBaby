import { findSimilarAnswer, cacheAnswer } from './pinecone';
import { checkQueryRelevancy } from './openai';
import { NotRelevantError } from './errors';
import { CachedAnswer } from '../types/answers';

function parsePerplexityResponse(content: string, rawResponse: any): CachedAnswer {
  const sections = content.split('###').filter(Boolean);
  const result: CachedAnswer = {
    pros: [],
    cons: [],
    citations: []
  };

  // Parse content sections
  sections.forEach(section => {
    const lines = section.trim().split('\n').filter(Boolean);
    const header = lines[0].toLowerCase();
    lines.shift(); // Remove the header

    if (header.includes('pros')) {
      result.pros = lines
        .filter(line => line.startsWith('-') || line.startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());
    } else if (header.includes('cons')) {
      result.cons = lines
        .filter(line => line.startsWith('-') || line.startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());
    } else if (header.includes('citations')) {
      const citationLines = lines.filter(line => line.startsWith('['));
      result.citations = citationLines.map((line, index) => {
        const match = line.match(/\[(\d+)\]\s*-?\s*(.+?)(?:\s*\(|$)/);
        if (!match) return null;

        const [, idStr, text] = match;
        const url = line.includes('http') ? line.match(/(https?:\/\/[^\s)]+)/)?.[0] : undefined;

        return {
          id: parseInt(idStr, 10),
          text: text.trim(),
          url: url || rawResponse?.citations?.[index] || undefined
        };
      }).filter((citation): citation is NonNullable<typeof citation> => citation !== null);
    }
  });

  // If no citations were parsed from content but raw citations exist, use those
  if (result.citations.length === 0 && rawResponse?.citations?.length > 0) {
    result.citations = rawResponse.citations.map((url: string, index: number) => ({
      id: index + 1,
      text: url.split('/').slice(-1)[0].replace(/-/g, ' '),
      url
    }));
  }

  return result;
}

export async function queryPerplexity(question: string): Promise<CachedAnswer> {
  try {
    console.log('🔍 Starting query process for:', question);
    
    // First, check if the query is relevant
    console.log('Checking query relevancy...');
    const { isRelevant, debug } = await checkQueryRelevancy(question);
    console.log('Relevancy check result:', { isRelevant, debug });
    
    if (!isRelevant) {
      console.log('❌ Query deemed not relevant');
      throw new NotRelevantError();
    }

    // Check for cached similar answer
    console.log('🔍 Searching for cached similar answers...');
    const cachedAnswer = await findSimilarAnswer(question);
    if (cachedAnswer) {
      console.log('✅ Found cached answer:', cachedAnswer);
      return cachedAnswer;
    }
    console.log('❌ No cached answer found, proceeding with Perplexity API');

    const response = await fetch('/.netlify/functions/query-perplexity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question })
    });

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error response:', errorData);
      throw new Error(`API request failed: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('Raw API response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    const result = parsePerplexityResponse(data.choices[0].message.content, data);
    console.log('📝 Parsed result:', result);

    // Validate parsed result
    if (result.pros.length === 0 && result.cons.length === 0) {
      console.warn('⚠️ Warning: Parsed result has no pros or cons');
      throw new Error('Failed to parse response: no valid content found');
    }

    // Cache the new answer
    console.log('💾 Caching new answer...');
    await cacheAnswer(question, result);
    console.log('✅ Answer cached successfully');

    return result;
  } catch (error) {
    console.error('❌ Error in queryPerplexity:', error);
    if (error instanceof NotRelevantError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to get scientific analysis. Please try again.');
  }
}