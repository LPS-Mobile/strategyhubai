'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  // 1. Import User type and getAdditionalUserInfo
  User,
  getAdditionalUserInfo
} from 'firebase/auth';
// 2. Import db (Firestore)
import { auth, db } from '@/lib/firebase';
// 3. Import Firestore functions
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// 4. NEW: Helper function to create the user document in Firestore
// This is the key fix: it runs ONLY for new users.
const createUserDocument = async (user: User) => {
  console.log('Step 4.5: Creating new user doc in Firestore...');
  const userRef = doc(db, 'users', user.uid);
  try {
    // Set the initial subscriptionStatus to null
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLoginAt: serverTimestamp(),
      subscriptionStatus: null, // <-- This is the crucial part
    });
    console.log('Step 4.6: New user doc created.');
  } catch (error) {
    console.error('Failed to create user document:', error);
  }
};

export const LoginModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    console.log('===== GOOGLE LOGIN START =====');
    console.log('Step 1: Button clicked');
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Step 2: Trying popup method first');
      
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const freshProvider = new GoogleAuthProvider();
      
      console.log('Step 3: Calling signInWithPopup');
      const result = await signInWithPopup(auth, freshProvider);
      
      console.log('Step 4: SUCCESS!', result.user.email);
      
      // 5. CHECK IF NEW USER & CREATE DOC
      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser) {
        // Only create the doc if they are a new user
        await createUserDocument(result.user);
      } else {
        // For existing users, just update their last login time
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
        console.log('Step 4.5: Existing user login time updated.');
      }

      // Close modal and navigate
      onClose();
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('===== ERROR =====');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please contact support.');
      } else {
        setError(`Google sign-in failed: ${error.message}`);
      }
      
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        // 6. CREATE NEW EMAIL USER
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        // Create their document in Firestore
        await createUserDocument(user);
      } else {
        // 7. SIGN IN EXISTING EMAIL USER
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        // Just update their login time
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
        console.log('Existing email user login time updated.');
      }

      onClose();
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Email auth error:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Email already registered. Try logging in.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/user-not-found':
          setError('No account found. Sign up instead?');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        default:
          setError('Authentication failed. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-6 text-gray-600">
          {isSignUp 
            ? 'Join StrategyHub Beta' 
            : 'Log in to access your strategies'}
        </p>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="you@example.com"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 hover:border-gray-400'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        {/* Toggle Sign Up / Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setPassword('');
              setConfirmPassword('');
            }}
            disabled={loading}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
          >
            {isSignUp 
              ? 'Already have an account? Log in' 
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};