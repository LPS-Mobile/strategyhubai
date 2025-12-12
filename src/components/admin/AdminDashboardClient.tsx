'use client';

import { useState } from 'react';
import { AdminUser } from '@/app/dashboard/admin/page';
import { getAuth } from 'firebase/auth';
import { updateUserCredentials, deleteUser } from '@/lib/admin-actions'; // The server actions we made

interface UserAdminTableProps {
  users: AdminUser[];
  setUsers: (users: AdminUser[]) => void;
}

export default function UserAdminTable({ users, setUsers }: UserAdminTableProps) {
  // Edit State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // --- HANDLERS ---

  const handleEditClick = (user: AdminUser) => {
    setEditingUser(user);
    setNewEmail(user.email || '');
    setNewPassword('');
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

      // Call Server Action
      const result = await updateUserCredentials(idToken, editingUser.id, newEmail, newPassword);

      if (result.success) {
        alert("User updated successfully!");
        
        // Update Local State
        const updatedUsers = users.map((u) => 
          u.id === editingUser.id ? { ...u, email: newEmail } : u
        );
        setUsers(updatedUsers);
        
        setEditingUser(null);
      } else {
        setMessage("Error: " + result.message);
      }
    } catch (err: any) {
      setMessage(err.message);
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
        // Remove from list
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        alert("Failed: " + result.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.role || 'user'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.subscriptionStatus || 'inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                  <button 
                    onClick={() => handleEditClick(user)}
                    className="text-indigo-600 hover:text-indigo-900 font-semibold"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900 font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Edit User Credentials</h3>
            
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
                <p className="text-xs text-gray-500 mt-1">Only enter value if changing password.</p>
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