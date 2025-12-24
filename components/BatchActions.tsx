import React, { useState } from 'react';
import { GenerationProfile } from '../types';

interface BatchActionsProps {
  onApplyCategory: (category: string) => void;
  onApplyProfile: (profile: GenerationProfile) => void;
  onClearAll: () => void;
  hasFiles: boolean;
  disabled: boolean;
  currentProfile: GenerationProfile;
  selectedCount?: number;
}

const COMMON_CATEGORIES = [
  "Abstract", "Animals", "Architecture", "Business", "Education", 
  "Food & Drink", "Healthcare", "Holidays", "Industrial", "Lifestyle", 
  "Nature", "People", "Religion", "Science", "Sports", "Technology", 
  "Transportation", "Travel"
];

const BatchActions: React.FC<BatchActionsProps> = ({ 
  onApplyCategory, 
  onApplyProfile,
  hasFiles, 
  disabled,
  currentProfile,
  selectedCount = 0
}) => {
  const [category, setCategory] = useState('');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (category.trim()) {
      onApplyCategory(category.trim());
      setCategory('');
    }
  };

  if (!hasFiles) return null;

  return (
    <div className={`fixed bottom-8 left-0 right-0 z-40 px-6 transition-all duration-300 ${selectedCount > 0 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full h-18 px-8 shadow-2xl flex items-center justify-between gap-12 max-w-5xl mx-auto glass border-opacity-60">
        
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {selectedCount}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Assets</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Selected</span>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-6">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
             {[GenerationProfile.COMMERCIAL, GenerationProfile.EDITORIAL, GenerationProfile.PRODUCT].map(p => (
               <button
                 key={p}
                 onClick={() => onApplyProfile(p)}
                 className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${currentProfile === p ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
               >
                 {p.split(' ')[0]}
               </button>
             ))}
          </div>

          <form onSubmit={handleApply} className="flex-1 flex items-center gap-4 relative group">
            <div className="flex-1 relative">
              <input
                list="categories-batch"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Bulk Assign Category..."
                className="w-full bg-transparent border-none text-sm font-medium outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 py-2"
                disabled={disabled}
              />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-200 dark:bg-slate-700 group-focus-within:bg-brand-500 transition-colors" />
            </div>
            <datalist id="categories-batch">
              {COMMON_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
            </datalist>
            <button
              type="submit"
              disabled={disabled || !category.trim()}
              className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-30"
            >
              Apply
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BatchActions;