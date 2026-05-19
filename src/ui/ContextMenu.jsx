import React, { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore.js';
import {
  Copy,
  Clipboard,
  Layers,
  Lock,
  Unlock,
  Trash2,
} from 'lucide-react';

export default function ContextMenu({
  menuState,
  onClose,
  onCopy,
  onPaste,
  onDuplicate,
  onLockToggle,
  onSendBackward,
  onBringForward,
  onDelete,
}) {
  const { selectedIds } = useUIStore();
  const menuRef = useRef(null);

  const { x, y, visible } = menuState;

  // Close context menu if clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (visible) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const hasSelection = selectedIds.length > 0;

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200/80 shadow-xl rounded-lg py-1 w-44 z-[80]"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {hasSelection ? (
        <React.Fragment>
          <button
            onClick={() => {
              onCopy();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2"><Copy className="w-3.5 h-3.5 text-gray-400" /> Copy</span>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+C</span>
          </button>
          <button
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2"><Clipboard className="w-3.5 h-3.5 text-gray-400" /> Duplicate</span>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+D</span>
          </button>

          <div className="h-[1px] bg-gray-100 my-1" />

          <button
            onClick={() => {
              onLockToggle();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-gray-400" /> Lock / Unlock</span>
            <span className="text-[10px] text-gray-400 font-mono">L</span>
          </button>
          <button
            onClick={() => {
              onBringForward();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-gray-400" /> Bring Forward</span>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+]</span>
          </button>
          <button
            onClick={() => {
              onSendBackward();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-gray-400 rotate-180" /> Send Backward</span>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+[</span>
          </button>

          <div className="h-[1px] bg-gray-100 my-1" />

          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </React.Fragment>
      ) : (
        <button
          onClick={() => {
            onPaste();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2"><Clipboard className="w-3.5 h-3.5 text-gray-400" /> Paste</span>
          <span className="text-[10px] text-gray-400 font-mono">Ctrl+V</span>
        </button>
      )}
    </div>
  );
}
