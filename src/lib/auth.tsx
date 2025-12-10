'use client';

import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState, useEffect, ReactNode } from 'react';

// --- 1. useAuthUser Hook ---
// This is the core hook that gets user, subscription, and role
export const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null); // For admin
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up any old Firestore listener
      unsubscribeFirestore();

      if (user) {
        setUser(user);
        // Listen to the user's document
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            // Get subscription status AND role
            setSubscriptionStatus(data.subscriptionStatus || null);
            setRole(data.role || null);
          } else {
            // User is authenticated, but no doc exists
            setSubscriptionStatus(null);
            setRole(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user doc:", error);
          setSubscriptionStatus(null);
          setRole(null);
          setLoading(false);
        });
      } else {
        // User is logged out
        setUser(null);
        setSubscriptionStatus(null);
        setRole(null);
        setLoading(false);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  return { 
    user, 
    loading, 
    uid: user?.uid || null, 
    subscriptionStatus, 
    role // Return the role
  };
};

// --- 2. useSignOut Hook ---
export const useSignOut = () => {
  const router = useRouter();
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out successfully.');
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  return handleSignOut;
};


// --- 3. ProtectLogin (Login Guard) ---
// For FREE pages that just require login (e.g., /dashboard)
export function ProtectLogin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to load
    if (!user) {
      router.push('/'); // Not logged in, go home
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }
  if (user) {
    return <>{children}</>; // User is logged in, show the content
  }
  return null; // Render null while redirecting
}

// --- 4. ProtectRoute (Subscription Guard) ---
// For PAID pages (e.g., /strategies)
export function ProtectRoute({ children }: { children: ReactNode }) {
  const { user, subscriptionStatus, loading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth
    if (!user) {
      router.push('/'); // Not logged in
      return;
    }
    // Logged in, but NOT a paying user
    if (user && subscriptionStatus !== 'active') {
      router.push('/#pricing'); // Send to pricing
      return;
    }
  }, [user, subscriptionStatus, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }
  // User is logged in AND has an active subscription
  if (user && subscriptionStatus === 'active') {
    return <>{children}</>; 
  }
  return null; // Render null while redirecting
}

// --- 5. ProtectAdminRoute (Admin Guard) ---
// For ADMIN pages (e.g., /dashboard/admin)
export function ProtectAdminRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth
    
    if (!user) {
      router.push('/'); // Not logged in
      return;
    }
    
    // Logged in, but NOT an admin
    if (user && role !== 'admin') {
      console.warn("Unauthorized admin access attempt.");
      router.push('/dashboard'); // Send to their normal dashboard
      return;
    }
  }, [user, role, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading Admin...</p></div>;
  }
  
  // User is logged in AND is an admin
  if (user && role === 'admin') {
    return <>{children}</>;
  }
  
  return null; // Render null while redirecting
}