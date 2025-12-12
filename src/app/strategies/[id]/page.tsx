import { Strategy } from '@/app/strategies/page'; 
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircleIcon, CodeBracketSquareIcon, PlayCircleIcon, ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { SparklesIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { cookies } from 'next/headers';

// FIX 1: Use only adminDb for fetching data in Server Components
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import * as admin from 'firebase-admin'; 
import StrategyActionButtons from '@/components/strategies/StrategyActionButtons';

const FALLBACK_IMAGE = "https://placehold.co/1000x500/f1f5f9/475569?text=Backtest+Chart+Unavailable";

interface StrategyDetailPageProps {
  params: Promise<{ id: string }>;
}

type SubscriptionTier = "Curious Retail" | "Active Trader" | "Quant Edge" | "Admin" | null;

interface MetricBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  size?: string;
  bgColor?: string;
}

// --- Helper Functions ---

// 1. Get User Session & Tier
async function getUserSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) return null;

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    let tier = (userData?.subscriptionTier as SubscriptionTier) || null;

    // Check logic for Admin role
    if (userData?.role === 'admin' || tier?.toString().toLowerCase().includes('admin')) {
        tier = 'Admin';
    }

    return { userId, tier };

  } catch (error) {
    // console.warn("Session verification failed:", error); 
    return null;
  }
}

// 2. LOGIC: Check & Increment View Limit
async function checkViewLimit(userId: string, strategyId: string, tier: SubscriptionTier): Promise<{ allowed: boolean }> {
    if (tier === 'Active Trader' || tier === 'Quant Edge' || tier === 'Admin') {
        return { allowed: true };
    }

    if (tier === 'Curious Retail') {
        const LIMIT = 3;
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const usageRef = adminDb.collection('users').doc(userId).collection('usage').doc(monthKey);
        
        try {
            return await adminDb.runTransaction(async (t) => {
                const doc = await t.get(usageRef);
                const data = doc.data() || { viewedStrategies: [] };
                const viewedList: string[] = data.viewedStrategies || [];

                if (viewedList.includes(strategyId)) {
                    return { allowed: true };
                }

                if (viewedList.length >= LIMIT) {
                    return { allowed: false };
                }

                t.set(usageRef, {
                    viewedStrategies: admin.firestore.FieldValue.arrayUnion(strategyId),
                    lastUpdated: new Date()
                }, { merge: true });

                return { allowed: true };
            });
        } catch (e) {
            console.error("Transaction failed", e);
            return { allowed: false };
        }
    }

    return { allowed: false };
}

// FIX 2: Use adminDb instead of client db
async function getStrategy(id: string): Promise<Strategy | null> {
  if (!id) return null;

  try {
    // Clean the ID just in case
    const cleanId = id.trim();
    
    // Use Admin SDK to bypass client-side security rules
    const docSnap = await adminDb.collection('strategies').doc(cleanId).get();

    if (docSnap.exists) {
      const data = docSnap.data();
      // Ensure we return a plain object compatible with the Strategy interface
      return {
        id: docSnap.id,
        name: data?.name || '',
        description: data?.description || '',
        winRate: data?.winRate || 0,
        profitFactor: data?.profitFactor || 0,
        trades: data?.trades || 0,
        tier: data?.tier || 'Curious Retail',
        status: data?.status || 'active',
        imageUrl: data?.imageUrl || '',
        videoUrl: data?.videoUrl || '',
        detailedReportUrl: data?.detailedReportUrl || '',
        // Add any other fields you need, casting strictly if necessary
        ...data 
      } as Strategy;
    } else {
      console.error(`Strategy ID ${cleanId} not found in Firestore.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching strategy with ID ${id}:`, error);
    return null;
  }
}

const formatMetric = (value: number | undefined, decimals: number = 2) => {
    return (value ?? 0).toFixed(decimals);
};

// --- Components ---

const MetricBoxDetail = ({ 
  label, 
  value, 
  unit = '', 
  color = 'text-gray-900', 
  size = 'text-2xl', 
  bgColor = 'bg-white' 
}: MetricBoxProps) => (
    <div className={`${bgColor} p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
        <p className={`${size} font-bold ${color} leading-tight`}>
            {value}{unit}
        </p>
    </div>
);

// --- Limit Reached UI ---
const LimitReachedScreen = () => (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-center text-white">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                    <LockClosedIcon className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black mb-2">Monthly Limit Reached</h1>
                <p className="text-purple-100 font-medium">Curious Retail Plan</p>
            </div>
            <div className="p-8 text-center">
                <p className="text-gray-600 mb-8 text-lg">
                    You've viewed your <strong>3 free strategies</strong> for this month. Upgrade to access the full library.
                </p>
                <div className="space-y-3">
                    <Link href="/dashboard" className="block w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-lg">
                        Upgrade to Active Trader
                    </Link>
                    <Link href="/strategies" className="block w-full py-4 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 border border-gray-200">
                        Back to List
                    </Link>
                </div>
            </div>
        </div>
    </div>
);

// --- Main Page Component ---

export default async function StrategyDetailPage({ params }: StrategyDetailPageProps) {
  
  const { id } = await params; 

  if (!id || typeof id !== 'string') return null;

  const session = await getUserSession();
  
  // Only check limits if logged in; otherwise let them see basic info or redirect (up to your auth logic)
  if (session) {
      const { allowed } = await checkViewLimit(session.userId, id, session.tier);
      if (!allowed) return <LimitReachedScreen />;
  }

  const strategy = await getStrategy(id);

  if (!strategy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Strategy Not Found</h1>
          <p className="text-gray-500 mb-6">We couldn't find the strategy you were looking for. It may have been removed or the ID is incorrect.</p>
          <Link href="/strategies" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
             <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Strategies
          </Link>
        </div>
      </div>
    );
  }

  // Use a fallback image if none exists
  const imageSource = strategy.imageUrl && strategy.imageUrl.length > 0 
    ? strategy.imageUrl 
    : FALLBACK_IMAGE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        <Link href="/strategies" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6 group">
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/>
          <span className="font-medium">Back to Strategies</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          
          <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-8 md:p-12">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-400"/>
                  <span className="text-sm font-semibold uppercase tracking-wide text-blue-100">Verified Strategy</span>
                  {session?.tier === 'Curious Retail' && (
                      <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold">Free View Used</span>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">{strategy.name}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-blue-100">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <ChartBarIcon className="w-5 h-5"/>
                    <span className="font-semibold">{(strategy as any).market || 'Unknown Market'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="font-medium">{(strategy as any).timeframe || 'Daily'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <CodeBracketSquareIcon className="w-5 h-5"/>
                    <span className="font-medium">{strategy.assetClass || 'Asset'}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="p-8 md:p-12">
            {/* Core Metrics */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-blue-600 rounded-full"></span>
                Key Performance Metrics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-sm border border-green-200 hover:shadow-lg transition-all duration-200">
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">Win Rate</p>
                  <p className="text-5xl font-extrabold text-green-700">
                    {formatMetric(strategy.winRate * 100, 1)}
                    <span className="text-2xl">%</span>
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl shadow-sm border border-blue-200 hover:shadow-lg transition-all duration-200">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">Profit Factor</p>
                  <p className="text-5xl font-extrabold text-blue-700">
                    {formatMetric(strategy.profitFactor)}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-2xl shadow-sm border border-red-200 hover:shadow-lg transition-all duration-200">
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">Max Drawdown</p>
                  <p className="text-5xl font-extrabold text-red-700">
                    {formatMetric(strategy.maxDrawdown * 100, 0)}
                    <span className="text-2xl">%</span>
                  </p>
                </div>
                
                <a 
                  href={strategy.videoUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-sm border border-gray-700 flex flex-col items-center justify-center hover:scale-105 transition-all duration-200 group"
                >
                  <PlayCircleIcon className="w-12 h-12 text-red-500 group-hover:text-red-400 transition"/>
                  <p className="text-sm font-semibold text-white mt-3">Watch Original</p>
                  <p className="text-xs text-gray-400 mt-1">Video Source</p>
                </a>
              </div>
            </section>

            {/* Extended Metrics */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-indigo-600 rounded-full"></span>
                Detailed Analytics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                
                <MetricBoxDetail 
                  label="Total Trades" 
                  value={(strategy as any).trades?.toLocaleString() || 'N/A'} 
                  color="text-blue-600"
                  size="text-3xl"
                  bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
                />

                <MetricBoxDetail 
                  label="Risk:Reward Ratio" 
                  value={`1:${formatMetric((strategy as any).riskReward)}`} 
                  color="text-indigo-600"
                  size="text-3xl"
                  bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
                />

                <MetricBoxDetail 
                  label="Expectancy" 
                  value={`$${formatMetric((strategy as any).expectancy, 2)}`} 
                  color="text-green-600"
                  size="text-3xl"
                  bgColor="bg-gradient-to-br from-green-50 to-green-100"
                />
                
                <MetricBoxDetail 
                  label="Duration Tested" 
                  value={`${(strategy as any).durationMonths || 'N/A'}`} 
                  unit=" Months"
                  color="text-purple-600"
                  size="text-3xl"
                  bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
                />
              </div>
            </section>

            {/* Strategy Description */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-purple-600 rounded-full"></span>
                Strategy Description
              </h2>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-8 border border-gray-200">
                 <p className="text-gray-700 leading-relaxed text-lg">
                    {strategy.description || 'No description available for this strategy.'}
                 </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-green-600 rounded-full"></span>
                Performance Verification
              </h2>
              
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white p-4">
                <Image 
                  src={imageSource}
                  alt={`Backtest performance chart for ${strategy.name}`}
                  width={1000} 
                  height={500}
                  className="w-full h-auto rounded-lg"
                  priority={true}
                />
              </div>
            </section>
            
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-3">
                <span className="w-1 h-8 bg-blue-600 rounded-full"></span>
                Get This Strategy
              </h2>
              
              <StrategyActionButtons 
                strategy={strategy} 
                userSubscription={(session?.tier || 'Free') as any} 
                userRole={session?.tier === 'Admin' ? 'admin' : 'user'}
              />
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}