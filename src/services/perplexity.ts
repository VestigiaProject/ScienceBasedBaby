import { findSimilarAnswer, cacheAnswer } from './pinecone';
import { checkQueryRelevancy } from './openai';
import { NotRelevantError } from './errors';
import { CachedAnswer } from '../types/answers';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const DAILY_REQUEST_LIMIT = 35;

async function checkAndUpdateRequestLimit(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const subscriptionDoc = doc(db, 'subscriptions', user.uid);
  const subscription = await getDoc(subscriptionDoc);
  const data = subscription.data();

  if (!data) throw new Error('No subscription data found');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const requestData = {
    requestCount: ((data.requestTracking?.date === today) ? data.requestTracking.count : 0) + 1,
    date: today
  };

  // Check if we're under the limit or it's a new day
  if (data.requestTracking?.date !== today || data.requestTracking?.count < DAILY_REQUEST_LIMIT) {
    try {
      await updateDoc(subscriptionDoc, {
        requestTracking: requestData
      });
      return true;
    } catch (error) {
      console.error('Failed to update request tracking:', error);
      // If we fail to update tracking, still allow the request
      return true;
    }
  }

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

    // Check request limit before making Perplexity API call
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