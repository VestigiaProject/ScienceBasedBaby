import { findSimilarAnswer, cacheAnswer } from './pinecone';
import { checkQueryRelevancy } from './openai';
import { NotRelevantError } from './errors';
import { CachedAnswer } from '../types/answers';
import { OpenPerplexSource } from '../types/openperplex';
import { convertSourcesToCitations, addCitationsToPoints, parseContentSections } from '../utils/sourceParser';
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

    const canMakeRequest = await checkAndUpdateRequestLimit();
    if (!canMakeRequest) {
      throw new Error('Daily request limit reached. Please try again tomorrow.');
    }

    const response = await fetch('/.netlify/functions/query-openperplex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
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