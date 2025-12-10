import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions'; // 🔑 NEW: Import getFunctions SDK

const firebaseConfig = {
  apiKey: "AIzaSyA5HZQmwiwUZrNqGN1xvqbVHSb-jvepUoo",
  authDomain: "strategyhub.firebaseapp.com",
  projectId: "strategyhub",
  storageBucket: "strategyhub.firebasestorage.app",
  messagingSenderId: "559204961023",
  appId: "1:559204961023:web:5580d12e8a142a89b45aca"
};

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Core Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔑 NEW: Export the functions instance, set to the default region
export const functions = getFunctions(app, 'us-central1');