// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react'; 
import { useSignOut, useAuthUser } from '@/lib/auth';
import { LogOut, BarChart3, LayoutDashboard, LogIn } from 'lucide-react';
import { SubscribeModal } from '@/components/SubscribeModal'; 

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const handleSignOut = useSignOut();
  
  // 3. Get user auth, subscription status, and role
  // @ts-ignore - ignoring TS error if 'role' isn't explicitly defined in your hook type yet
  const { user, subscriptionStatus, role, loading } = useAuthUser();
  
  // 4. Add state for the new modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 5. FIX: Robust Permission Logic for "Strategies" Link
  const handleStrategiesClick = (e: React.MouseEvent) => {
    
    // 1. Normalize the string to handle "Active Trader", "active", "Admin", etc.
    const status = (subscriptionStatus || '').toLowerCase().trim();
    
    // 2. Check for keywords
    const isActive = status.includes('active');
    const isQuant = status.includes('quant');
    // Allow Curious Retail to see the list (content is gated at the card/detail level)
    const isCurious = status.includes('curious'); 
    
    // 3. Explicit Admin check (via status string OR role from hook)
    const isAdmin = status.includes('admin') || role === 'admin';

    // 4. Determine Access
    const hasAccess = isActive || isQuant || isCurious || isAdmin;

    if (hasAccess) {
      router.push('/strategies');
      return;
    }
    
    // If user has NO valid status (null/free/expired), show modal
    e.preventDefault();
    setIsModalOpen(true);
  };

  // Don't render anything until auth is loaded (prevents flicker)
  if (loading) {
    return <header className="h-16 bg-white border-b border-gray-200" />;
  }
  
  // Define link styling helper
  const navLinkClass = (path: string) => 
    `flex items-center space-x-1 py-2 text-sm font-medium transition-colors cursor-pointer ${
      pathname.startsWith(path)
        ? 'text-indigo-600 border-b-2 border-indigo-600'
        : 'text-gray-500 hover:text-indigo-600'
    }`;

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <Link href={user ? "/dashboard" : "/"} className="flex items-center text-xl font-bold text-gray-900">
            <span>StrategyHub</span>
          </Link>

          <nav className="hidden md:flex space-x-6">
            {/* Show Dashboard link if user is logged in */}
            {user && (
              <Link href="/dashboard" className={navLinkClass('/dashboard')}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            )}

            {/* 6. Strategies link logic using the fixed handler */}
            {user && (
              <a
                href="/strategies" // Use <a> so onClick works properly
                onClick={handleStrategiesClick} // Use the robust handler
                className={navLinkClass('/strategies')}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Strategies</span>
              </a>
            )}
          </nav>

          <div className="flex items-center">
            {user ? (
              <button 
                onClick={handleSignOut} 
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <Link 
                href="/" 
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      {/* 7. Put the modal at the end */}
      {isModalOpen && <SubscribeModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}