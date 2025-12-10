'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Strategy } from '@/app/strategies/page';
import { useAuthUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Icons
import { PlayCircleIcon, BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidFilled } from '@heroicons/react/24/solid';

interface StrategyCardProps {
  strategy: Strategy;
  onClick?: (e: React.MouseEvent) => void; 
  disableLink?: boolean;
}

// ✅ FIX: Use Base64 Data URI to prevent 404 errors on missing files
const PLACEHOLDER_THUMBNAIL_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiB2aWV3Qm94PSIwIDAgODAwIDQ1MCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9IiNmM2Y0ZjYiPjwvcmVjdD48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5NDZhODQiPlN0cmF0ZWd5PC90ZXh0Pjwvc3ZnPg==';

export default function StrategyCard({ strategy, onClick }: StrategyCardProps) {
  // --- STATE & AUTH ---
  const { uid } = useAuthUser();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Local state for image source to handle external 404s
  const [imgSrc, setImgSrc] = useState(strategy?.youtubeThumbnailUrl || PLACEHOLDER_THUMBNAIL_URL);

  useEffect(() => {
    setImgSrc(strategy?.youtubeThumbnailUrl || PLACEHOLDER_THUMBNAIL_URL);
  }, [strategy]);

  // 🔑 Guard: Stop rendering entirely if critical data is missing
  if (!strategy || !strategy.id) {
    console.error("StrategyCard skipped rendering because ID is missing.", strategy);
    return null;
  }

  // --- Utility Functions ---
  const formatMetric = (value: number | undefined, decimals: number = 2) => {
    return (value ?? 0).toFixed(decimals);
  };

  const SaveIcon = isSaved ? BookmarkSolidFilled : BookmarkOutline;
  
  // Creates the path reference for the user's saved strategy document
  const savedStrategyPath = uid
    ? doc(db, 'users', uid, 'savedStrategies', strategy.id)
    : null;

  // --- Logic to Check Saved Status on Load ---
  const checkSavedStatus = useCallback(async () => {
    if (!uid || !savedStrategyPath) return;

    try {
      const docSnap = await getDoc(savedStrategyPath);
      setIsSaved(docSnap.exists());
    } catch (e) {
      console.error("Error checking saved status:", e);
    }
  }, [uid, savedStrategyPath]);

  useEffect(() => {
    checkSavedStatus();
  }, [checkSavedStatus]);

  // --- Logic to Toggle Save/Unsave ---
  const handleSaveToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    if (!uid) {
      alert('Please sign in to save strategies.');
      return;
    }

    if (!savedStrategyPath || isLoading) return;

    setIsLoading(true);

    try {
      if (isSaved) {
        // --- UNSAVE ---
        await deleteDoc(savedStrategyPath);
        setIsSaved(false);
        console.log(`Unsaved strategy: ${strategy.id}`);
      } else {
        // --- SAVE ---
        await setDoc(savedStrategyPath, {
          strategyId: strategy.id,
          savedAt: serverTimestamp(),
        });
        setIsSaved(true);
        console.log(`Saved strategy: ${strategy.id}`);
      }
    } catch (error) {
      console.error("Error toggling save status:", error);
      alert(`Failed to ${isSaved ? 'unsave' : 'save'} strategy.`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Content ---
  const CardContent = (
    <>
      {/* 🖼️ Thumbnail/Source Visual */}
      <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
        <Image
          src={imgSrc}
          alt={`Thumbnail for ${strategy.name}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover group-hover:scale-105 transition duration-500"
          onError={() => setImgSrc(PLACEHOLDER_THUMBNAIL_URL)} // Fallback if external URL fails
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
          <PlayCircleIcon className="w-12 h-12 text-white opacity-80" />
        </div>
      </div>

      <div className="p-5">
        {/* Header/Title */}
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {strategy.name}
          </h2>

          {/* Bookmark Icon */}
          <button
            type="button"
            onClick={handleSaveToggle}
            disabled={isLoading}
            className={`p-1 rounded-full ml-2 flex-shrink-0 z-10 transition-colors
              ${isSaved ? 'text-indigo-600 hover:text-indigo-700' : 'text-gray-400 hover:text-indigo-600'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <SaveIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Source Reference */}
        <p className="text-sm font-medium text-indigo-500 mb-4 truncate">
          Source: {strategy.sourceReference}
        </p>

        {/* Key Metrics Display */}
        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Win Rate</p>
            <p className="text-lg font-extrabold text-green-600">
              {formatMetric(strategy.winRate * 100, 1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profit</p>
            <p className="text-lg font-extrabold text-gray-900">
              {formatMetric(strategy.profitFactor)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Drawdown</p>
            <p className={`text-lg font-extrabold ${strategy.maxDrawdown > 0.20 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatMetric(strategy.maxDrawdown * 100, 0)}%
            </p>
          </div>
        </div>
      </div>
    </>
  );

  // --- Wrapper Logic (Link vs Div) ---
  if (onClick) {
    return (
      <div
        onClick={onClick}
        className="block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group cursor-pointer border border-gray-100"
      >
        {CardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/strategies/${strategy.id}`}
      className="block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group border border-gray-100"
    >
      {CardContent}
    </Link>
  );
}