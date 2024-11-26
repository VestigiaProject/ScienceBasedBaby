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
  
  // If it's a new day or no tracking exists, reset the counter
  if (!data.requestTracking?.date || data.requestTracking.date !== today) {
    const requestData = {
      count: 1,
      date: today
    };
    
    await updateDoc(subscriptionDoc, {
      requestTracking: requestData
    });
    return true;
  }

  // Check if we're under the limit
  if (data.requestTracking.count < DAILY_REQUEST_LIMIT) {
    const requestData = {
      count: data.requestTracking.count + 1,
      date: today
    };
    
    await updateDoc(subscriptionDoc, {
      requestTracking: requestData
    });
    return true;
  }

  return false;
}

function parsePerplexityResponse(content: string): CachedAnswer {
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
    } else if (header.includes('citations')) {
      result.citations = lines
        .filter(line => line.startsWith('['))
        .map((line, index) => {
          const urlMatch = line.match(/https?:\/\/[^\s]+/);
          return {
            id: index + 1,
            text: line.trim(),
            url: urlMatch ? urlMatch[0] : undefined
          };
        });
    }
  });

  return result;
}

export async function queryPerplexity(
  question: string,
  onPartialResponse?: (partial: Partial<CachedAnswer>) => void
): Promise<CachedAnswer> {
  try {
    console.log('🔍 Starting query process for:', question);
    
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
      body: JSON.stringify({ question, stream: true })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.choices?.[0]?.delta?.content) {
            fullContent += data.choices[0].delta.content;
            if (onPartialResponse) {
              const partialResult = parsePerplexityResponse(fullContent);
              onPartialResponse(partialResult);
            }
          }
        }
      }
    }

    const result = parsePerplexityResponse(fullContent);

    if (result.pros.length === 0 && result.cons.length === 0) {
      throw new Error('Failed to parse response: no valid content found');
    }

    await cacheAnswer(question, result);
    return result;
  } catch (error) {
    console.error('❌ Error in queryPerplexity:', error);
    if (error instanceof NotRelevantError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to get scientific analysis. Please try again.');
  }
}