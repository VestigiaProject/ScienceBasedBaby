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

    // Handle various subscription and payment events
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const subscription = stripeEvent.type.startsWith('invoice.') 
          ? (stripeEvent.data.object as Stripe.Invoice).subscription
          : (stripeEvent.data.object as Stripe.Subscription).id;

        if (typeof subscription === 'string') {
          // Fetch full subscription details
          const subscriptionData = await stripe.subscriptions.retrieve(subscription);
          
          // Get customer ID
          const customerId = subscriptionData.customer as string;
          
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

          console.log('Updating subscription for user:', userId, 'Status:', subscriptionData.status);

          // Update Firestore with comprehensive subscription data
          await db.collection('subscriptions').doc(userId).set({
            subscriptionId: subscriptionData.id,
            customerId: customerId,
            status: subscriptionData.status,
            priceId: subscriptionData.items.data[0].price.id,
            currentPeriodStart: subscriptionData.current_period_start,
            currentPeriodEnd: subscriptionData.current_period_end,
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
            updatedAt: Date.now(),
            lastEventType: stripeEvent.type,
            lastInvoiceStatus: stripeEvent.type.startsWith('invoice.') 
              ? (stripeEvent.data.object as Stripe.Invoice).status 
              : null
          }, { merge: true });

          console.log('Successfully updated subscription in Firestore');
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customer = await stripe.customers.retrieve(session.customer as string);
          
          if (typeof customer === 'object' && !('deleted' in customer)) {
            const userId = customer.metadata.userId;
            
            console.log('Checkout completed for user:', userId, 'Subscription:', subscription.id);
            
            await db.collection('subscriptions').doc(userId).set({
              subscriptionId: subscription.id,
              customerId: customer.id,
              status: subscription.status,
              priceId: subscription.items.data[0].price.id,
              currentPeriodStart: subscription.current_period_start,
              currentPeriodEnd: subscription.current_period_end,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              updatedAt: Date.now(),
              lastEventType: stripeEvent.type
            }, { merge: true });
          }
        }
        break;
      }
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