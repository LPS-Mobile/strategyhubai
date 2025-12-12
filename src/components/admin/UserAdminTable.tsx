'use client';

import { useState } from 'react';
import { AdminUser } from '@/app/dashboard/admin/page';
import { getAuth } from 'firebase/auth';
import { updateUserCredentials, deleteUser } from '@/lib/admin-actions'; 
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface UserAdminTableProps {
  users?: AdminUser[];
  setUsers: (users: AdminUser[]) => void;
}

export default function UserAdminTable({ users = [], setUsers }: UserAdminTableProps) {
  
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [newRole, setNewRole] = useState<'admin' | 'user' | null>(null);
  
  // FIX: Changed from specific literal to string to support Plan Names
  const [newPlan, setNewPlan] = useState<string>('free');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // --- HANDLERS ---

  const handleEditClick = (user: AdminUser) => {
    setEditingUser(user);
    setNewEmail(user.email || '');
    setNewPassword(''); 
    setNewRole(user.role || 'user');
    
    // FIX: Load the current plan (e.g., 'Quant Edge') or default to 'free'
    // This allows you to see what they currently have
    setNewPlan(user.subscriptionStatus || 'free');
    
    setMessage('');
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setLoading(true);
    setMessage('');
    
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");
      const idToken = await currentUser.getIdToken();

      // 1. Update Auth Credentials
      const result = await updateUserCredentials(idToken, editingUser.id, newEmail, newPassword);
      if (!result.success) throw new Error(result.message);

      // 2. Update Firestore (Role AND Specific Plan Name)
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        role: newRole,
        subscriptionStatus: newPlan, // Saving "Quant Edge", "Active Trader", etc.
        email: newEmail 
      });

      alert("User updated successfully!");
      
      // 3. Update Local State
      const updatedUsers = users.map((u) => 
        u.id === editingUser.id ? { 
          ...u, 
          email: newEmail,
          role: newRole as 'admin' | null,
          subscriptionStatus: newPlan as any // Cast to any to satisfy strict literal types if needed
        } : u
      );
      setUsers(updatedUsers);
      
      setEditingUser(null);

    } catch (err: any) {
      console.error(err);
      setMessage("Error: " +( err.message || "Failed to update"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure? This will delete the user permanently.")) return;

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      const result = await deleteUser(idToken, userId);

      if (result.success) {
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        alert("Failed: " + result.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const safeUsers = users || [];

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email / Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Plan Tier</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="font-medium">{user.displayName || '(No Name)'}</div>
                  <div className="text-gray-500 text-xs">{user.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{user.role || 'user'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (user.subscriptionStatus || '').toLowerCase().includes('quant') ? 'bg-orange-100 text-orange-800' :
                    (user.subscriptionStatus || '').toLowerCase().includes('active') ? 'bg-purple-100 text-purple-800' :
                    (user.subscriptionStatus || '').toLowerCase().includes('curious') ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.subscriptionStatus || 'Free'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                  <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900 font-semibold">Edit</button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
                </td>
              </tr>
            ))}
            {safeUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input 
                  type="text" 
                  placeholder="Leave empty to keep current"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={newRole || 'user'}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* FIX: Plan Tier Dropdown (NOT just active/inactive) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Subscription Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="free">Free Tier</option>
                  <option value="Curious Retail">Curious Retail ($9)</option>
                  <option value="Active Trader">Active Trader ($39)</option>
                  <option value="Quant Edge">Quant Edge ($119)</option>
                  {/* Optional: Keep 'active' as a fallback if legacy data exists */}
                  <option value="active">Legacy Active</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">This directly sets their access level.</p>
              </div>

              {message && (
                <div className={`text-sm p-2 rounded ${message.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}