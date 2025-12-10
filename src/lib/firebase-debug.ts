// src/lib/firebase-debug.ts
// Add this temporarily to check your Firebase config

import { auth, db } from './firebase';

export function debugFirebaseConfig() {
  console.log('=== Firebase Debug Info ===');
  
  // Check Auth
  console.log('Auth instance:', auth ? '✓ Connected' : '✗ Not connected');
  console.log('Auth app name:', auth?.app?.name);
  console.log('Auth config:', {
    apiKey: auth?.config?.apiKey?.substring(0, 10) + '...',
    authDomain: auth?.config?.authDomain,
    projectId: auth?.config?.projectId,
  });
  
  // Check Firestore
  console.log('Firestore instance:', db ? '✓ Connected' : '✗ Not connected');
  console.log('Firestore app name:', db?.app?.name);
  
  // Check current user
  console.log('Current user:', auth?.currentUser?.email || 'Not logged in');
  
  console.log('=========================');
}

// Call this in your component to test:
// import { debugFirebaseConfig } from '@/lib/firebase-debug';
// debugFirebaseConfig();