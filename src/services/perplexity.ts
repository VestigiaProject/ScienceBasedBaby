import { findSimilarAnswer, cacheAnswer } from './pinecone';
import { checkQueryRelevancy } from './openai';
import { NotRelevantError } from './errors';
import { CachedAnswer } from '../types/answers';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const DAILY_REQUEST_LIMIT = 35;

async function checkAndUpdateRequestLimit(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const subscriptionDoc = doc(db, 'subscriptions', user.uid);
  const subscription = await getDoc(subscriptionDoc);
  const data = subscription.data();

  if (!data) {
    throw new Error('No subscription data found');
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const currentTracking = data.requestTracking || { requestCount: 0, date: 0 };

  if (currentTracking.date !== today) {
    await setDoc(subscriptionDoc, {
      ...data,
      requestTracking: {
        requestCount: 1,
        date: today
      }
    }, { merge: true });
    return true;
  }

  if (!currentTracking.requestCount || currentTracking.requestCount < DAILY_REQUEST_LIMIT) {
    const newCount = (currentTracking.requestCount || 0) + 1;
    await setDoc(subscriptionDoc, {
      ...data,
      requestTracking: {
        requestCount: newCount,
        date: today
      }
    }, { merge: true });
    return true;
  }

  return false;
}

function extractUrlFromCitation(citation: string): string | undefined {
  const doiMatch = citation.match(/(?:doi:|DOI:?\s*)?(?:https?:\/\/doi\.org\/|10\.\d{4,}\/[-._;()\/:A-Z0-9]+)/i);
  if (doiMatch) {
    const doi = doiMatch[0].replace(/^doi:/i, '').trim();
    return doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
  }

  const pubmedMatch = citation.match(/https?:\/\/(?:www\.)?ncbi\.nlm\.nih\.gov\/pubmed\/\d+/i);
  if (pubmedMatch) {
    return pubmedMatch[0];
  }

  const urlMatch = citation.match(/https?:\/\/[^\s<>[\]()]+[^\s.,<>[\]()]/i);
  if (urlMatch) {
    return urlMatch[0];
  }

  return undefined;
}

function parsePerplexityResponse(content: string): CachedAnswer {
  const result: CachedAnswer = {
    pros: [],
    cons: [],
    citations: []
  };

  try {
    const prosMatch = content.match(/<PROS>([\s\S]*?)<\/PROS>/);
    const consMatch = content.match(/<CONS>([\s\S]*?)<\/CONS>/);
    const citationsMatch = content.match(/<CITATIONS>([\s\S]*?)<\/CITATIONS>/);

    if (prosMatch) {
      result.pros = prosMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('•'))
        .map(line => line.substring(1).trim());
    }

    if (consMatch) {
      result.cons = consMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('•'))
        .map(line => line.substring(1).trim());
    }

    if (citationsMatch) {
      const citationLines = citationsMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && (line.startsWith('[') || line.startsWith('•')))
        .map(line => line.startsWith('•') ? line.substring(1).trim() : line);

      result.citations = citationLines.map((citation, index) => {
        const url = extractUrlFromCitation(citation);
        return {
          id: index + 1,
          text: citation.replace(/^(?:\[\d+\]|\•)\s*/, '').trim(),
          url
        };
      });
    }
  } catch (error) {
    throw new Error('Failed to parse response format');
  }

  if (result.pros.length === 0 && result.cons.length === 0) {
    throw new Error('Invalid response format: no pros or cons found');
  }

  return result;
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

    const canMakeRequest = await checkAndUpdateRequestLimit();
    if (!canMakeRequest) {
      throw new Error('Daily request limit reached. Please try again tomorrow.');
    }

    const enhancedQuery = `The user has asked something about: "${question}" Give the pros and cons after having searched answers in scientific and peer-reviewed publications exclusively, not low-quality media. Only search in sites like https://pubmed.ncbi.nlm.nih.gov/, https://jamanetwork.com/ or https://www.ncbi.nlm.nih.gov/guide/all/. 
- CRITICAL: Format your response EXACTLY as follows, using these EXACT markers: <PROS>, </PROS>, <CONS>, </CONS>, <CITATIONS>, </CITATIONS>
- Start each pro or con point with • (bullet point)
- Citations must be numbered sequentially [1], [2], etc. WITHOUT bullet points
- Include citation numbers [n] at the end of each point
- Ensure all citations are from scientific sources. inurl:'pubmed.ncbi.nlm.nih.gov', inurl:'jamanetwork.com', inurl:'ncbi.nlm.nih.gov'`;

    const response = await fetch('/.netlify/functions/query-perplexity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: enhancedQuery })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    const result = parsePerplexityResponse(data.choices[0].message.content);

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