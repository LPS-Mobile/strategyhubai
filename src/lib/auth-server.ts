// src/lib/auth-server.ts
import { auth } from 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function verifyAuthToken(token: string) {
  try {
    const decodedToken = await auth().verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
    };
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
}