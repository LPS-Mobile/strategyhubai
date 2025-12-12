'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { revalidatePath } from 'next/cache';

// --- 1. INITIALIZE FIREBASE ADMIN (Server Side Only) ---
function initAdmin() {
  if (!getApps().length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        initializeApp({
            credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
    } else {
        // Fallback for dev if env vars aren't perfect, or throw error
        console.error("Missing Firebase Admin Env Vars");
    }
  }
}

// Ensure it's initialized before any action runs
initAdmin();

const db = getFirestore();
const auth = getAuth();

// --- 2. TYPES ---

// This type MUST match what useFormState expects
export type ActionState = {
  message: string;
  errors: Record<string, string[]> | null;
};

// --- 3. SERVER ACTIONS ---

/**
 * Creates a new user in Authentication AND Firestore.
 * Used by AddUserModal with useFormState.
 */
export async function createNewUser(
  prevState: ActionState, 
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const status = formData.get('status') as string; // 'Inactive', 'Active Trader', etc.
  const role = status === 'Admin' ? 'admin' : 'user';

  // 1. Basic Validation
  const errors: Record<string, string[]> = {};
  if (!email || !email.includes('@')) errors.email = ['Invalid email address.'];
  if (!password || password.length < 6) errors.password = ['Password must be at least 6 characters.'];

  if (Object.keys(errors).length > 0) {
    return { message: 'Validation failed', errors };
  }

  try {
    // 2. Create Auth User
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: email.split('@')[0], // Default name
    });

    // 3. Create Firestore Document
    // We map the dropdown "Status" (e.g., 'Curious Retail') to subscriptionStatus
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: role,
      subscriptionStatus: status === 'Inactive' ? 'free' : status, // specific plan name
      createdAt: new Date(),
    });

    // 4. Revalidate to refresh the table UI
    revalidatePath('/dashboard/admin');

    return { message: 'User created successfully!', errors: null };

  } catch (error: any) {
    console.error('Create User Error:', error);
    return { 
      message: error.message || 'Failed to create user.', 
      errors: null 
    };
  }
}

/**
 * Updates a user's email or password.
 * Used by UserAdminTable (direct async call, not useFormState).
 */
export async function updateUserCredentials(
  adminIdToken: string, 
  targetUid: string, 
  newEmail: string, 
  newPassword?: string
) {
  try {
    // 1. Security Check: Verify the requester is actually an admin
    const decodedToken = await auth.verifyIdToken(adminIdToken);
    
    // Check custom claims or firestore role
    const adminDoc = await db.collection('users').doc(decodedToken.uid).get();
    const adminData = adminDoc.data();
    
    if (adminData?.role !== 'admin') {
        throw new Error("Unauthorized: You are not an admin.");
    }

    // 2. Prepare Update Object
    const updateData: any = { email: newEmail };
    if (newPassword && newPassword.trim() !== '') {
      updateData.password = newPassword;
    }

    // 3. Update Auth
    await auth.updateUser(targetUid, updateData);

    // 4. Update Firestore Email (to keep sync)
    await db.collection('users').doc(targetUid).update({
      email: newEmail
    });

    revalidatePath('/dashboard/admin');
    return { success: true, message: 'User updated' };

  } catch (error: any) {
    console.error('Update Error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Deletes a user from Auth and Firestore.
 */
export async function deleteUser(adminIdToken: string, targetUid: string) {
  try {
    // 1. Security Check
    const decodedToken = await auth.verifyIdToken(adminIdToken);
    const adminDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (adminDoc.data()?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    // 2. Delete from Auth
    await auth.deleteUser(targetUid);

    // 3. Delete from Firestore
    await db.collection('users').doc(targetUid).delete();

    revalidatePath('/dashboard/admin');
    return { success: true, message: 'User deleted' };

  } catch (error: any) {
    console.error('Delete Error:', error);
    return { success: false, message: error.message };
  }
}