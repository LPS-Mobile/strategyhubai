'use client';

import { useState } from 'react';
import { Strategy } from '@/app/strategies/page';
import { AdminUser } from '@/app/dashboard/admin/page';
import StrategyAdminTable from './StrategyAdminTable'; 
import UserAdminTable from './UserAdminTable';         
import { Layers, Users } from 'lucide-react';

interface AdminDashboardClientProps {
  initialStrategies: Strategy[];
  initialUsers: AdminUser[];
}

export default function AdminDashboardClient({ 
  initialStrategies, 
  initialUsers 
}: AdminDashboardClientProps) {
  
  // Only manage the Active Tab here. 
  // DO NOT manage the data state here. Let the Tables handle their own data.
  const [activeTab, setActiveTab] = useState<'strategies' | 'users'>('strategies');
  
  // Helper to safely access array length
  const strategyCount = initialStrategies ? initialStrategies.length : 0;
  const userCount = initialUsers ? initialUsers.length : 0;

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('strategies')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-all ${
            activeTab === 'strategies'
              ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Layers className="w-4 h-4 mr-2" />
          Manage Strategies ({strategyCount})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Manage Users ({userCount})
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 bg-gray-50 min-h-[500px]">
        {activeTab === 'strategies' ? (
          // PASS PROPS DIRECTLY - No Middle State
          <StrategyAdminTable 
            initialStrategies={initialStrategies} 
          />
        ) : (
          // PASS PROPS DIRECTLY - No Middle State
          <UserAdminTable 
            users={initialUsers} 
            // We pass a dummy function for setUsers since we are handling state inside the table now
            setUsers={() => {}} 
          />
        )}
      </div>
    </div>
  );
}