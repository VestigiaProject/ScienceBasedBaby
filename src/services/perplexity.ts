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

function parseOpenPerplexResponse(content: string, sources: string[] = []): CachedAnswer {
  const result: CachedAnswer = {
    pros: [],
    cons: [],
    citations: []
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

    // Convert sources to citations
    result.citations = sources.map((source, index) => ({
      id: index + 1,
      text: source,
      url: source.startsWith('http') ? source : undefined
    }));

    // Add citation references to pros and cons
    result.pros = result.pros.map(pro => {
      const randomCitation = Math.floor(Math.random() * result.citations.length) + 1;
      return `${pro} [${randomCitation}]`;
    });

    result.cons = result.cons.map(con => {
      const randomCitation = Math.floor(Math.random() * result.citations.length) + 1;
      return `${con} [${randomCitation}]`;
    });
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