'use client';

import React from 'react';
import { useAuthUser } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { Brain, Gem, Layers, ShieldCheck } from 'lucide-react'; 

// Map your tiers to actual Stripe Price IDs
const STRIPE_PRICE_IDS: Record<string, string> = {
  'Curious Retail': 'price_1STvdFDATCpMStKark5BCxZ5', 
  'Active Trader': 'price_1STvdmDATCpMStKax7SvIXGp', 
  'Quant Edge': 'price_1STveGDATCpMStKaynj3Y0N6',
};

interface PricingSectionProps {
  onJoinBeta: () => void;
}

export default function PricingSection({ onJoinBeta }: PricingSectionProps) {
  const { uid } = useAuthUser();

  const handleCheckout = async (tierName: string) => {
    console.log('🟢 CHECKOUT: Button clicked for tier:', tierName);
    
    const priceId = STRIPE_PRICE_IDS[tierName];

    if (!priceId) {
      console.error('❌ CHECKOUT: Missing priceId');
      alert('Payment system error or price not found.');
      return;
    }

    try {
      // Get ID token if user is logged in (optional)
      let idToken = null;
      if (uid && auth.currentUser) {
        console.log('🟢 CHECKOUT: User logged in, getting ID token...');
        idToken = await auth.currentUser.getIdToken();
      } else {
        console.log('🟢 CHECKOUT: No user logged in, proceeding as guest...');
      }

      console.log('🟢 CHECKOUT: Calling API...');
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, idToken }),
      });

      console.log('🟢 CHECKOUT: API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (!url) {
        console.error("API returned successfully but no checkout URL was provided.");
        alert('Checkout failed: Missing checkout URL from server.');
        return;
      }
      
      console.log('🟢 CHECKOUT: Redirecting to:', url);
      window.location.href = url;
      
    } catch (error: any) {
      console.error("Checkout Error:", error);
      alert(`Checkout failed: ${error.message}`);
    }
  };

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
        "Email signup access",
      ],
      icon: Layers,
      highlight: false,
    },
    {
      name: "Active Trader",
      price: "$39",
      period: "mo",
      description: "The core product. Full reports and Botman AI synergy.",
      features: [
        "Full access to ALL strategy reports",
        "Direct 'Import to Botman AI' integration",
        "Weekly new verified strategies",
        "Early access to new models + Private Discord"
      ],
      icon: Gem,
      highlight: true,
    },
    {
      name: "Quant Edge",
      price: "$119",
      period: "mo",
      description: "For serious traders needing custom verification and data.",
      features: [
        "All Active Trader features",
        "Full Probability breakdowns (Payoff, Variance)",
        "Probability Map Tradingview indicators Access",
        "Submit 1 custom strategy for backtest/month",
        "Request custom parameter analysis",
      ],
      icon: Brain,
      highlight: false,
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-4">
          💰 Brutally Honest Pricing
        </h2>
        <p className="text-xl text-center text-gray-600 mb-16">
          Stop guessing. Start verifying with data-backed subscription plans.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col p-8 rounded-2xl border-4 ${
                tier.highlight 
                  ? 'border-indigo-600 shadow-xl scale-105 transition-transform duration-300 bg-indigo-50' 
                  : 'border-gray-100 shadow-lg bg-white'
              }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <tier.icon className={`w-6 h-6 ${tier.highlight ? 'text-indigo-600' : 'text-gray-500'}`} />
                <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
              </div>

              <p className="text-3xl font-extrabold text-gray-900 mb-2">
                {tier.price}
                <span className="text-xl font-medium text-gray-500">/{tier.period}</span>
              </p>
              <p className="text-gray-600 mb-6">{tier.description}</p>

              <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <ShieldCheck className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(tier.name)}
                className={`w-full py-3 text-lg font-semibold rounded-xl transition-colors shadow-md ${
                  tier.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              >
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}