'use client';

import React, { useState, useEffect } from 'react';
import { Strategy } from '@/app/strategies/page';
import StrategyFormModal from './StrategyFormModal';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface StrategyAdminTableProps {
  initialStrategies?: Strategy[];
}

export default function StrategyAdminTable({ initialStrategies }: StrategyAdminTableProps) {
  
  // Initialize state
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  // --- CRITICAL FIX ---
  // When the "real" data arrives from the database (via props), update the local state.
  useEffect(() => {
    if (initialStrategies && initialStrategies.length > 0) {
      setStrategies(initialStrategies);
    }
  }, [initialStrategies]);
  // --------------------

  // --- HANDLERS ---

  const handleAdd = () => {
    setEditingStrategy(null); 
    setIsModalOpen(true);
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setIsModalOpen(true);
  };

  const handleStrategyUpdate = (newStrategy: Strategy) => {
    if (editingStrategy) {
      setStrategies(strategies.map((s) => (s.id === newStrategy.id ? newStrategy : s)));
    } else {
      setStrategies([...strategies, newStrategy]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return;

    try {
      await deleteDoc(doc(db, 'strategies', strategyId));
      setStrategies(strategies.filter((s) => s.id !== strategyId));
    } catch (error) {
      console.error('Error deleting strategy:', error);
      alert('Failed to delete.');
    }
  };

  const displayStrategies = strategies || [];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Manage Strategies</h2>
        <button
          onClick={handleAdd} 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New Strategy
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Factor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayStrategies.map((strategy) => (
              <tr key={strategy.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{strategy.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{((strategy.winRate ?? 0) * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(strategy.profitFactor ?? 0).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{strategy.assetClass}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(strategy)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded hover:bg-indigo-50"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(strategy.id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            
            {displayStrategies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No strategies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StrategyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        strategyToEdit={editingStrategy}
        onSave={handleStrategyUpdate} 
      />
    </div>
  );
}