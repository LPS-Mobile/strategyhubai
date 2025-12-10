'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

// 1. Add 'isOpen' to the component's props
export const SubscribeModal = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  const router = useRouter();

  // 2. THIS IS THE FIX: If the modal isn't open, render nothing.
  if (!isOpen) return null;

  const handleGoToPricing = () => {
    onClose();
    router.push('/#pricing'); // Scroll to the pricing section
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            Upgrade to Pro
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="mb-6 text-gray-600">
          To view and backtest this strategy, you must have an active subscription.
        </p>

        <button
          onClick={handleGoToPricing}
          className="w-full py-3 px-4 rounded-lg font-semibold transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          View Pricing Plans
        </button>
      </div>
    </div>
  );
};