import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin'; // Ensure you have firebase-admin set up

// If you DO NOT have firebase-admin set up yet, 
// delete the adminDb import and the adminDb.collection code block below,
// and just rely on your Stripe Webhook to update the user later.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    const { uid, stripeSessionId } = await request.json();

    if (!stripeSessionId || !uid) {
      return NextResponse.json({ message: 'Missing Data' }, { status: 400 });
    }

    // 1. Verify Payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ message: 'Not Paid' }, { status: 403 });
    }

    // 2. Immediate DB Update (Faster than webhook)
    // Only works if you have firebase-admin initialized
    if (adminDb) {
       // Map price ID to your role names
       const priceId = session.line_items?.data[0]?.price?.id; 
       // You might need to fetch line items if they aren't in the session object directly
       
       await adminDb.collection('users').doc(uid).set({
        subscriptionStatus: 'active',
        stripeCustomerId: session.customer,
        email: session.customer_details?.email,
        updatedAt: new Date(),
      }, { merge: true });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Sync Error:", error);
    // Return 500 but JSON, so frontend doesn't crash with "<" token error
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}