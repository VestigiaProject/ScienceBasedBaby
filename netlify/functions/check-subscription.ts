import { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}

const db = getFirestore();

export const handler: Handler = async (event) => {
  try {
    // Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'Unauthorized' }) 
      };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log('Checking subscription for user:', userId);

    // Get subscription data
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const subscription = subDoc.data();

    console.log('Retrieved subscription data:', subscription);

    if (!subscription) {
      console.log('No subscription found for user:', userId);
      return {
        statusCode: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ 
          hasActiveSubscription: false,
          subscriptionStatus: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          timestamp: Date.now()
        })
      };
    }

    // Check if subscription is active and not expired
    const currentTime = Date.now() / 1000;
    const hasActiveSubscription = 
      subscription.status === 'active' && 
      subscription.currentPeriodEnd > currentTime;

    console.log('Subscription status check:', {
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentTime,
      hasActiveSubscription
    });

    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ 
        hasActiveSubscription,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        timestamp: Date.now()
      })
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      statusCode: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}