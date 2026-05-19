import React from 'react';
import { useUIStore } from '../store/uiStore.js';
import { X, Copy, Check } from 'lucide-react';

export default function ShareModal({ isOpen, onClose }) {
  const { showToast } = useUIStore();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-[420px] rounded-xl border border-gray-100 shadow-2xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">Share Whiteboard</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 mb-4 leading-normal">
          Anyone with this link can view, draw, type, and place 3D elements in real time.
        </p>

        {/* Copy input row */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1.5 bg-gray-50 mb-6">
          <input
            type="text"
            readOnly
            value={window.location.href}
            className="flex-1 text-xs bg-transparent border-none outline-none px-2 text-gray-600 select-all truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Action Close */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
