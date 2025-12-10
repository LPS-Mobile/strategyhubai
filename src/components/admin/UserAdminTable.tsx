'use client';

import { useState } from 'react';
import { AdminUser } from '@/app/dashboard/admin/page';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { deleteUser } from '@/lib/admin-actions'; 

// Define all possible statuses for the dropdown
const STATUS_OPTIONS = [
  { value: 'Inactive', label: 'Inactive (Free)' },
  { value: 'Curious Retail', label: 'Curious Retail ($9/mo)' },
  { value: 'Active Trader', label: 'Active Trader ($39/mo)' },
  { value: 'Quant Edge', label: 'Quant Edge ($119/mo)' },
  { value: 'Admin', label: 'Admin (Full Access)' },
];

export default function UserAdminTable({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null); 

  /**
   * Handles updating the user's role and/or subscription status in Firestore.
   */
  const handleStatusChange = async (
    userId: string,
    newStatus: string 
  ) => {
    setLoading(userId);

    let roleToSave: string | null = null;
    let statusToSave: string | null = null;

    if (newStatus === 'Admin') {
      roleToSave = 'admin';
      statusToSave = null; 
    } else if (newStatus === 'Inactive') {
      roleToSave = null;
      statusToSave = null;
    } else {
      roleToSave = null;
      statusToSave = newStatus;
    }

    try {
      const userRef = doc(db, 'users', userId);

      await setDoc(
        userRef,
        {
          subscriptionStatus: statusToSave,
          role: roleToSave,
        },
        { merge: true }
      );

      // Update the local state to reflect the change immediately
      setUsers(
        users.map((u) =>
          u.id === userId
            // FIX: Cast roleToSave to 'any' because strict type might be "admin" | null
            // FIX: Cast statusToSave to 'any' because strict type might be "active" | "inactive" | null
            ? { ...u, subscriptionStatus: statusToSave as any, role: roleToSave as any }
            : u
        )
      );

      alert(`User ${userId} updated successfully!`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Error: Could not update user. Check console and security rules.');
    } finally {
      setLoading(null);
    }
  };

  /**
   * Helper to determine current status for the dropdown.
   */
  const getCurrentStatus = (user: AdminUser) => {
    if (user.role === 'admin') {
      return 'Admin';
    }

    if (user.subscriptionStatus) {
      if (user.subscriptionStatus === 'active') {
        return 'Active Trader';
      }
      return user.subscriptionStatus;
    }

    return 'Inactive';
  };

  /**
   * Handles deleting a user.
   */
  const handleDeleteUser = async (userId: string, userEmail: string | null) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user ${userEmail || userId}? \nThis action is irreversible and will delete them from Authentication and Firestore.`
      )
    ) {
      return;
    }

    setLoading(userId); 

    try {
      const result = await deleteUser(userId);

      if (result.message === 'User deleted successfully.') {
        setUsers(users.filter((u) => u.id !== userId));
        alert('User deleted successfully.');
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('An unexpected error occurred. Check the console.');
      console.error(error);
    } finally {
      setLoading(null); 
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.displayName || '(No Name)'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <select
                  value={getCurrentStatus(user)}
                  onChange={(e) => handleStatusChange(user.id, e.target.value)}
                  disabled={loading === user.id}
                  className="p-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleDeleteUser(user.id, user.email)}
                  disabled={loading === user.id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {loading === user.id ? 'Working...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}