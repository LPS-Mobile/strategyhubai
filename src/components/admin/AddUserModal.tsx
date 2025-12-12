'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createNewUser } from '@/lib/admin-actions'; // Ensure this imports the updated function
import { useEffect } from 'react';

// Define the State Type locally or import it if you exported it
type ActionState = {
  message: string;
  errors: Record<string, string[]> | null;
};

const STATUS_OPTIONS = [
  { value: 'Inactive', label: 'Inactive (Free)' },
  { value: 'Curious Retail', label: 'Curious Retail ($9/mo)' },
  { value: 'Active Trader', label: 'Active Trader ($39/mo)' },
  { value: 'Quant Edge', label: 'Quant Edge ($119/mo)' },
  { value: 'Admin', label: 'Admin (Full Access)' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
    >
      {pending ? 'Creating...' : 'Create User'}
    </button>
  );
}

// Initial state matching the ActionState type
const initialState: ActionState = {
  message: '',
  errors: null,
};

export default function AddUserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  
  // FIX: useFormState is now typed correctly because createNewUser matches the signature
  const [formState, formAction] = useFormState(createNewUser, initialState);

  useEffect(() => {
    if (formState.message === 'User created successfully!') {
      alert('User created successfully!');
      onClose();
    } else if (formState.message && formState.message !== 'Validation failed') {
      // Only show alert for general errors, not validation errors (which show under inputs)
      alert(formState.message);
    }
  }, [formState, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Add New User</h2>
        
        <form action={formAction}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {formState.errors?.email && (
              <p className="text-red-500 text-xs mt-1">{formState.errors.email[0]}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {formState.errors?.password && (
              <p className="text-red-500 text-xs mt-1">{formState.errors.password[0]}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Initial Status</label>
            <select
              id="status"
              name="status"
              defaultValue="Inactive"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}