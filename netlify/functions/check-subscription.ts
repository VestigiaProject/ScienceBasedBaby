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
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const subscription = subDoc.data();

    const hasActiveSubscription = subscription?.status === 'active' && 
      subscription?.currentPeriodEnd > Date.now() / 1000;

    return {
      statusCode: 200,
      body: JSON.stringify({ hasActiveSubscription }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}