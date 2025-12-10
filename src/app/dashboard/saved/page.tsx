// src/app/dashboard/saved/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth'; // From your project summary
import { db } from '@/lib/firebase'; // From your project summary
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { StrategyCard } from '@/components/strategies/StrategyCard'; // Reusing the existing component

// Define a type for the strategy data (assuming structure)
interface Strategy {
  id: string;
  name: string;
  // ... other fields like metrics, description, etc.
}

export default function SavedStrategiesPage() {
  const { user } = useAuthUser();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedStrategies = async () => {
      if (!user) {
        setLoading(false);
        return; // Wait for user to be available
      }

      setLoading(true);
      setError(null);
      
      try {
        // 1. Get the user's document to find the list of saved strategy IDs
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error('User data not found.');
        }

        // 2. Get the array of saved strategy IDs (e.g., 'savedStrategies')
        // This field name is assumed based on the StrategyCard save logic
        const savedIds = userDocSnap.data()?.savedStrategies || [];

        if (savedIds.length === 0) {
          setStrategies([]);
          setLoading(false);
          return; // User has no saved strategies
        }

        // 3. Fetch the actual strategy documents from the 'strategies' collection
        // We use the `documentId()` helper to query by the document ID
        // Note: Firestore 'in' queries are limited to 30 items.
        const strategiesQuery = query(
          collection(db, 'strategies'),
          where(documentId(), 'in', savedIds)
        );

        const querySnapshot = await getDocs(strategiesQuery);
        
        const strategiesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Strategy[];

        setStrategies(strategiesData);

      } catch (err) {
        console.error("Error fetching saved strategies:", err);
        setError('Failed to load saved strategies.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedStrategies();
  }, [user]); // Re-run when the user object changes

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Saved Strategies</h1>

      {loading && <p>Loading...</p> /* TODO: Replace with a spinner component */}
      
      {!loading && !user && (
        <p>Please log in to view your saved strategies.</p>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {!loading && user && strategies.length === 0 && (
        <p>You haven't saved any strategies yet. Go to the Strategy Hub to find new ones!</p>
      )}

      {!loading && strategies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          ))}
        </div>
      )}
    </div>
  );
}