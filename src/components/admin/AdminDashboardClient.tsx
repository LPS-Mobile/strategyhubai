'use client';

import { useState } from 'react';
// 1. Import AdminUser from the admin page (where you defined it)
import { AdminUser } from '@/app/dashboard/admin/page';
// 2. Import Strategy from the strategies page (where it is actually defined)
import { Strategy } from '@/app/strategies/page';

import UserAdminTable from './UserAdminTable';
import StrategyAdminTable from './StrategyAdminTable'; 
import AddUserModal from './AddUserModal'; 

export default function AdminDashboardClient({
  initialUsers,
  initialStrategies,
}: {
  initialUsers: AdminUser[];
  initialStrategies: Strategy[]; // Changed from AdminStrategy to Strategy
}) {
  const [tab, setTab] = useState<'users' | 'strategies'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setTab('strategies')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === 'strategies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Strategies
          </button>
        </nav>
      </div>

      {/* Add User Button (Only visible on Users tab) */}
      {tab === 'users' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 font-medium text-sm"
          >
            + Add New User
          </button>
        </div>
      )}

      {/* Render active tab content */}
      <div className="mt-6">
        {tab === 'users' ? (
          <UserAdminTable initialUsers={initialUsers} />
        ) : (
          <StrategyAdminTable initialStrategies={initialStrategies} />
        )}
      </div>

      {/* Render the modal */}
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}