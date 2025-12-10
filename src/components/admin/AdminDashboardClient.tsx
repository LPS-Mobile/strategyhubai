'use client';

import { useState } from 'react';
import { AdminUser, AdminStrategy } from '@/app/dashboard/admin/page';
import UserAdminTable from './UserAdminTable';
import StrategyAdminTable from './StrategyAdminTable'; // Assuming this exists
import AddUserModal from './AddUserModal'; // Import the new modal

export default function AdminDashboardClient({
  initialUsers,
  initialStrategies,
}: {
  initialUsers: AdminUser[];
  initialStrategies: AdminStrategy[];
}) {
  const [tab, setTab] = useState<'users' | 'strategies'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false); // State for the modal

  return (
    <>
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setTab('users')}
            className={`... ${tab === 'users' ? 'border-blue-500 text-blue-600' : '...'} `}
          >
            Manage Users
          </button>
          <button
            onClick={() => setTab('strategies')}
            className={`... ${tab === 'strategies' ? 'border-blue-500 text-blue-600' : '...'} `}
          >
            Manage Strategies
          </button>
        </nav>
      </div>

      {/* Add User Button */}
      {tab === 'users' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
          >
            + Add New User
          </button>
        </div>
      )}

      {/* Render active tab content */}
      <div>
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