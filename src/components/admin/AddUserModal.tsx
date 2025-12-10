'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createNewUser } from '@/lib/admin-actions';
import { useEffect } from 'react';

// Re-use the status options from the table
const STATUS_OPTIONS = [
  { value: 'Inactive', label: 'Inactive (Free)' },
  { value: 'Curious Retail', label: 'Curious Retail ($9/mo)' },
  { value: 'Active Trader', label: 'Active Trader ($39/mo)' },
  { value: 'Quant Edge', label: 'Quant Edge ($119/mo)' },
  { value: 'Admin', label: 'Admin (Full Access)' },
];

// A helper component for the submit button to show loading state
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? 'Creating...' : 'Create User'}
    </button>
  );
}

export default function AddUserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formState, formAction] = useFormState(createNewUser, { message: null, errors: null });

  useEffect(() => {
    // If user was created successfully, close the modal
    if (formState.message === 'User created successfully!') {
      alert('User created successfully!');
      onClose();
    }
    // If there was an error (but not a validation error), show it
    if (formState.message && formState.message !== 'Validation failed') {
      alert(formState.message);
    }
  }, [formState, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New User</h2>
        <form action={formAction}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
            {formState.errors?.email && <p className="text-red-500 text-xs mt-1">{formState.errors.email[0]}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
            {formState.errors?.password && <p className="text-red-500 text-xs mt-1">{formState.errors.password[0]}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Initial Status</label>
            <select
              id="status"
              name="status"
              defaultValue="Inactive"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
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
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
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