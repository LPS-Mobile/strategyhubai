'use client';

import React, { useState } from 'react';
import { Strategy } from '@/app/strategies/page';
import StrategyFormModal from './StrategyFormModal';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface StrategyAdminTableProps {
  initialStrategies: Strategy[];
}

export default function StrategyAdminTable({ initialStrategies }: StrategyAdminTableProps) {
  const [strategies, setStrategies] = useState(initialStrategies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  // --- HANDLERS ---

  const handleAdd = () => {
    setEditingStrategy(null); // Clear any existing data
    setIsModalOpen(true);
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setIsModalOpen(true);
  };

  // Logic to update the list state after a successful save/update/add
  const handleStrategyUpdate = (newStrategy: Strategy) => {
    if (editingStrategy) {
      // Update existing strategy in state
      setStrategies(strategies.map((s) => (s.id === newStrategy.id ? newStrategy : s)));
    } else {
      // Add new strategy to state
      setStrategies([...strategies, newStrategy]);
    }
    setIsModalOpen(false);
  };

  // Logic to handle Deletion
  const handleDelete = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      return;
    }

    try {
      const docRef = doc(db, 'strategies', strategyId);
      await deleteDoc(docRef);

      // Remove the deleted strategy from local state
      setStrategies(strategies.filter((s) => s.id !== strategyId));

      console.log(`Strategy ${strategyId} deleted successfully.`);
    } catch (error) {
      console.error('Error deleting strategy:', error);
      alert('Failed to delete strategy. Check console for details.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      {/* Header and Add Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Manage Strategies</h2>
        <button
          onClick={handleAdd} // This calls your handleAdd function
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
            {strategies.map((strategy) => (
              <tr key={strategy.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{strategy.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{((strategy.winRate ?? 0) * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(strategy.profitFactor ?? 0).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{strategy.assetClass}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(strategy)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded hover:bg-indigo-50"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(strategy.id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Strategy Form Modal */}
      <StrategyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        strategyToEdit={editingStrategy}
        onSave={handleStrategyUpdate} // Handles both Add and Update success
      />
    </div>
  );
}