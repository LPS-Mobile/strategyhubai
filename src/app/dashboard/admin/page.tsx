'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, CollectionReference, DocumentData } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Strategy } from '@/app/strategies/page';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

// Export this interface so child components can use it
export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
  subscriptionStatus: 'active' | 'inactive' | null;
  role: 'admin' | null;
}

export default function AdminPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Fetch Strategies
          const strategiesCol = collection(db, 'strategies') as CollectionReference<DocumentData>;
          const stratSnap = await getDocs(strategiesCol);
          const stratData: Strategy[] = [];
          stratSnap.forEach((doc) => {
            const data = doc.data();
            stratData.push({ id: doc.id, ...(data as Omit<Strategy, 'id'>) } as Strategy);
          });

          // 2. Fetch Users
          const usersCol = collection(db, 'users') as CollectionReference<DocumentData>;
          const userSnap = await getDocs(usersCol);
          const userData: AdminUser[] = [];
          userSnap.forEach((doc) => {
            const data = doc.data();
            userData.push({
              id: doc.id,
              email: data.email || null,
              displayName: data.displayName || null,
              subscriptionStatus: data.subscriptionStatus || null,
              role: data.role || null,
            });
          });

          setStrategies(stratData);
          setUsers(userData);
        } catch (err: any) {
          console.error("Error fetching admin data:", err);
          setError("Failed to load admin data.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">
          Loading Admin Dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 m-8 rounded-lg">
        <h3 className="font-bold">Access Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-10 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Strategy Hub Admin
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage platform content and users.
        </p>
      </header>
      
      <AdminDashboardClient 
        initialStrategies={strategies} 
        initialUsers={users} 
      />
    </div>
  );
}