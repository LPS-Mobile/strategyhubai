'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; 
import { CheckCircle2, Loader2, Lock, Mail, User, Sparkles, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const router = useRouter(); 

  const [isLogin, setIsLogin] = useState(false); 
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let user;
      
      // 1. AUTHENTICATE
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
        await updateProfile(user, { displayName: formData.name });
      }

      // 2. SYNC SUBSCRIPTION (Optional background step)
      try {
        await fetch('/api/auth/sync-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            stripeSessionId: sessionId,
          }),
        });
      } catch (syncErr) {
        console.warn('Sync failed (webhook will handle fallback):', syncErr);
      }

      // 3. REDIRECT
      router.push('/dashboard');

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setIsLogin(true);
        setError('That email is already registered. Please Log In to activate.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found. Please Sign Up first.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-4">
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm mb-4 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white">Payment Successful!</h2>
          <p className="text-indigo-100 mt-2 font-medium">
            {isLogin 
              ? 'Welcome back! Log in to access your premium features.' 
              : 'Create your account to get started!'}
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form className="space-y-5" onSubmit={handleAuth}>
            
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="name"
                  type="text"
                  required={!isLogin}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50/50 hover:bg-white"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="email"
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50/50 hover:bg-white"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="password"
                type="password"
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50/50 hover:bg-white"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Log In & Activate' : 'Create Account & Access'}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Section */}
          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-medium">
                  {isLogin ? 'New to the platform?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="mt-4 flex items-center justify-center w-full px-4 py-3 border-2 border-indigo-50 rounded-xl text-indigo-600 font-bold bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-100 transition-all"
            >
              {isLogin ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Create New Account
                </>
              ) : (
                'Log In Instead'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}