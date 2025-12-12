// src/app/api/auth/sync-subscription/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin'; 

// Initialize Stripe with your specific version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover' as any, 
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

    // 2. Update Firestore via Admin SDK
    if (adminDb) {
       await adminDb.collection('users').doc(uid).set({
        subscriptionStatus: 'active',
        stripeCustomerId: session.customer,
        email: session.customer_details?.email,
        updatedAt: new Date(),
        // Optional: Store the session ID to prevent reusing it
        lastPaymentSessionId: stripeSessionId 
      }, { merge: true });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}