// src/app/strategies/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, CollectionReference, DocumentData } from 'firebase/firestore';
import Navbar from '@/components/layout/Navbar'; 
import { Search, TrendingUp, TrendingDown, Minus, ChevronDown, Play, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// --- 🎯 CORE INTERFACE DEFINITION ---

export interface Strategy {
  id: string;
  name: string;
  
  // PRIMARY METRICS
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  
  // BADGES & REFERENCE
  sourceReference: string; 
  youtubeThumbnailUrl: string; 
  
  // OTHER FIELDS
  backtestImageUrl: string; 
  downloadLink: string; 
  sourceLink: string; 
  assetClass: string;
  description: string;
  createdAt?: any; // Adjusted to accept Firestore Timestamp or Date
}

// --- 📊 STRATEGY CARD COMPONENT ---

const PLACEHOLDER_THUMBNAIL = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Thumbnail';

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const formatMetric = (value: number | undefined, decimals: number = 2) => {
    return (value ?? 0).toFixed(decimals);
  };

  const getPerformanceIcon = (winRate: number) => {
    if (winRate >= 0.6) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (winRate >= 0.5) return <Minus className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getDrawdownColor = (drawdown: number) => {
    if (drawdown > 0.30) return 'text-red-600';
    if (drawdown > 0.20) return 'text-orange-600';
    return 'text-gray-900';
  };

  // Safe image source logic
  const imgSrc = strategy.youtubeThumbnailUrl || PLACEHOLDER_THUMBNAIL;
  const isExternal = imgSrc.startsWith('http');

  return (
    <Link href={`/strategies/${strategy.id}`} className="block h-full">
      <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-gray-100 cursor-pointer h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden flex-shrink-0">
          <Image 
            src={imgSrc} 
            alt={strategy.name}
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover group-hover:scale-110 transition duration-500"
            onError={(e: any) => {
              e.currentTarget.src = PLACEHOLDER_THUMBNAIL;
            }}
            unoptimized={isExternal}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-2xl">
              <Play className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {/* Performance Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
            {getPerformanceIcon(strategy.winRate)}
            <span className="text-xs font-bold text-gray-900">
              {formatMetric(strategy.winRate * 100, 0)}%
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-3 line-clamp-2 leading-tight min-h-[3.5rem]">
            {strategy.name}
          </h3>
          
          {/* Source Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full mb-4 self-start">
            <ExternalLink className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 truncate max-w-[200px]">
              {strategy.sourceReference}
            </span>
          </div>

          {/* Asset Class Tag */}
          {strategy.assetClass && (
            <div className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold mb-4 ml-2 self-start">
              {strategy.assetClass}
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 mt-auto">
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Win Rate
              </p>
              <p className="text-xl font-black bg-gradient-to-br from-green-600 to-emerald-600 text-transparent bg-clip-text">
                {formatMetric(strategy.winRate * 100, 1)}%
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                P. Factor
              </p>
              <p className="text-xl font-black text-gray-900">
                {formatMetric(strategy.profitFactor, 2)}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Max DD
              </p>
              <p className={`text-xl font-black ${getDrawdownColor(strategy.maxDrawdown)}`}>
                {formatMetric(strategy.maxDrawdown * 100, 0)}%
              </p>
            </div>
          </div>

          {/* Action Button (Fixed: Changed from <button> to <div> to avoid nesting issues) */}
          <div className="w-full mt-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
            View Details
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// --- 💡 LOADING COMPONENTS ---

const StrategiesLoading = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    {/* Filters Skeleton */}
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex flex-wrap gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-11 w-28 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
        ))}
      </div>
    </div>

    {/* Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-48 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200"></div>
          <div className="p-6 space-y-4">
            <div className="h-7 bg-gray-200 rounded-lg w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-full"></div>
              <div className="h-3 bg-gray-100 rounded w-5/6"></div>
            </div>
            <div className="h-7 w-36 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full"></div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="space-y-2"><div className="h-3 bg-gray-100 rounded w-full"></div><div className="h-7 bg-gray-200 rounded-lg w-3/4"></div></div>
              <div className="space-y-2"><div className="h-3 bg-gray-100 rounded w-full"></div><div className="h-7 bg-gray-200 rounded-lg w-3/4"></div></div>
              <div className="space-y-2"><div className="h-3 bg-gray-100 rounded w-full"></div><div className="h-7 bg-gray-200 rounded-lg w-3/4"></div></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);


// --- 🌐 MAIN PAGE COMPONENT ---

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsset, setFilterAsset] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('winRate');

  useEffect(() => {
    const fetchStrategies = async () => {
      setLoading(true);
      try {
        const strategiesCol = collection(db, 'strategies') as CollectionReference<DocumentData>;
        const querySnapshot = await getDocs(strategiesCol);
  
        const fetchedStrategies: Strategy[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id && data) {
            fetchedStrategies.push({
              id: doc.id,
              ...(data as Omit<Strategy, 'id'>),
            } as Strategy);
          }
        });
        
        setStrategies(fetchedStrategies);
      } catch (error) {
        console.error("Error fetching strategies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  // Get unique asset classes
  const assetClasses = ['All', ...Array.from(new Set(strategies.map(s => s.assetClass).filter(Boolean)))];

  // Filter and sort strategies
  const filteredStrategies = strategies
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAsset = filterAsset === 'All' || s.assetClass === filterAsset;
      return matchesSearch && matchesAsset;
    })
    .sort((a, b) => {
      if (sortBy === 'winRate') return (b.winRate || 0) - (a.winRate || 0);
      if (sortBy === 'profitFactor') return (b.profitFactor || 0) - (a.profitFactor || 0);
      if (sortBy === 'maxDrawdown') return (a.maxDrawdown || 0) - (b.maxDrawdown || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30"> 
      
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <div className="py-12 pt-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Hero Section */}
          <header className="text-center mb-12 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
            
            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 shadow-lg mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-sm font-semibold text-indigo-700">
                  {strategies.length} Verified Strategies
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
                Discover & Verify
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Trading Strategies
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Explore curated strategies from YouTube and trading books, backed by
                <strong className="text-gray-900"> verified backtest data</strong>.
              </p>

              {/* Stats Bar */}
              <div className="flex flex-wrap justify-center gap-8 mt-10 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">100% Verified Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Real Market Conditions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Updated Daily</span>
                </div>
              </div>
            </div>
          </header>

          {loading ? (
            <StrategiesLoading />
          ) : (
            <div className="space-y-8">
              {/* Search and Filters */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search strategies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-medium"
                    />
                  </div>

                  {/* Asset Filter */}
                  <div className="relative">
                    <select
                      value={filterAsset}
                      onChange={(e) => setFilterAsset(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-semibold bg-white cursor-pointer min-w-[150px]"
                    >
                      {assetClasses.map(asset => (
                        <option key={asset} value={asset}>{asset}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-semibold bg-white cursor-pointer min-w-[180px]"
                    >
                      <option value="winRate">Sort by Win Rate</option>
                      <option value="profitFactor">Sort by Profit Factor</option>
                      <option value="maxDrawdown">Sort by Drawdown</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Results count */}
                <div className="mt-4 text-sm text-gray-600 font-medium">
                  Showing <span className="text-indigo-600 font-bold">{filteredStrategies.length}</span> strategies
                </div>
              </div>

              {/* Strategy Grid */}
              {filteredStrategies.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
                    <span className="text-gray-600">No strategies found. Try adjusting your filters.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredStrategies.map((strategy) => (
                    <StrategyCard key={strategy.id} strategy={strategy} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}