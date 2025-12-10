'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthUser } from '@/lib/auth';
import { CheckCircle, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { LoginModal } from '@/components/Loginmodal';

// --- 1. THE CONTENT COMPONENT (Logic lives here) ---
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uid } = useAuthUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Safe to use here because we will wrap this component in Suspense below
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
      
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

// --- 2. FALLBACK COMPONENT (Shown while loading search params) ---
function SuccessFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 font-medium">Verifying payment...</p>
       </div>
    </div>
  );
}

// --- 3. THE MAIN PAGE COMPONENT (Exports Suspense Wrapper) ---
export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessContent />
    </Suspense>
  );
}