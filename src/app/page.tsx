'use client';

import { useState, useRef, useEffect } from 'react';
// --- 1. FIREBASE IMPORTS ---
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; 
import { collection, query, limit, getDocs } from 'firebase/firestore'; 

import Link from 'next/link';
import { LoginModal } from '@/components/Loginmodal';
import PricingSection from '@/components/PricingSection';
import { SubscribeModal } from '@/components/SubscribeModal'; 
import { ArrowRight, Zap, PlayCircleIcon, CheckCircle, BarChart3, Target } from 'lucide-react';
import Image from 'next/image';

// --- 3. DEFINE STRATEGY TYPE ---
interface Strategy {
  id: string;
  name: string;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  assetClass: string;
  description: string;
  sourceLink: string;
  sourceReference: string;
  youtubeThumbnailUrl: string;
  backtestImageUrl: string;
  downloadLink: string;
}

// ✅ FIX: Use Base64 Data URI to prevent 404 errors on missing files
const PLACEHOLDER_THUMBNAIL_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiB2aWV3Qm94PSIwIDAgODAwIDQ1MCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9IiNmM2Y0ZjYiPjwvcmVjdD48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5NDZhODQiPlN0cmF0ZWd5PC90ZXh0Pjwvc3ZnPg==';

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('🟢 LANDING: Page mounted');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🟢 LANDING: Auth state:', user?.email || 'No user');
    });
    return () => {
      console.log('🔴 LANDING: Page unmounting');
      unsubscribe();
    };
  }, []);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleOpenSubscribeModal = () => {
    setIsSubscribeModalOpen(true);
  };

  const handleCloseSubscribeModal = () => {
    setIsSubscribeModalOpen(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header onLogin={handleOpenLoginModal} onViewPricing={scrollToPricing} />
        <main>
          <HeroSection onExplore={scrollToFeatures} onGetStarted={scrollToPricing} />
          <div className="container mx-auto px-4 max-w-7xl">
            <div id="features" ref={featuresRef} className="py-24">
              <HowItWorks />
            </div>
            <DataBackedResults onOpenSubscribeModal={handleOpenSubscribeModal} />
          </div>
          <div id="pricing" ref={pricingRef}>
            <PricingSection onJoinBeta={handleOpenLoginModal} /> 
          </div>
          <FinalCta onGetStarted={scrollToPricing} />
        </main>
        <Footer />
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} />
      <SubscribeModal isOpen={isSubscribeModalOpen} onClose={handleCloseSubscribeModal} />
    </>
  );
}

// --- Components ---

const Header = ({ onLogin, onViewPricing }: { onLogin: () => void; onViewPricing: () => void }) => (
  <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
    <div className="container mx-auto px-4 max-w-7xl h-20 flex items-center justify-between">
      <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-2 shadow-lg">
          <Zap className="w-6 h-6 text-white" />
        </div>
        StrategyHub
      </div>
      <nav className="flex gap-3">
        <button
          onClick={onViewPricing}
          className="py-2.5 px-6 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-all duration-200 hover:bg-gray-50 rounded-lg"
        >
          Pricing
        </button>
        <button
          onClick={onLogin}
          className="py-2.5 px-6 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          Sign In
        </button>
      </nav>
    </div>
  </header>
);

const HeroSection = ({ onExplore, onGetStarted }: { onExplore: () => void; onGetStarted: () => void }) => (
  <section className="relative pt-32 pb-40 text-center overflow-hidden">
    {/* Gradient Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"></div>
    
    {/* Animated Circles */}
    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
    <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
    <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
    
    <div className="container mx-auto px-4 max-w-5xl relative z-10">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 shadow-lg mb-8">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        <span className="text-sm font-semibold text-indigo-700">Verify strategies with real data</span>
      </div>

      <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
        <span className="text-gray-900">Discover Which</span>
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          YouTube Strategies
        </span>
        <br />
        <span className="text-gray-900">Actually Work.</span>
      </h1>
      
      <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
        StrategyHub <strong className="text-gray-900">verifies</strong> trading strategies using real market data and probability-based backtesting — <strong className="text-gray-900">before you risk a dime</strong>.
      </p>

      {/* Trust Indicators */}
      <div className="flex flex-wrap justify-center gap-8 mb-12 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>Real Market Data</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>Verified Metrics</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>No Hype, Just Facts</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onExplore}
          className="group py-4 px-8 text-lg font-bold bg-white text-indigo-600 border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
        >
          Explore Strategies
          <ArrowRight className="w-5 h-5 inline ml-2 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          onClick={onGetStarted}
          className="py-4 px-8 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
        >
          Get Started Free
        </button>
      </div>
    </div>
  </section>
);

const HowItWorks = () => {
  const steps = [
    { 
      icon: Target, 
      title: "Find a Strategy", 
      description: "Browse trending YouTube and 'book' strategies, all centralized in one place.",
      gradient: "from-blue-500 to-cyan-500"
    },
    { 
      icon: BarChart3, 
      title: "See the Truth", 
      description: "View verified win rates, profit factors, and maximum drawdowns from our deep backtests.",
      gradient: "from-purple-500 to-pink-500"
    },
    { 
      icon: Zap, 
      title: "Trade Smarter", 
      description: "Use data to decide before you execute, automate, or export the verified strategy.",
      gradient: "from-orange-500 to-red-500"
    },
  ];

  return (
    <section>
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
          Every YouTube strategy,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            fact-checked by real data
          </span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Stop guessing if that viral trading strategy actually works. We verify them with probability-based backtesting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
          >
            {/* Gradient border effect on hover */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            <div className="relative">
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${step.gradient} text-white mb-6 shadow-lg`}>
                <step.icon className="w-8 h-8" />
              </div>
              
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-5xl font-black text-gray-200">{index + 1}</span>
                <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
              </div>
              
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const DataBackedResults = ({ onOpenSubscribeModal }: { onOpenSubscribeModal: () => void }) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  const formatMetric = (value: number | undefined, decimals: number = 2) => {
    return (value ?? 0).toFixed(decimals);
  };

  useEffect(() => {
    const fetchStrategies = async () => {
      setLoading(true);
      try {
        const strategiesCol = collection(db, 'strategies');
        const q = query(strategiesCol, limit(3));
        
        const querySnapshot = await getDocs(q);

        const fetchedStrategies: Strategy[] = [];
        querySnapshot.forEach((doc) => {
          fetchedStrategies.push({
            id: doc.id,
            ...doc.data()
          } as Strategy);
        });

        setStrategies(fetchedStrategies);
      } catch (error) {
        console.error("Error fetching strategies for homepage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  // Helper function to prevent loading 404 image
  const getSafeImage = (url: string) => {
    if (!url || url.includes('placeholder-video.jpg')) {
      return PLACEHOLDER_THUMBNAIL_URL;
    }
    return url;
  };

  return (
    <section className="py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
          Data-Backed Results.
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Stop Guessing.</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          StrategyHub doesn't hype strategies; we verify them with verifiable metrics.
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {strategies.map((strategy) => (
            <div 
              key={strategy.id} 
              onClick={onOpenSubscribeModal}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden cursor-pointer border border-gray-100"
            >
              {/* Thumbnail */}
              <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                <Image 
                  src={getSafeImage(strategy.youtubeThumbnailUrl)} 
                  alt={`Thumbnail for ${strategy.name}`}
                  fill 
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition duration-500"
                  // Fallback: If the YouTube URL is dead, this catches it
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.srcset = PLACEHOLDER_THUMBNAIL_URL;
                    target.src = PLACEHOLDER_THUMBNAIL_URL;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-2xl">
                    <PlayCircleIcon className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-3 line-clamp-2 leading-tight">
                  {strategy.name}
                </h3>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full mb-5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-xs font-semibold text-blue-700 truncate">
                    {strategy.sourceReference}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-5 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Win Rate</p>
                    <p className="text-2xl font-black bg-gradient-to-br from-green-600 to-emerald-600 text-transparent bg-clip-text">
                      {formatMetric(strategy.winRate * 100, 1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Profit</p>
                    <p className="text-2xl font-black text-gray-900">
                      {formatMetric(strategy.profitFactor)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Drawdown</p>
                    <p className={`text-2xl font-black ${strategy.maxDrawdown > 0.20 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatMetric(strategy.maxDrawdown * 100, 0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && strategies.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
            <span className="text-gray-600">No strategies found. Admin, please add some!</span>
          </div>
        </div>
      )}
    </section>
  );
};

const FinalCta = ({ onGetStarted }: { onGetStarted: () => void }) => (
  <section className="relative py-28 mt-16 overflow-hidden">
    {/* Gradient Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
    
    {/* Animated shapes */}
    <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl"></div>
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl"></div>
    
    <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
      <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
        Ready to Trade with<br />Confidence?
      </h2>
      <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-3xl mx-auto leading-relaxed">
        Join traders who verify before they trade. Get instant access to data-backed strategies.
      </p>
      <button
        onClick={onGetStarted}
        className="group py-5 px-12 text-xl font-black bg-white text-indigo-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-105"
      >
        Start Verifying Today
        <ArrowRight className="w-6 h-6 inline ml-2 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 py-12">
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-6 md:mb-0">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3 shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-gray-900">StrategyHub</span>
        </div>
        
        <nav className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-600 mb-6 md:mb-0">
          <Link 
            href="https://docs.google.com/document/d/1KusqfoU0UBiiICWseP1Jk27pMW-zpw9hOxuE2kJ3VNc/edit?usp=sharing" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            href="https://docs.google.com/document/d/1moDupu5sS540BuuQArtMM-TdwYBJc-ZoZzv8PjnjZMc/edit?usp=sharing" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors"
          >
            Terms of Service
          </Link>
          <Link 
            href="mailto:info@lepaleshadow.com?subject=Strategyhub%20AI%20Contact" 
            className="hover:text-indigo-600 transition-colors"
          >
            Contact
          </Link>
        </nav>
      </div>
      
      <div className="text-center mt-8 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Copyright &copy; 2025 Algo World LLC. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);   