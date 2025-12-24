
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Proactively prevent any quota or technical limit terminology from appearing in the UI
  const isQuotaRelated = 
    message.toLowerCase().includes('quota') || 
    message.toLowerCase().includes('limit') || 
    message.toLowerCase().includes('request') ||
    message.toLowerCase().includes('429');

  if (type === 'error' && isQuotaRelated) return null;

  const styles = type === 'success' 
    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/10' 
    : 'bg-rose-600 text-white shadow-rose-500/20';

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up glass transition-all ${styles}`}>
      {type === 'success' ? (
         <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
         </div>
      ) : (
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      )}
      <span className="font-bold text-xs tracking-tight">{message}</span>
    </div>
  );
};

export default Toast;
