'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthUser } from '@/lib/auth';
import { CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { LoginModal } from '@/components/Loginmodal';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uid } = useAuthUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (uid) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uid, router]);

  const handleCreateAccount = () => {
    setIsModalOpen(true);
  };

  // SCENARIO 1: User is already logged in
  if (uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-100">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            Updating your account privileges...<br/>
            Redirecting you to your dashboard.
          </p>
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // SCENARIO 2: Guest User (Needs to sign up)
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-100">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            Your subscription is active. Create an account now to access your dashboard.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Please sign up using the <u>same email address</u> you used during checkout so we can link your subscription automatically.
            </p>
          </div>
          
          <button
            onClick={handleCreateAccount}
            className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            Create Account & Access Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>

          {sessionId && (
            <p className="text-xs text-gray-400 mt-6 font-mono">
              Ref: {sessionId.slice(-10)}
            </p>
          )}
        </div>
      </div>
      
      {/* Pass the email hint if your modal supports it, otherwise just open */}
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}