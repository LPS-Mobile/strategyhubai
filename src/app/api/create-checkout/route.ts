// src/app/api/create-checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover' as any, 
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, idToken } = await request.json();

    // Validate input
    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing priceId' },
        { status: 400 }
      );
    }

    let uid = null;
    let email = null;

    // If user is logged in, verify their token
    if (idToken) {
      try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        uid = decodedToken.uid;
        email = decodedToken.email;
        console.log(`Creating checkout for logged-in user ${uid} with email ${email}`);
      } catch (error) {
        console.error('Invalid token, proceeding as guest:', error);
      }
    } else {
      console.log('Creating checkout for guest user');
    }

    // Create Stripe checkout session
    const sessionConfig: any = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
    };

    // Add user info if logged in
    if (uid) {
      sessionConfig.metadata = { firebaseUid: uid };
    }
    
    if (email) {
      sessionConfig.customer_email = email;
    } else {
      // For guests, Stripe will collect email at checkout
      sessionConfig.billing_address_collection = 'required';
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`Checkout session created: ${session.id}`);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url // Return the checkout URL directly
    });
    
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}