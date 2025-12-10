import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// IMPORTANT: Download your service account key JSON from Firebase
// and add these values to your .env.local file.
// DO NOT commit this file or your .env.local file to GitHub.

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Use .replace to handle newline characters in the private key
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let app: App;

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  app = getApps()[0];
}

const adminAuth: Auth = getAuth(app);
const adminDb: Firestore = getFirestore(app);

// --- ADDED THIS EXPORT ---
export const verifyIdToken = async (token: string) => {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
};

export { adminAuth, adminDb };