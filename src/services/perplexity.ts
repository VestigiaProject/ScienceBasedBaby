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
    console.log('❌ No authenticated user found');
    throw new Error('User not authenticated');
  }

  console.log('🔍 Checking request limit for user:', user.uid);
  
  const subscriptionDoc = doc(db, 'subscriptions', user.uid);
  const subscription = await getDoc(subscriptionDoc);
  const data = subscription.data();

  if (!data) {
    console.log('❌ No subscription data found for user:', user.uid);
    throw new Error('No subscription data found');
  }

  console.log('📊 Current subscription data:', {
    tracking: data.requestTracking,
    timestamp: new Date().toISOString()
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Get current tracking or initialize new
  const currentTracking = data.requestTracking || { requestCount: 0, date: 0 };
  console.log('📊 Current tracking:', currentTracking);

  // If it's a new day or no previous tracking
  if (currentTracking.date !== today) {
    console.log('📅 New day detected, resetting count');
    await setDoc(subscriptionDoc, {
      ...data,
      requestTracking: {
        requestCount: 1,
        date: today
      }
    }, { merge: true });
    console.log('✅ Counter reset to 1 for new day');
    return true;
  }

  // Check if under limit
  if (!currentTracking.requestCount || currentTracking.requestCount < DAILY_REQUEST_LIMIT) {
    const newCount = (currentTracking.requestCount || 0) + 1;
    console.log(`📈 Incrementing count from ${currentTracking.requestCount} to ${newCount}`);
    await setDoc(subscriptionDoc, {
      ...data,
      requestTracking: {
        requestCount: newCount,
        date: today
      }
    }, { merge: true });
    console.log('✅ Successfully updated count');
    return true;
  }

  console.log('❌ Daily limit reached:', currentTracking.requestCount);
  return false;
}

function parsePerplexityResponse(content: string, rawResponse: any): CachedAnswer {
  const sections = content.split('###').filter(Boolean);
  const result: CachedAnswer = {
    pros: [],
    cons: [],
    citations: []
  };

  sections.forEach(section => {
    const lines = section.trim().split('\n').filter(Boolean);
    const header = lines[0].toLowerCase();
    lines.shift();

    if (header.includes('pros')) {
      result.pros = lines
        .filter(line => line.startsWith('-') || line.startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());
    } else if (header.includes('cons')) {
      result.cons = lines
        .filter(line => line.startsWith('-') || line.startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());
    }
  });

  if (rawResponse?.citations?.length > 0) {
    result.citations = rawResponse.citations.map((url: string, index: number) => ({
      id: index + 1,
      text: url,
      url: url
    }));
  }

  return result;
}

export async function queryPerplexity(question: string): Promise<CachedAnswer> {
  try {
    console.log('🔍 Starting query process for:', question);
    
    console.log('Checking query relevancy...');
    const { isRelevant, debug } = await checkQueryRelevancy(question);
    console.log('Relevancy check result:', { isRelevant, debug });
    
    if (!isRelevant) {
      console.log('❌ Query deemed not relevant');
      throw new NotRelevantError();
    }

    console.log('🔍 Searching for cached similar answers...');
    const cachedAnswer = await findSimilarAnswer(question);
    if (cachedAnswer) {
      console.log('✅ Found cached answer:', cachedAnswer);
      return cachedAnswer;
    }
    console.log('❌ No cached answer found, proceeding with Perplexity API');

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

    if (result.pros.length === 0 && result.cons.length === 0) {
      console.warn('⚠️ Warning: Parsed result has no pros or cons');
      throw new Error('Failed to parse response: no valid content found');
    }

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