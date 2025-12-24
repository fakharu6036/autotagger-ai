import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (keys: string[]) => void;
  onClose: () => void;
  initialKeys?: string[];
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, initialKeys = [] }) => {
  const [keys, setKeys] = useState<string[]>(initialKeys);
  const [currentInput, setCurrentInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setKeys(initialKeys);
  }, [initialKeys, isOpen]);

  if (!isOpen) return null;

  const handleAddKey = () => {
    const trimmed = currentInput.trim();
    if (trimmed && !keys.includes(trimmed)) {
      setKeys([...keys, trimmed]);
      setCurrentInput('');
    }
  };

  const handleRemoveKey = (indexToRemove: number) => {
    setKeys(keys.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If user typed a key but didn't click "Add", add it for them
    let finalKeys = [...keys];
    if (currentInput.trim() && !keys.includes(currentInput.trim())) {
      finalKeys.push(currentInput.trim());
    }
    
    if (finalKeys.length > 0) {
      onSave(finalKeys);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 transform transition-all scale-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 000-2z" clipRule="evenodd" />
            </svg>
            API Key Management
          </h3>
          {initialKeys.length > 0 && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
             Add one or more <strong>Google Gemini API Keys</strong>. The application will rotate through them to distribute the load and increase your processing capacity.
          </p>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Add New Key
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                <input
                    type={showKey ? "text" : "password"}
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="AIza..."
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white font-mono text-sm"
                    autoFocus={keys.length === 0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKey();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    {showKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    )}
                </button>
                </div>
                <button
                    type="button"
                    onClick={handleAddKey}
                    disabled={!currentInput.trim()}
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    Add
                </button>
            </div>
          </div>

          {/* Key List */}
          {keys.length > 0 && (
             <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Active Keys ({keys.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {keys.map((k, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-md">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
                                <code className="text-xs font-mono text-gray-600 dark:text-gray-300">
                                    {k.slice(0, 6)}...{k.slice(-4)}
                                </code>
                             </div>
                             <button
                                type="button"
                                onClick={() => handleRemoveKey(i)}
                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Remove key"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                             </button>
                        </div>
                    ))}
                </div>
             </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={keys.length === 0 && !currentInput.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Keys
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;