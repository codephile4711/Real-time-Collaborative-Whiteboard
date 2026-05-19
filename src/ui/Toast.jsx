import React from 'react';
import { useUIStore } from '../store/uiStore.js';
import { Info, X } from 'lucide-react';

export default function Toast() {
  const { toast, clearToast } = useUIStore();

  if (!toast) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-gray-900 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-lg border border-gray-800 animate-slide-up">
      <Info className="w-4 h-4 text-blue-400 shrink-0" />
      <span>{toast.message}</span>
      <button
        onClick={clearToast}
        className="ml-2 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
