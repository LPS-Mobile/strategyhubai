"use client";

import { useState } from 'react'; 
import { useAuthUser } from '@/lib/auth'; 
import { 
  ArrowDownTrayIcon, 
  DocumentTextIcon, 
} from '@heroicons/react/24/solid';
import StrategyActionModal from './StrategyActionModal';

// Define types locally or import them
type SubscriptionTier = "Curious Retail" | "Active Trader" | "Quant Edge" | null;
type UserRole = "admin" | "user" | null; 

interface StrategyActionButtonsProps {
  // ✅ FIX: Accept the full strategy object so we can pass custom links to the modal
  strategy: {
    id: string;
    downloadLink?: string;
    reportLink?: string;
    botmanLink?: string;
    probabilityLink?: string;
    sourceLink?: string;
    [key: string]: any; // Allow other fields
  };
  userSubscription: SubscriptionTier; 
  userRole?: UserRole; 
}

export default function StrategyActionButtons({ 
  strategy, 
  userSubscription: serverSubscription, 
  userRole: serverRole = 'user',
}: StrategyActionButtonsProps) {

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  
  // 1. Get Real-Time Client Data
  const { subscriptionStatus: clientSubscription, role: clientRole, loading } = useAuthUser();

  // 2. Determine Effective Data
  const effectiveSubscription = loading ? serverSubscription : (clientSubscription || serverSubscription);
  const effectiveRole = loading ? serverRole : (clientRole || serverRole);

  // 3. Normalize Tier String
  let userTier = (effectiveSubscription || 'Free').toString();
  const roleStr = (effectiveRole || '').toLowerCase();

  // Force "Admin" tier string if role is admin
  if (roleStr === 'admin' || userTier.toLowerCase().includes('admin')) {
    userTier = 'Admin';
  }

  // 4. Calculate Permissions for the "Quick Download" link
  const tierLower = userTier.toLowerCase();
  const isAdmin = tierLower.includes('admin');
  const isQuant = tierLower.includes('quant');
  const isActive = tierLower.includes('active');
  
  const canQuickDownload = isAdmin || isQuant || isActive;
  const pricingLink = '/dashboard'; 

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Available Actions</h3>
          
          {/* Main Button */}
          <button
              onClick={() => setIsActionModalOpen(true)}
              className="flex items-center space-x-3 px-8 py-4 font-semibold text-lg rounded-full shadow-xl bg-blue-600 text-white hover:bg-blue-700 transition duration-200 transform hover:scale-105"
          >
              <DocumentTextIcon className="w-6 h-6" />
              <span>Access Strategy Tools</span>
          </button>
          
          {/* Quick Download Link (Kept logic same as before) */}
          {canQuickDownload && strategy.downloadLink && (
            <a 
                href={strategy.downloadLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 mt-4 text-gray-700 font-medium hover:text-gray-900 transition underline-offset-4 hover:underline"
            >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Download Results Sheet</span>
            </a>
          )}
      </div>
      
      {/* Modal */}
      {isActionModalOpen && (
          <StrategyActionModal 
              isOpen={isActionModalOpen}
              onClose={() => setIsActionModalOpen(false)}
              strategy={strategy} // ✅ PASSING THE FULL OBJECT WITH LINKS
              userTier={userTier}
              pricingLink={pricingLink}
          />
      )}
    </>
  );
}