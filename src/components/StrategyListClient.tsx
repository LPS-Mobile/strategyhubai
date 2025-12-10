// src/components/strategies/StrategyListClient.tsx
'use client';

import React from 'react';
// 🔑 CORRECTED IMPORT PATH based on your file structure
import StrategyCard from '@/components/strategies/StrategyCard'; 
// NOTE: Assuming Strategy type is available globally or defined in StrategyCard.tsx

interface StrategyListClientProps {
    // Strategies array passed from the server (which is serializable data)
    strategies: any[]; 
}

/**
 * StrategyListClient: A Client Component wrapper that consumes data from the 
 * server and renders other client components (StrategyCard) that use hooks.
 */
export default function StrategyListClient({ strategies }: StrategyListClientProps) {
    
    // Renders the "No Strategies" state if the list is empty (client-side)
    if (strategies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl border border-gray-100 text-center mx-auto max-w-xl">
                <svg className="w-20 h-20 text-blue-400 mb-6 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-3xl font-bold text-gray-800 mb-3">No Strategies Available</h3>
                <p className="text-lg text-gray-600">
                  Please check the Firestore collection.
                </p>
                <button className="px-8 py-3 mt-6 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1">
                  Refresh Page
                </button>
            </div>
        );
    }
    
    // Renders the strategy grid
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in-up">
            {strategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
        </div>
    );
}