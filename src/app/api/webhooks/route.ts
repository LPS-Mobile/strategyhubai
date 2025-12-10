import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia', // Update to match your Stripe version
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper to map Price IDs to Tier Names for your DB
const getTierName = (priceId: string) => {
  const mapping: Record<string, string> = {
    'price_1STvdFDATCpMStKark5BCxZ5': 'curious retail',
    'price_1STvdmDATCpMStKax7SvIXGp': 'active trader',
    'price_1STveGDATCpMStKaynj3Y0N6': 'quant edge',
  };
  return mapping[priceId] || 'free';
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // --- EVENT HANDLERS ---
  
  try {
    switch (event.type) {
      // 1. New Subscription Created (Checkout Success)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // We look for the firebaseUid we (should have) attached to metadata during checkout
        // If not found, we fallback to searching by email
        const uid = session.metadata?.firebaseUid;
        const customerId = session.customer as string;
        
        if (uid) {
           await updateUser(uid, customerId, session.subscription as string);
        } else if (session.customer_details?.email) {
           await updateUserByEmail(session.customer_details.email, customerId, session.subscription as string);
        }
        break;
      }

      // 2. Subscription Updated (Upgrades, Downgrades, Renewals)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionStatus(subscription);
        break;
      }

      // 3. Subscription Deleted (Cancelled)
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionStatus(subscription, true); // true = force cancel
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (error) {
    console.error('Webhook handler failed:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// --- HELPER FUNCTIONS ---

// Update User based on Subscription Object
async function syncSubscriptionStatus(subscription: Stripe.Subscription, isDeleted = false) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0].price.id;
  const status = subscription.status; // active, past_due, trialing
  
  // Map Stripe Price ID to your App's Tier Name
  let tier = getTierName(priceId);
  if (isDeleted || status === 'canceled') {
    tier = 'free';
  }

  // Find user by Stripe Customer ID
  const usersRef = adminDb.collection('users');
  const query = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (query.empty) {
    console.log(`No user found for Stripe Customer: ${customerId}`);
    return;
  }

  // Update ALL matching documents (usually just one)
  const batch = adminDb.batch();
  
  query.forEach((doc) => {
    batch.set(doc.ref, {
      subscriptionStatus: tier, // 'active trader', 'quant edge', or 'free'
      stripeSubscriptionId: subscription.id,
      stripeStatus: status, // technical status from stripe
      currentPeriodEnd: new Date(subscription.current_period_end * 1000), // Convert UNIX timestamp
      updatedAt: new Date(),
    }, { merge: true });
  });

  await batch.commit();
  console.log(`Synced subscription for customer ${customerId} to tier: ${tier}`);
}

// Initial linkage after Checkout
async function updateUser(uid: string, customerId: string, subscriptionId: string) {
  // We need to fetch the subscription details to know WHICH plan they bought
  // (Checkout session doesn't contain the price ID directly in the main object)
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  await adminDb.collection('users').doc(uid).set({
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    // Recursively call the sync logic to set the tier correctly
  }, { merge: true });
  
  await syncSubscriptionStatus(subscription);
}

// Fallback: Find user by email if metadata was missed
async function updateUserByEmail(email: string, customerId: string, subscriptionId: string) {
  const usersRef = adminDb.collection('users');
  const query = await usersRef.where('email', '==', email).get();

  if (query.empty) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const batch = adminDb.batch();
  query.forEach((doc) => {
    batch.set(doc.ref, { 
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId
    }, { merge: true });
  });
  await batch.commit();

  await syncSubscriptionStatus(subscription);
}