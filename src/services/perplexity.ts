import { findSimilarAnswer, cacheAnswer } from './pinecone';
import { checkQueryRelevancy } from './openai';
import { NotRelevantError } from './errors';
import { CachedAnswer, Source } from '../types/answers';
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

function parseResponse(content: string, sources: Source[]): CachedAnswer {
  const result: CachedAnswer = {
    pros: [],
    cons: [],
    sources: sources || []
  };

  try {
    const prosMatch = content.match(/<PROS>([\s\S]*?)<\/PROS>/);
    const consMatch = content.match(/<CONS>([\s\S]*?)<\/CONS>/);

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

    const response = await fetch('/.netlify/functions/query-perplexity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.llm_response) {
      throw new Error('Invalid response format from API');
    }

    const result = parseResponse(data.llm_response, data.sources || []);

    // Cache the answer asynchronously
    setTimeout(() => {
      cacheAnswer(question, result).catch(console.error);
    }, 0);

    return result;
  } catch (error) {
    console.error('Query error:', error);
    if (error instanceof NotRelevantError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to get scientific analysis. Please try again.');
  }
}