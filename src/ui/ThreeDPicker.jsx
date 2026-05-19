import React, { useEffect, useRef, useState } from 'react';
import { SCENES } from '../three/sceneRegistry.js';
import { ThreeRenderer } from '../three/ThreeRenderer.js';
import { X, Check } from 'lucide-react';

function ScenePreview({ sceneKey, primaryColor, secondaryColor, wireframe }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let renderer;
    try {
      renderer = new ThreeRenderer({
        width: 120,
        height: 90,
        sceneKey,
        options: {
          primaryColor,
          secondaryColor,
          autoRotate: true,
          rotationSpeed: 1.5,
          wireframe,
          opacity: 1.0,
        },
      });
      rendererRef.current = renderer;
      containerRef.current.appendChild(renderer.getCanvas());
    } catch (err) {
      console.error('Failed building scene preview:', err);
      // Fallback text
      const fallback = document.createElement('div');
      fallback.innerText = '3D Preview';
      fallback.className = 'text-[10px] text-gray-500 flex items-center justify-center w-full h-full';
      containerRef.current.appendChild(fallback);
    }

    let lastTime = performance.now();
    let animationId;

    const tick = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (renderer) {
        renderer.tick(delta);
      }
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
      if (renderer) {
        renderer.dispose();
        if (renderer.getCanvas() && renderer.getCanvas().parentNode) {
          renderer.getCanvas().parentNode.removeChild(renderer.getCanvas());
        }
      }
    };
  }, [sceneKey]);

  // Hot reload preview edits
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateOptions({
        primaryColor,
        secondaryColor,
        wireframe,
      });
    }
  }, [primaryColor, secondaryColor, wireframe]);

  return <div ref={containerRef} className="w-[120px] h-[90px] bg-[#0f0f14] overflow-hidden rounded relative flex items-center justify-center" />;
}

export default function ThreeDPicker({ isOpen, onClose, onSelect }) {
  const [selectedScene, setSelectedScene] = useState('spinningCube');
  
  // Custom options state
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [wireframe, setWireframe] = useState(false);
  const [label, setLabel] = useState('');

  if (!isOpen) return null;

  const currentSceneDef = SCENES[selectedScene];

  const handlePlace = () => {
    onSelect({
      scene: selectedScene,
      primaryColor,
      secondaryColor,
      autoRotate,
      rotationSpeed,
      wireframe,
      label,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-[540px] rounded-xl border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Add a 3D element</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 3D Scene list grid */}
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">
              Select 3D Shape
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(SCENES).map(([key, def]) => {
                const isSelected = selectedScene === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedScene(key)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                        : 'border-gray-200'
                    }`}
                  >
                    <ScenePreview
                      sceneKey={key}
                      primaryColor={primaryColor}
                      secondaryColor={secondaryColor}
                      wireframe={wireframe}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-800 truncate">{def.label}</div>
                      <div className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-normal">
                        {def.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration panel */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Customize Scene Details
            </span>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer border-gray-200"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 min-w-0 text-xs px-2 py-1.5 border border-gray-200 rounded text-gray-700 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer border-gray-200"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 min-w-0 text-xs px-2 py-1.5 border border-gray-200 rounded text-gray-700 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Label input */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Element Label (Optional)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Earth Core Model"
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded bg-white text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                  className="rounded text-blue-500 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-xs font-semibold text-gray-700">Auto Rotate</span>
              </label>

              {currentSceneDef?.hasWireframeOption && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wireframe}
                    onChange={(e) => setWireframe(e.target.checked)}
                    className="rounded text-blue-500 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-xs font-semibold text-gray-700">Render Wireframe</span>
                </label>
              )}
            </div>

            {/* Rotation Speed range */}
            {autoRotate && (
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                  <span>Rotation Speed</span>
                  <span>{rotationSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePlace}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
          >
            <Check className="w-4 h-4" />
            Place on canvas
          </button>
        </div>
      </div>
    </div>
  );
}
