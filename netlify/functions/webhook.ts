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
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Missing stripe signature or webhook secret');
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Missing stripe signature or webhook secret' })
    };
  }

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
          try {
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
                statusCode: 200, // Still return 200 to acknowledge the webhook
                body: JSON.stringify({ 
                  received: true,
                  warning: 'No userId found in customer metadata' 
                }),
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
          } catch (error) {
            console.error('Error processing subscription data:', error);
            // Still return 200 to acknowledge receipt of the webhook
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                received: true,
                warning: 'Error processing subscription data' 
              }),
            };
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          try {
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
          } catch (error) {
            console.error('Error processing checkout session:', error);
            // Still return 200 to acknowledge receipt of the webhook
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                received: true,
                warning: 'Error processing checkout session' 
              }),
            };
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    // Return 400 for signature verification errors, 200 for other errors
    // This ensures Stripe knows we received the webhook even if processing failed
    const statusCode = error instanceof Stripe.errors.StripeSignatureVerificationError ? 400 : 200;
    return {
      statusCode,
      body: JSON.stringify({ 
        error: 'Webhook error',
        details: error instanceof Error ? error.message : 'Unknown error',
        received: statusCode === 200 // Indicate if we're acknowledging receipt
      }),
    };
  }
}