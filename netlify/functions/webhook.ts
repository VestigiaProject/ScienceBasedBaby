import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}

const db = getFirestore();

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    console.log('Received webhook event');
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      webhookSecret
    );

    console.log('Webhook event type:', stripeEvent.type);

    // Handle subscription events
    if (stripeEvent.type === 'customer.subscription.created' ||
        stripeEvent.type === 'customer.subscription.updated' ||
        stripeEvent.type === 'customer.subscription.deleted') {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      
      // Get customer ID
      const customerId = subscription.customer as string;
      
      // Retrieve customer to get metadata
      const customer = await stripe.customers.retrieve(customerId);
      console.log('Customer data:', customer);
      
      // Get userId from customer metadata
      const userId = typeof customer === 'object' && !('deleted' in customer) ? 
        customer.metadata.userId : null;

      if (!userId) {
        console.error('No userId found in customer metadata');
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No userId found in customer metadata' }),
        };
      }

      console.log('Updating subscription for user:', userId, 'Status:', subscription.status);

      // Update Firestore
      await db.collection('subscriptions').doc(userId).set({
        subscriptionId: subscription.id,
        customerId: customerId,
        status: subscription.status,
        priceId: subscription.items.data[0].price.id,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: Date.now(),
      }, { merge: true });

      console.log('Successfully updated subscription in Firestore');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook error' }),
    };
  }
}