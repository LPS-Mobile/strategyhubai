// functions/src/index.ts - Firebase Functions v6

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Stripe from 'stripe';

// Define secret for Stripe key (recommended for v6)
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');

// Define the request data interface
interface CheckoutRequest {
  priceId: string;
}

export const createStripeCheckout = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    // Initialize Stripe inside the function with the secret
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2023-10-16',
    });

    const { priceId } = request.data as CheckoutRequest;
    
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email;

    if (!email) {
      throw new HttpsError('invalid-argument', 'User email is required.');
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: priceId, // e.g., 'price_12345' from the Stripe Dashboard
          quantity: 1,
        }],
        // Pass the Firebase user ID to Stripe for webhook correlation
        metadata: { firebaseUid: uid }, 
        customer_email: email,
        
        success_url: 'YOUR_APP_DOMAIN/dashboard/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'YOUR_APP_DOMAIN/pricing',
      });

      return { sessionId: session.id };
      
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      throw new HttpsError('internal', 'Unable to create checkout session.');
    }
  }
);