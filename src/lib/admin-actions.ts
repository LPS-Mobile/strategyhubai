'use server';

import { z } from 'zod';
import { adminAuth, adminDb, verifyIdToken } from '@/lib/firebase-admin'; 
import { revalidatePath } from 'next/cache';

// --- 🔒 SECURITY HELPER (ADD THIS) ---
// This ensures only real admins can call these functions
async function assertAdmin(idToken: string) {
  const decodedToken = await verifyIdToken(idToken);
  if (!decodedToken) throw new Error('Unauthenticated.');
  
  const adminDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
  if (adminDoc.data()?.role !== 'admin') throw new Error('Unauthorized: Admin access required.');
  
  return decodedToken.uid;
}

// --- SCHEMAS ---
const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  status: z.string(),
});

// New Schema for Updates
const UpdateUserSchema = z.object({
  userId: z.string(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
});

// --- 1. CREATE USER (Update your existing one to verify admin) ---
export async function createNewUser(prevState: any, formData: FormData) {
  // SECURITY CHECK: You must pass the token in a hidden input or handle auth differently. 
  // For form actions, it's harder to pass the token. 
  // Ideally, use a client-side fetch for admin actions or trust the session cookie if using next-auth.
  // For now, we will leave your create function as is, but be aware of the risk.
  
  // ... (Your existing createNewUser code here) ...
}

// --- 2. DELETE USER (Updated with Security) ---
export async function deleteUser(idToken: string, userId: string) {
  try {
    await assertAdmin(idToken); // 🔒 Protect this function

    if (!userId) return { message: 'Error: User ID is required.' };

    await adminAuth.deleteUser(userId);
    await adminDb.collection('users').doc(userId).delete();
    
    revalidatePath('/dashboard/admin');
    return { success: true, message: 'User deleted successfully.' };
  } catch (error: any) {
    console.error('Delete Error:', error);
    return { success: false, message: error.message };
  }
}

// --- 3. NEW: UPDATE CREDENTIALS (The feature you requested) ---
export async function updateUserCredentials(
  idToken: string, 
  targetUserId: string, 
  newEmail?: string, 
  newPassword?: string
) {
  try {
    await assertAdmin(idToken); // 🔒 Protect this function

    const updates: any = {};
    
    // Validate inputs
    if (newEmail && newEmail.trim() !== '') {
      const emailValidation = z.string().email().safeParse(newEmail);
      if (!emailValidation.success) return { success: false, message: 'Invalid email format.' };
      updates.email = newEmail;
    }

    if (newPassword && newPassword.trim() !== '') {
      if (newPassword.length < 6) return { success: false, message: 'Password too short (min 6).' };
      updates.password = newPassword;
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, message: 'No changes provided.' };
    }

    // Update Auth
    await adminAuth.updateUser(targetUserId, updates);

    // Update Firestore if email changed
    if (updates.email) {
      await adminDb.collection('users').doc(targetUserId).update({
        email: updates.email
      });
    }

    revalidatePath('/dashboard/admin');
    return { success: true, message: 'User updated successfully' };

  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, message: error.message };
  }
}