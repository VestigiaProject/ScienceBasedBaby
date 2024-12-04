import { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const BASE_URL = 'https://44c57909-d9e2-41cb-9244-9cd4a443cb41.app.bhs.ai.cloud.ovh.net';
const DAILY_REQUEST_LIMIT = 35;

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}

const db = getFirestore();

async function initializeSubscriptionData(userId: string) {
  const subscriptionRef = db.collection('subscriptions').doc(userId);
  
  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(subscriptionRef);
      const data = doc.data();
      
      if (!data) {
        // Initialize with default values if no data exists
        transaction.set(subscriptionRef, {
          status: 'active', // Assuming active since they can make requests
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
          cancelAtPeriodEnd: false,
          requestTracking: {
            requestCount: 0,
            date: 0
          },
          updatedAt: Date.now()
        });
      } else if (!data.requestTracking) {
        // Add request tracking if missing
        transaction.update(subscriptionRef, {
          requestTracking: {
            requestCount: 0,
            date: 0
          },
          updatedAt: Date.now()
        });
      }
    });
  } catch (error) {
    console.error('Failed to initialize subscription data:', error);
    throw error;
  }
}

async function checkAndUpdateRequestLimit(userId: string): Promise<boolean> {
  const subscriptionRef = db.collection('subscriptions').doc(userId);
  
  try {
    let result = false;
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(subscriptionRef);
      const data = doc.data();

      if (!data || !data.requestTracking) {
        await initializeSubscriptionData(userId);
        result = true;
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      const currentTracking = data.requestTracking;

      if (currentTracking.date !== today) {
        transaction.update(subscriptionRef, {
          requestTracking: {
            requestCount: 1,
            date: today
          },
          updatedAt: Date.now()
        });
        result = true;
      } else if (!currentTracking.requestCount || currentTracking.requestCount < DAILY_REQUEST_LIMIT) {
        const newCount = (currentTracking.requestCount || 0) + 1;
        transaction.update(subscriptionRef, {
          requestTracking: {
            requestCount: newCount,
            date: today
          },
          updatedAt: Date.now()
        });
        result = true;
      }
    });

    return result;
  } catch (error) {
    console.error('Failed to check/update request limit:', error);
    throw error;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('🔍 Starting OpenPerplex query...');
    
    // Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { question } = JSON.parse(event.body || '');

    if (!question) {
      console.log('❌ No question provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question is required' })
      };
    }

    // Check request limit
    const canMakeRequest = await checkAndUpdateRequestLimit(userId);
    if (!canMakeRequest) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Daily request limit reached. Please try again tomorrow.' })
      };
    }

    const systemPrompt = `You are a scientific research assistant specializing in pregnancy and parenting topics.
For the given question, look up evidence-based information ONLY from peer-reviewed scientific studies and medical research websites like pubmed.ncbi.nlm.nih.gov, jamanetwork.com, ncbi.nlm.nih.gov.

CRITICAL: Format your response EXACTLY as follows, using these EXACT markers:

<PROS>
• Each evidence-supported benefit or positive finding
• One point per line, starting with •
• If no evidence-based pros exist, include ONLY something like: • No scientifically proven benefits found
</PROS>

<CONS>
• Each evidence-supported risk or concern
• One point per line, starting with •
• If no evidence-based cons exist, include ONLY something like: • No scientifically proven risks found
</CONS>

IMPORTANT:
- Use ONLY the exact markers <PROS>, </PROS>, <CONS>, </CONS>
- Start each point with • (bullet point)
- If no evidence exists for pros or cons, explicitly state that.`;

    console.log('📝 Sending request to OpenPerplex...');
    const response = await fetch(`${BASE_URL}/custom_search`, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.OPENPERPLEX_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_prompt: question,
        system_prompt: systemPrompt,
        location: 'us',
        pro_mode: true,
        search_type: 'general',
        return_images: false,
        return_sources: true,
        recency_filter: 'anytime',
        temperature: 0.2,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ OpenPerplex response received:', {
      hasResponse: !!data.llm_response,
      responseLength: data.llm_response?.length,
      sourcesCount: data.sources?.length,
      responseTime: data.response_time
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        choices: [{
          message: {
            content: data.llm_response
          }
        }],
        sources: data.sources || []
      })
    };
  } catch (error) {
    console.error('❌ OpenPerplex API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to query OpenPerplex API',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}