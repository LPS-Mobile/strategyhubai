// src/components/strategies/StrategyActionModal.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { 
    XMarkIcon, 
    ArrowDownCircleIcon, 
    BeakerIcon, 
    DocumentTextIcon,
    LockClosedIcon,
    StarIcon
} from '@heroicons/react/24/solid';

interface StrategyActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    strategy: {
        id: string;
        reportLink?: string;       
        botmanLink?: string;       
        probabilityLink?: string;
        [key: string]: any; 
    } | null; 
    userTier: string; 
    pricingLink: string;
}

export default function StrategyActionModal({
    isOpen,
    onClose,
    strategy,
    userTier = "Guest",
    pricingLink,
}: StrategyActionModalProps) {
    
    if (!isOpen || !strategy) return null;

    // --- 1. PERMISSION LOGIC ---
    const tier = (userTier || "").toLowerCase();
    const isAdmin = tier.includes('admin'); 
    const isQuant = isAdmin || tier.includes('quant');
    const isActive = isQuant || tier.includes('active');
    const isCurious = isActive || tier.includes('curious'); 

    // --- 2. ACCESS FLAGS ---
    const canUnlockReport = isCurious;      
    const canBotmanImport = isActive;       
    const canViewProbability = isQuant;     

    // --- 3. DYNAMIC LINKS ---
    const reportUrl = strategy.reportLink || `/strategies/${strategy.id}/report`;
    const botmanUrl = strategy.botmanLink || `/strategies/${strategy.id}/botman`;
    const probabilityUrl = strategy.probabilityLink || `/strategies/${strategy.id}/probability`;

    const getTarget = (url: string) => (url.startsWith('http') ? '_blank' : '_self');

    // --- HELPER: Button Styling ---
    const getButtonClass = (canAccess: boolean, colorBase: string) => {
        const base = "group flex flex-col items-start p-5 rounded-xl shadow-sm transition-all duration-200 w-full text-left border-2 relative overflow-hidden";
        if (canAccess) {
            const colors: Record<string, string> = {
                blue: "bg-white border-blue-100 hover:border-blue-500 hover:bg-blue-50 text-blue-900 shadow-md hover:shadow-lg cursor-pointer",
                purple: "bg-white border-purple-100 hover:border-purple-500 hover:bg-purple-50 text-purple-900 shadow-md hover:shadow-lg cursor-pointer",
                indigo: "bg-white border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-900 shadow-md hover:shadow-lg cursor-pointer",
            };
            return `${base} ${colors[colorBase]}`;
        }
        return `${base} bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 cursor-pointer`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-fade-in-up border border-gray-100"
                onClick={(e) => e.stopPropagation()} 
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Strategy Tools</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Plan: <span className="font-semibold text-indigo-600 capitalize">{userTier}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                    </button>
                </div>

                <div className="space-y-4">
                    
                    {/* 1. Full Report Access */}
                    <Link
                        href={canUnlockReport ? reportUrl : pricingLink}
                        target={canUnlockReport ? getTarget(reportUrl) : "_self"}
                        className={getButtonClass(canUnlockReport, 'blue')}
                    >
                        <div className="flex items-center justify-between w-full mb-1">
                            <div className="flex items-center gap-2">
                                {canUnlockReport ? <DocumentTextIcon className="w-6 h-6 text-blue-600"/> : <LockClosedIcon className="w-6 h-6 text-gray-400"/>}
                                <span className="text-lg font-bold text-gray-900">Full Report Access</span>
                            </div>
                            {!canUnlockReport && (
                                <span className="text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                                    Curious Retail
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">View equity curves, trade logs, and deep performance metrics.</p>
                    </Link>

                    {/* 2. Botman AI Import (LABELED COMING SOON) */}
                    <Link
                        href={canBotmanImport ? botmanUrl : pricingLink}
                        target={canBotmanImport ? getTarget(botmanUrl) : "_self"}
                        className={getButtonClass(canBotmanImport, 'purple')}
                    >
                         <div className="flex items-center justify-between w-full mb-1">
                            <div className="flex items-center gap-2">
                                {canBotmanImport ? <ArrowDownCircleIcon className="w-6 h-6 text-purple-600"/> : <LockClosedIcon className="w-6 h-6 text-gray-400"/>}
                                
                                {/* Label + Badge Wrapper */}
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-gray-900">Import to Botman AI</span>
                                    {/* Coming Soon Badge */}
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                            
                             {!canBotmanImport && (
                                <span className="text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                                    Active Trader
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">One-click deployment to automate this strategy instantly.</p>
                    </Link>

                    {/* 3. Probability Insights */}
                    <Link
                        href={canViewProbability ? probabilityUrl : pricingLink}
                        target={canViewProbability ? getTarget(probabilityUrl) : "_self"}
                        className={getButtonClass(canViewProbability, 'indigo')}
                    >
                        <div className="flex items-center justify-between w-full mb-1">
                            <div className="flex items-center gap-2">
                                {canViewProbability ? <BeakerIcon className="w-6 h-6 text-indigo-600"/> : <LockClosedIcon className="w-6 h-6 text-gray-400"/>}
                                <span className="text-lg font-bold text-gray-900">Probability Insights</span>
                            </div>
                            {!canViewProbability && (
                                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">
                                    <StarIcon className="w-3 h-3"/> Quant Edge
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">Advanced regime analysis, payoff variance, and failure models.</p>
                    </Link>

                </div>
            </div>
        </div>
    );
}