import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const db = getFirestore();

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get subscription data from Firestore
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const subscription = subDoc.data();

    if (!subscription?.subscriptionId) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: 'No active subscription found' }) 
      };
    }

    // Cancel the subscription at period end
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.subscriptionId,
      { cancel_at_period_end: true }
    );

    // Update Firestore
    await db.collection('subscriptions').doc(userId).update({
      cancelAtPeriodEnd: true,
      updatedAt: Date.now()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Subscription will be canceled at the end of the billing period',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: updatedSubscription.current_period_end
      })
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}