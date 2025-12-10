'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth'; 
import { db } from '@/lib/firebase'; 
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import StrategyCard  from '@/components/StrategyCard'; 

// --- INTERFACE DEFINITION ---
interface Strategy {
  id: string;
  name: string;
  description: string;
  
  // Metrics (Must be numbers)
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  
  // Media & Links 
  youtubeThumbnailUrl?: string;
  backtestImageUrl?: string;
  downloadLink?: string;
  sourceLink?: string;
  sourceReference?: string;
  assetClass?: string;
  
  // Catch-all for any other fields
  [key: string]: any; 
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
        return; 
      }

      setLoading(true);
      setError(null);
      
      try {
        // 1. Get user doc
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error('User data not found.');
        }

        // 2. Get saved IDs
        const savedIds = userDocSnap.data()?.savedStrategies || [];

        if (savedIds.length === 0) {
          setStrategies([]);
          setLoading(false);
          return; 
        }

        // 3. Fetch strategy docs (Limit to 30)
        const safeIds = savedIds.slice(0, 30); 
        
        const strategiesQuery = query(
          collection(db, 'strategies'),
          where(documentId(), 'in', safeIds)
        );

        const querySnapshot = await getDocs(strategiesQuery);
        
        // 4. MAP AND SANITIZE DATA
        const strategiesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Force conversion to number, default to 0 if missing/invalid
            winRate: Number(data.winRate) || 0,
            profitFactor: Number(data.profitFactor) || 0,
            maxDrawdown: Number(data.maxDrawdown) || 0,
            name: data.name || 'Untitled Strategy',
            description: data.description || '',
          };
        }) as Strategy[];

        setStrategies(strategiesData);

      } catch (err) {
        console.error("Error fetching saved strategies:", err);
        setError('Failed to load saved strategies.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedStrategies();
  }, [user]); 

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Saved Strategies</h1>

      {loading && (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}
      
      {!loading && !user && (
        <p>Please log in to view your saved strategies.</p>
      )}

      {error && <p className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</p>}

      {!loading && user && strategies.length === 0 && (
        <div className="text-center py-12 text-gray-500">
            <p>You haven't saved any strategies yet.</p>
            <p className="text-sm mt-2">Go to the Strategy Hub to find new ones!</p>
        </div>
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