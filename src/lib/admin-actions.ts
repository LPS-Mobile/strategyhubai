'use server';

import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Assumes you have this file
import { revalidatePath } from 'next/cache';

// Define a schema for the new user form data
const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  status: z.string(), // e.g., 'Inactive', 'Admin', 'Curious Retail'
});

/**
 * Creates a new user in Firebase Authentication and Firestore.
 * Called from the AddUserModal.
 */
export async function createNewUser(prevState: any, formData: FormData) {
  // 1. Validate the form data
  const validatedFields = UserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors
  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, status } = validatedFields.data;

  try {
    // 2. Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      emailVerified: true, // Assuming admin-created users are verified
      disabled: false,
    });

    // 3. Determine the data to save in Firestore
    let roleToSave: string | null = null;
    let statusToSave: string | null = null;

    if (status === 'Admin') {
      roleToSave = 'admin';
    } else if (status !== 'Inactive') {
      statusToSave = status; // Saves 'Curious Retail', 'Active Trader', etc.
    }

    // 4. Create the corresponding user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: email, // Use email as default display name
      role: roleToSave,
      subscriptionStatus: statusToSave,
      createdAt: new Date(), // Good practice to add a creation timestamp
    });

    // 5. Revalidate the admin dashboard path to show the new user
    revalidatePath('/dashboard/admin');

    return { message: 'User created successfully!', errors: null };
  } catch (error: any) {
    // Handle common errors, e.g., "email-already-exists"
    return {
      message: `Error creating user: ${error.message || 'Unknown error'}`,
      errors: null,
    };
  }
}

/**
 * Deletes a user from both Firebase Authentication and Firestore.
 * Called from the UserAdminTable.
 */
export async function deleteUser(userId: string) {
  if (!userId) {
    return { message: 'Error: User ID is required.' };
  }

  try {
    // 1. Delete the user from Firebase Authentication
    await adminAuth.deleteUser(userId);

    // 2. Delete the user's document from Firestore
    await adminDb.collection('users').doc(userId).delete();

    // 3. Revalidate the admin dashboard path to refresh the data
    revalidatePath('/dashboard/admin');

    return { message: 'User deleted successfully.' };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    // Handle common errors, e.g., 'auth/user-not-found'
    return { message: `Error deleting user: ${error.message}` };
  }
}