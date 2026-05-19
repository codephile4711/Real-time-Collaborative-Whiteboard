import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore.js';
import { Box, Sparkles, ArrowRight, Layers, Move } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [boardName, setBoardName] = useState('');

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connect to Express proxy backend
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: boardName.trim() || 'Collaborative Whiteboard',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create board');
      }

      const data = await response.json();
      showToast(`Board "${data.name}" created successfully!`);
      navigate(`/board/${data.roomId}`);
    } catch (err) {
      console.error(err);
      showToast('Could not create board. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0f0f15] text-white flex flex-col items-center justify-center overflow-hidden">
      {/* Decorative gradient glowing mesh */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none" />

      {/* Repeating grid bg */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative max-w-xl text-center px-6 z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-blue-400 font-bold mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          Infinite Real-time Whiteboard
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
          Draw, Think, and Build in{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
            3D Space
          </span>
        </h1>

        {/* Description */}
        <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
          Create infinite, collaborative canvases with real-time vector path compression, rich media sharing, and immersive Three.js 3D elements.
        </p>

        {/* Input & Form */}
        <form onSubmit={handleCreateBoard} className="space-y-4 max-w-sm mx-auto mb-16">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Enter board name..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20"
          >
            {loading ? 'Creating Canvas...' : 'Launch New Whiteboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5 text-left max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 mb-1.5">
              <Move className="w-3.5 h-3.5 text-blue-400" /> Infinite Canvas
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Pan & zoom seamlessly between 5% and 400%.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Live Sync
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Zero conflict collaborative edits powered by Yjs.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 mb-1.5">
              <Box className="w-3.5 h-3.5 text-emerald-400" /> 3D Elements
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Host animated ThreeJS models inside the board.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
