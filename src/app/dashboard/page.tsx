'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, Brain, Gem, Layers, X, User, Mail, 
  CreditCard, CheckCircle2, Sparkles, ArrowRight, LifeBuoy, Zap, Code, Settings, Lock 
} from 'lucide-react'; 

import { useRouter } from 'next/navigation';
import { ProtectLogin, useAuthUser } from '@/lib/auth';
import { auth, db } from '@/lib/firebase'; 
import { doc, getDoc } from 'firebase/firestore'; 
// Added sendPasswordResetEmail import
import { sendPasswordResetEmail } from 'firebase/auth'; 

// --- CONFIGURATION ---
const STRIPE_PRICE_IDS: Record<string, string> = {
  'Curious Retail': 'price_1STvdFDATCpMStKark5BCxZ5', 
  'Active Trader': 'price_1STvdmDATCpMStKax7SvIXGp', 
  'Quant Edge': 'price_1STveGDATCpMStKaynj3Y0N6',
};

// --- COMPONENT: PRICING MODAL ---
interface PricingModalProps {
  onClose: () => void;
  onCheckout: (tierName: string) => void;
  isLoading: boolean;
}

const PricingModal = ({ onClose, onCheckout, isLoading }: PricingModalProps) => {
  const tiers = [
    {
      name: "Curious Retail",
      price: "$9",
      period: "mo",
      description: "Buy trust and distribution. View summary metrics only.",
      features: [
        "Access to 3 verified strategies/month",
        "Summary metrics (Win Rate, RR)",
        "Limited backtest period view",
      ],
      icon: Layers,
      gradient: "from-blue-500 to-cyan-500",
      highlight: false,
    },
    {
      name: "Active Trader",
      price: "$39",
      period: "mo",
      description: "The core product. Full reports and Botman AI synergy.",
      features: [
        "Full access to ALL strategy reports",
        "Probability breakdowns",
        "Direct 'Import to Botman AI' integration",
      ],
      icon: Gem,
      gradient: "from-purple-500 to-pink-500",
      highlight: true,
    },
    {
      name: "Quant Edge",
      price: "$119",
      period: "mo",
      description: "For serious traders needing custom verification.",
      features: [
        "All Active Trader features",
        "Submit 1 custom backtest/month", 
        "Request custom parameter analysis",
      ],
      icon: Brain,
      gradient: "from-orange-500 to-red-500",
      highlight: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-3">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">Select the perfect tier for your trading journey</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col p-8 rounded-2xl border-2 transition-all duration-300 ${
                  tier.highlight 
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-xl scale-105 z-10' 
                    : 'border-gray-200 bg-white hover:border-indigo-200'
                }`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tier.gradient} text-white mb-4 w-fit shadow-lg`}>
                  <tier.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black text-gray-900">{tier.price}</span>
                  <span className="text-gray-500 font-semibold">/{tier.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onCheckout(tier.name)}
                  disabled={isLoading}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                   {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Choose Plan"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: CUSTOM BACKTEST CARD ---
interface CustomBacktestCardProps {
  isAdmin: boolean;
}

const CustomBacktestCard = ({ isAdmin }: CustomBacktestCardProps) => {
  const subject = isAdmin 
    ? "Admin Custom Backtest Request"
    : "Quant Edge Custom Backtest Request";
  
  const bodyContent = 
    `Please describe the strategy details, parameters, and time frame for your custom backtest request:` + 
    `` + 
    `---` +
    `` + 
    `If you cannot describe it fully in text, please provide a link to a video demonstration (e.g., YouTube, Loom):`;

  const handleRequestClick = () => {
    window.location.href = `mailto:info@lepaleshadow.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyContent)}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="inline-flex p-3 bg-orange-100 rounded-xl mb-4">
        <Code className="w-6 h-6 text-orange-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {isAdmin ? 'Admin' : 'Quant Edge'} Custom Backtest
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        {isAdmin 
          ? "As an Admin, you can request unlimited custom backtests and analysis."
          : "Submit your custom strategy for a professional backtest verification."
        }
      </p>
      <button 
        onClick={handleRequestClick}
        className="w-full bg-orange-50 border-2 border-orange-200 text-orange-700 hover:bg-orange-100 px-4 py-3 rounded-xl text-sm font-bold flex justify-center items-center"
      >
        <Mail className="w-4 h-4 mr-2" /> Request Custom Backtest
      </button>
    </div>
  );
};

// --- MAIN CONTENT COMPONENT ---
function DashboardContent() {
  const router = useRouter();
  
  const { user, subscriptionStatus: authStatus, role: authRole } = useAuthUser();
  
  const [realStatus, setRealStatus] = useState<string | null>(null);
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // New state for password reset
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    async function fetchLatestUserData() {
      if (!user?.uid) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const status = data.subscriptionStatus || data.tier || 'free';
          setRealStatus(status);
          
          if (data.role) {
            setDbRole(data.role);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsFetchingStatus(false);
      }
    }
    fetchLatestUserData();
  }, [user]);

  if (!user) return null; 

  // --- LOGIC: DETERMINE PLAN ---
  const isAdmin = authRole === 'admin' || dbRole === 'admin' || realStatus === 'admin';
  let finalStatus = (realStatus || authStatus || 'free').toLowerCase();
  
  if (isAdmin) {
    finalStatus = 'admin';
  }

  let currentPlan = "Free Tier";
  if (finalStatus === 'admin') {
    currentPlan = "Admin (All Access)";
  } else if (finalStatus !== 'free') {
    currentPlan = finalStatus.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // --- PASSWORD RESET HANDLER ---
  const handlePasswordReset = async () => {
    if (!user.email) return;
    
    if (!window.confirm(`Send a password reset email to ${user.email}?`)) {
      return;
    }

    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert(`Password reset link sent to ${user.email}. Please check your inbox (and spam folder).`);
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      alert(`Error sending reset email: ${error.message}`);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // --- CHECKOUT HANDLERS ---
  const handleCheckout = async (tierName: string) => {
    setIsLoading(true);
    const priceId = STRIPE_PRICE_IDS[tierName];
    if (!priceId) {
      alert('Price not found.');
      setIsLoading(false);
      return;
    }
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, idToken }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error: any) {
      alert(`Checkout failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

 const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      // 1. GET THE TOKEN
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;

      if (!idToken) {
        alert("Please log in again.");
        setIsLoading(false);
        return;
      }

      // 2. SEND IT TO THE BACKEND
      const response = await fetch('/api/create-portal-session', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }), 
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to create session');
      if (data.url) window.location.href = data.url;

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Could not load billing portal.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategiesClick = (e: React.MouseEvent) => {
    const hasAccess = finalStatus.includes('active') || finalStatus.includes('quant') || finalStatus.includes('curious') || isAdmin;
    
    if (hasAccess) {
      router.push('/strategies');
    } else {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  const handleSupportClick = () => {
    window.location.href = "mailto:info@lepaleshadow.com?subject=Help Request";
  };

  const displayName = user.displayName || user.email?.split('@')[0] || 'Trader';

  const getStatusColor = (plan: string) => {
    if (plan.includes("Admin")) return "bg-red-100 text-red-800 border-red-200"; 
    if (plan === "Free Tier") return "bg-gray-100 text-gray-800 border-gray-200";
    if (plan.toLowerCase().includes('quant')) return "bg-orange-100 text-orange-800 border-orange-200";
    if (plan.toLowerCase().includes('active')) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-green-100 text-green-800 border-green-200"; 
  };
  
  const isQuantEdgeOrAdmin = finalStatus === 'quant edge' || isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{displayName}</span>
          </h1>
          <p className="text-lg text-gray-600">Manage your subscription and access your trading strategies.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-white" />
                  <h2 className="text-white font-bold text-xl">Profile Details</h2>
                </div>
              </div>
              <div className="p-8">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                      {(displayName[0] || 'U').toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 space-y-5 w-full">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</p>
                      <p className="text-xl font-semibold text-gray-900">{displayName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</p>
                      <p className="text-gray-700 font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">User ID</p>
                      <p className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-2 rounded-lg inline-block mb-2">{user.uid}</p>
                      
                      {/* Password Reset Button */}
                      <button
                        onClick={handlePasswordReset}
                        disabled={isResettingPassword}
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50 mt-2"
                      >
                        {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        Reset Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-indigo-600" />
                    </div>
                    Subscription
                  </h3>
                  
                  {isFetchingStatus ? (
                    <span className="px-4 py-2 rounded-full text-sm font-bold bg-gray-100 animate-pulse">Loading...</span>
                  ) : (
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(currentPlan)}`}>
                      {currentPlan}
                    </span>
                  )}
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl p-6 mb-6 border border-gray-100">
                  <p className="text-gray-700 leading-relaxed">
                    {currentPlan === "Free Tier" 
                      ? "You're currently on the basic plan. Upgrade to unlock premium strategies."
                      : isAdmin 
                        ? "You have full Admin access. You can manage your personal subscription settings here if applicable."
                        : "Your subscription is active! You can upgrade, downgrade, or cancel your plan via the secure billing portal below."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {currentPlan === "Free Tier" ? (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      disabled={isLoading}
                      className="group w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Upgrade Plan
                    </button>
                  ) : (
                    // PAID USER & ADMIN VIEW: Single Button relying on Stripe Portal
                    <button
                      onClick={handleManageSubscription}
                      disabled={isLoading}
                      className="w-full bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
                      Manage Subscription (Upgrade / Cancel)
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div 
              className="group relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white cursor-pointer overflow-hidden transition-all hover:shadow-2xl hover:scale-105" 
              onClick={handleStrategiesClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="inline-flex p-3 bg-white/20 backdrop-blur-sm rounded-xl mb-4">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-3">Access Strategies</h3>
                <p className="text-indigo-100 text-sm mb-6">Dive into verified strategies with backtest results.</p>
                <button className="inline-flex items-center text-sm font-bold text-white bg-white/20 px-5 py-2.5 rounded-lg">
                  Launch Terminal <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>

            {/* NEW SECTION FOR QUANT EDGE/ADMIN */}
            {isQuantEdgeOrAdmin && (
              <CustomBacktestCard isAdmin={isAdmin} />
            )}
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="inline-flex p-3 bg-blue-100 rounded-xl mb-4">
                <LifeBuoy className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-6">Having trouble? Our team is here for you.</p>
              <button 
                onClick={handleSupportClick}
                className="w-full bg-blue-50 border-2 border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-3 rounded-xl text-sm font-bold flex justify-center items-center"
              >
                <Mail className="w-4 h-4 mr-2" /> Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <PricingModal 
          onClose={() => setIsModalOpen(false)} 
          onCheckout={handleCheckout}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectLogin>
      <DashboardContent />
    </ProtectLogin>
  );
}