import React, { useRef } from 'react';
import { useUIStore } from '../store/uiStore.js';
import {
  MousePointer,
  Hand,
  PenTool,
  StickyNote,
  Square,
  Circle,
  ArrowRight,
  Type,
  Image as ImageIcon,
  Box,
} from 'lucide-react';

export default function Toolbar({ onThreeDClick, onImageSelect }) {
  const { tool, setTool, showToast } = useUIStore();
  const fileInputRef = useRef(null);

  const tools = [
    { id: 'select', label: 'Select (V)', icon: MousePointer },
    { id: 'hand', label: 'Hand (H)', icon: Hand },
    { id: 'pen', label: 'Pen (P)', icon: PenTool },
    { id: 'sticky', label: 'Sticky Note (S)', icon: StickyNote },
    { id: 'rect', label: 'Rectangle (R)', icon: Square },
    { id: 'ellipse', label: 'Ellipse (E)', icon: Circle },
    { id: 'arrow', label: 'Arrow (A)', icon: ArrowRight },
    { id: 'text', label: 'Text (T)', icon: Type },
  ];

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      showToast('Only image files are supported');
      return;
    }

    // Limit to 2MB to keep websocket traffic healthy
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size exceeds 2MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (onImageSelect) {
        onImageSelect(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200/80 rounded-xl shadow-lg p-1.5 flex flex-col items-center gap-1 z-40">
      {/* Basic Tools */}
      {tools.map((t) => {
        const IconComponent = t.icon;
        const isActive = tool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={t.label}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors group relative ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <IconComponent className="w-5 h-5" />
            <span className="absolute left-12 scale-0 transition-all rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white group-hover:scale-100 whitespace-nowrap pointer-events-none shadow">
              {t.label}
            </span>
          </button>
        );
      })}

      {/* Image selector */}
      <button
        onClick={handleImageClick}
        title="Image (I)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors group relative ${
          tool === 'image'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <ImageIcon className="w-5 h-5" />
        <span className="absolute left-12 scale-0 transition-all rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white group-hover:scale-100 whitespace-nowrap pointer-events-none shadow">
          Image (I)
        </span>
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Visual divider before 3D */}
      <div className="w-6 h-[1.5px] bg-gray-200/80 my-1" />

      {/* 3D picker button */}
      <button
        onClick={onThreeDClick}
        title="3D Element (3)"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors group relative ${
          tool === 'threed'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Box className="w-5 h-5" />
        <span className="absolute left-12 scale-0 transition-all rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white group-hover:scale-100 whitespace-nowrap pointer-events-none shadow">
          3D Element (3)
        </span>
      </button>
    </div>
  );
}
