'use client';

import React, { useState, useEffect } from 'react';
import { Strategy } from '@/app/strategies/page'; 
import { db } from '@/lib/firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';

interface StrategyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (strategy: Strategy) => void;
  strategyToEdit: Strategy | null;
}

// Helper to generate a simple mock equity curve
const generateMockEquityCurve = () => ([
    { value: 1000 }, { value: 1050 }, { value: 1100 }, 
    { value: 1200 }, { value: 1250 }, { value: 1300 }, 
]);

// --- 1. UPDATE STATE TO INCLUDE TOOL LINKS ---
const initialFormData = {
  name: '',
  // Metrics
  winRate: 0,
  profitFactor: 0,
  maxDrawdown: 0,
  tradeCount: 0,
  riskReward: 0,
  expectancy: 0,
  durationMonths: 0,

  // Info
  market: '',
  timeframe: '',
  tagsString: '', 

  // Links
  sourceReference: '',
  sourceLink: '', 
  downloadLink: '', 
  
  // ✅ NEW FIELDS FOR MODAL TOOLS
  reportLink: '',       
  botmanLink: '',       
  probabilityLink: '',  

  assetClass: '',
  description: '',
  backtestImageUrl: '',
};

type FormDataType = typeof initialFormData;

export default function StrategyFormModal({ isOpen, onClose, onSave, strategyToEdit }: StrategyFormModalProps) {
  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form on edit
  useEffect(() => {
    if (isOpen) {
      if (strategyToEdit) {
        // FIX: Cast to 'any' to allow destructuring of properties that might not be in the strict Strategy type yet
        const { 
            id, youtubeThumbnailUrl, tags, equityCurve, ...rest 
        } = strategyToEdit as any;
        
        setFormData({
          ...initialFormData, 
          name: rest.name || '',
          winRate: rest.winRate || 0,
          profitFactor: rest.profitFactor || 0,
          maxDrawdown: rest.maxDrawdown || 0,
          tradeCount: rest.tradeCount || 0,
          riskReward: rest.riskReward || 0,
          expectancy: rest.expectancy || 0,
          durationMonths: rest.durationMonths || 0,
          market: rest.market || '',
          timeframe: rest.timeframe || '',
          sourceReference: rest.sourceReference || '',
          downloadLink: rest.downloadLink || '',
          sourceLink: rest.sourceLink || '',
          assetClass: rest.assetClass || '',
          description: rest.description || '',
          backtestImageUrl: rest.backtestImageUrl || '', 
          tagsString: tags ? tags.join(', ') : '',
          
          // ✅ LOAD EXISTING LINKS (or empty string)
          reportLink: rest.reportLink || '',
          botmanLink: rest.botmanLink || '',
          probabilityLink: rest.probabilityLink || '',
        });
      } else {
        setFormData(initialFormData);
      }
      setError('');
    }
  }, [isOpen, strategyToEdit]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' || ['winRate', 'profitFactor', 'maxDrawdown', 'tradeCount', 'riskReward', 'expectancy', 'durationMonths'].includes(name)
          ? value === '' ? 0 : parseFloat(value)
          : value,
    }));
  };

  const deriveYouTubeThumbnailUrl = (videoUrl: string): string => {
    try {
      const url = new URL(videoUrl);
      let videoId: string | null = null;
      if (url.hostname === 'youtu.be') videoId = url.pathname.slice(1);
      else if (url.hostname.includes('youtube.com')) videoId = url.searchParams.get('v');
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
    } catch { return ''; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.backtestImageUrl) throw new Error('Backtest chart image URL is required.');
      
      const tagsArray = formData.tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
          
      const dataToSave = {
          name: formData.name,
          description: formData.description,
          assetClass: formData.assetClass,
          sourceReference: formData.sourceReference,
          downloadLink: formData.downloadLink,
          sourceLink: formData.sourceLink,
          backtestImageUrl: formData.backtestImageUrl,
          
          // ✅ SAVE THE NEW LINKS
          reportLink: formData.reportLink,
          botmanLink: formData.botmanLink,
          probabilityLink: formData.probabilityLink,

          // Metrics
          winRate: Number(formData.winRate),
          profitFactor: Number(formData.profitFactor),
          maxDrawdown: Number(formData.maxDrawdown),
          tradeCount: Number(formData.tradeCount),
          riskReward: Number(formData.riskReward),
          expectancy: Number(formData.expectancy),
          durationMonths: Number(formData.durationMonths),

          market: formData.market,
          timeframe: formData.timeframe,
          tags: tagsArray,
          youtubeThumbnailUrl: deriveYouTubeThumbnailUrl(formData.sourceLink),
          equityCurve: generateMockEquityCurve(),
      };

      let savedStrategy: Strategy;

      if (strategyToEdit) {
        const docRef = doc(db, 'strategies', strategyToEdit.id);
        await setDoc(docRef, dataToSave, { merge: true });
        savedStrategy = { id: strategyToEdit.id, createdAt: strategyToEdit.createdAt, ...dataToSave } as Strategy;
      } else {
        const colRef = collection(db, 'strategies');
        const newDocRef = await addDoc(colRef, dataToSave);
        savedStrategy = { id: newDocRef.id, createdAt: new Date(), ...dataToSave } as Strategy;
      }

      onSave(savedStrategy);
      onClose();
    } catch (err) {
      console.error('Error saving:', err);
      setError(`Failed to save. ${err instanceof Error ? err.message : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  const title = strategyToEdit ? `Edit Strategy: ${formData.name}` : 'Add New Strategy';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center">
      <div className="relative top-10 p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4 border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* --- COLUMN 1 --- */}
          <div>
            <h4 className="text-lg font-semibold mb-3 border-b pb-1">General Info & Performance</h4>
            {/* ... Existing Inputs (Name, Description, Metrics) ... */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Strategy Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Win Rate</label>
                <input type="number" step="0.01" name="winRate" value={formData.winRate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Profit Factor</label>
                <input type="number" step="0.01" name="profitFactor" value={formData.profitFactor} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Max Drawdown</label>
                <input type="number" step="0.01" name="maxDrawdown" value={formData.maxDrawdown} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
            </div>

            <h5 className="text-md font-semibold mt-4 mb-2 border-b pb-1">Extended Performance Data</h5>
            <div className="grid grid-cols-2 gap-3">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700"># Trades</label>
                    <input type="number" name="tradeCount" value={formData.tradeCount} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Risk:Reward</label>
                    <input type="number" step="0.1" name="riskReward" value={formData.riskReward} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Expectancy</label>
                    <input type="number" step="0.01" name="expectancy" value={formData.expectancy} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Duration (Months)</label>
                    <input type="number" name="durationMonths" value={formData.durationMonths} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>

            <h5 className="text-md font-semibold mt-4 mb-2 border-b pb-1">Market & Tagging</h5>
            <div className="grid grid-cols-2 gap-3">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Market</label>
                    <input type="text" name="market" value={formData.market} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Timeframe</label>
                    <input type="text" name="timeframe" value={formData.timeframe} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <input type="text" name="tagsString" value={formData.tagsString} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="Trend, Scalper..." />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Asset Class</label>
              <input type="text" name="assetClass" value={formData.assetClass} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>
          </div>

          {/* --- COLUMN 2 --- */}
          <div>
            <h4 className="text-lg font-semibold mb-3 border-b pb-1">Source & Verification Assets</h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Source Reference</label>
              <input type="text" name="sourceReference" value={formData.sourceReference} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">YouTube Video URL</label>
              <input type="url" name="sourceLink" value={formData.sourceLink} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Backtest Image URL</label>
              <input type="url" name="backtestImageUrl" value={formData.backtestImageUrl} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="https://..." />
            </div>

            {/* ✅ NEW: MODAL TOOL LINKS */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h5 className="text-md font-bold text-blue-900 mb-3">Tool Links (Pop-up Buttons)</h5>
                
                <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Report URL (PDF/Sheet)</label>
                    <input type="url" name="reportLink" value={formData.reportLink} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm" placeholder="https://docs.google.com/..." />
                </div>

                <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Botman Import URL</label>
                    <input type="url" name="botmanLink" value={formData.botmanLink} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm" placeholder="https://..." />
                </div>

                <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Probability Analysis URL</label>
                    <input type="url" name="probabilityLink" value={formData.probabilityLink} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm" placeholder="https://..." />
                </div>
            </div>

            <div className="mb-4 mt-4">
              <label className="block text-sm font-medium text-gray-700">Code/Results Download Link</label>
              <input type="url" name="downloadLink" value={formData.downloadLink} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end space-x-4 mt-4 border-t pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 transition" disabled={isLoading}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Strategy'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}