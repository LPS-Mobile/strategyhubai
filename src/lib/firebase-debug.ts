// src/lib/firebase-debug.ts
import { auth, db } from './firebase';

export function debugFirebaseConfig() {
  console.log('=== Firebase Debug Info ===');
  
  // Check Auth
  console.log('Auth instance:', auth ? '✓ Connected' : '✗ Not connected');
  console.log('Auth app name:', auth?.app?.name);
  
  // FIX: Access configuration from app.options instead of auth.config
  const options = auth?.app?.options as any; // Cast to 'any' to avoid strict type checks

  console.log('Auth config:', {
    apiKey: options?.apiKey?.substring(0, 10) + '...',
    authDomain: options?.authDomain,
    projectId: options?.projectId,
  });
  
  // Check Firestore
  console.log('Firestore instance:', db ? '✓ Connected' : '✗ Not connected');
  console.log('Firestore app name:', db?.app?.name);
  
  // Check current user
  console.log('Current user:', auth?.currentUser?.email || 'Not logged in');
  
  console.log('=========================');
}