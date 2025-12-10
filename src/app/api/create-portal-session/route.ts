import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia', // Update to match your Stripe version
});

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // 1. Verify User
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // 2. Determine Return URL (Safety Fallback)
    // Tries ENV var first, falls back to the request origin (localhost)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.get('origin') || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/dashboard`;

    // 3. Get/Create Customer ID
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    let customerId = userData?.stripeCustomerId;

    if (!customerId) {
      console.log(`Creating Stripe ID for user ${uid}`);
      const customer = await stripe.customers.create({
        email: email,
        metadata: { firebaseUid: uid },
      });
      customerId = customer.id;
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    // 4. Create Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl, 
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}