import React, { useCallback } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(Array.from(e.dataTransfer.files));
        e.dataTransfer.clearData();
      }
    },
    [onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="group relative border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-20 text-center hover:border-brand-500 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 w-full max-w-4xl"
    >
      <input
        type="file"
        multiple
        className="hidden"
        id="file-upload"
        onChange={handleChange}
        accept="image/*,video/*,.pdf,.txt,.doc,.docx,.ai,.eps,.svg"
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-8">
        <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center text-brand-600 transition-transform group-hover:scale-105 duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        </div>
        
        <div>
          <h3 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2 tracking-tight">
            Import Asset Library
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Drag files here or click to browse. Supports stock-standard image, video, and design formats.
          </p>
        </div>

        <div className="flex gap-3">
           <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">49 Tags</span>
           <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">SEO Ready</span>
           <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">N-Batch</span>
        </div>
      </label>
    </div>
  );
};

export default FileUpload;