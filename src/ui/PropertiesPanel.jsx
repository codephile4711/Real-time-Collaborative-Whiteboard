import React from 'react';
import { useUIStore } from '../store/uiStore.js';
import { STICKY_COLORS } from '../lib/colors.js';
import { SCENES } from '../three/sceneRegistry.js';
import {
  Trash2,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';

export default function PropertiesPanel({
  elements,
  updateElement,
  deleteElements,
  bringToFront,
  sendToBack,
}) {
  const { selectedIds, setSelectedIds } = useUIStore();

  if (selectedIds.length === 0) return null;

  // Multi-select actions view
  if (selectedIds.length > 1) {
    const handleMultiDelete = () => {
      deleteElements(selectedIds);
      setSelectedIds([]);
    };

    const handleMultiLock = (locked) => {
      selectedIds.forEach((id) => updateElement(id, { locked }));
    };

    return (
      <div className="fixed right-4 top-4 bg-white border border-gray-200/80 rounded-xl shadow-lg p-4 w-[240px] z-40 space-y-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {selectedIds.length} items selected
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleMultiLock(true)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 text-xs text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" /> Lock
          </button>
          <button
            onClick={() => handleMultiLock(false)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 text-xs text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            <Unlock className="w-3.5 h-3.5" /> Unlock
          </button>
        </div>
        <button
          onClick={handleMultiDelete}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete Selection
        </button>
      </div>
    );
  }

  // Single element configuration panel
  const id = selectedIds[0];
  const el = elements.get(id);
  if (!el) return null;

  const handleDelete = () => {
    deleteElements([id]);
    setSelectedIds([]);
  };

  const handlePropChange = (key, value) => {
    updateElement(id, { [key]: value });
  };

  const render3DProperties = () => {
    const sceneDef = SCENES[el.scene];
    return (
      <React.Fragment>
        <div>
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">Scene Template</label>
          <div className="text-xs font-bold text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200">
            {sceneDef?.label || '3D Object'}
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-gray-400 block">Colors</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={el.primaryColor || '#3B82F6'}
                onChange={(e) => handlePropChange('primaryColor', e.target.value)}
                className="w-6 h-6 rounded border cursor-pointer border-gray-200"
              />
              <span className="text-[10px] text-gray-500 font-mono uppercase truncate">
                {el.primaryColor || '#3b82f6'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={el.secondaryColor || '#10B981'}
                onChange={(e) => handlePropChange('secondaryColor', e.target.value)}
                className="w-6 h-6 rounded border cursor-pointer border-gray-200"
              />
              <span className="text-[10px] text-gray-500 font-mono uppercase truncate">
                {el.secondaryColor || '#10b981'}
              </span>
            </div>
          </div>
        </div>

        {/* Speed & Direction */}
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
            <span>Rotation Speed</span>
            <span className="text-gray-700">{el.rotationSpeed?.toFixed(1) || '1.0'}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={el.rotationSpeed !== undefined ? el.rotationSpeed : 1.0}
            onChange={(e) => handlePropChange('rotationSpeed', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Labels & Toggles */}
        <div className="space-y-2.5 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 block mb-1">Custom Label</label>
            <input
              type="text"
              value={el.label || ''}
              onChange={(e) => handlePropChange('label', e.target.value)}
              placeholder="No label"
              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded text-gray-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-700">Auto Rotate</span>
            <input
              type="checkbox"
              checked={el.autoRotate !== false}
              onChange={(e) => handlePropChange('autoRotate', e.target.checked)}
              className="rounded text-blue-500 border-gray-300 focus:ring-blue-500"
            />
          </div>

          {sceneDef?.hasWireframeOption && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-700">Wireframe</span>
              <input
                type="checkbox"
                checked={el.wireframe || false}
                onChange={(e) => handlePropChange('wireframe', e.target.checked)}
                className="rounded text-blue-500 border-gray-300 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </React.Fragment>
    );
  };

  const renderStickyProperties = () => {
    return (
      <React.Fragment>
        <div>
          <label className="text-[11px] font-semibold text-gray-400 block mb-1.5">Note Color</label>
          <div className="grid grid-cols-4 gap-1.5">
            {STICKY_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handlePropChange('color', color)}
                className={`w-7 h-7 rounded border transition-all ${
                  el.color === color ? 'border-blue-600 scale-105' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
            <span>Font Size</span>
            <span className="text-gray-700">{el.fontSize || 16}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="32"
            value={el.fontSize || 16}
            onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer"
          />
        </div>
      </React.Fragment>
    );
  };

  const renderTextProperties = () => {
    return (
      <React.Fragment>
        {/* Fill color */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">Text Color</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={el.fill || '#000000'}
              onChange={(e) => handlePropChange('fill', e.target.value)}
              className="w-7 h-7 rounded border cursor-pointer border-gray-200"
            />
            <span className="text-xs font-mono uppercase text-gray-600">{el.fill || '#000000'}</span>
          </div>
        </div>

        {/* Font size */}
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
            <span>Font Size</span>
            <span className="text-gray-700">{el.fontSize || 20}px</span>
          </div>
          <input
            type="range"
            min="12"
            max="72"
            value={el.fontSize || 20}
            onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Align & Style toggles */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-gray-400 block">Text Style</label>
          <div className="flex items-center justify-between gap-1 border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => handlePropChange('bold', !el.bold)}
              className={`flex-1 py-1 rounded flex justify-center ${el.bold ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePropChange('italic', !el.italic)}
              className={`flex-1 py-1 rounded flex justify-center ${el.italic ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-gray-200" />
            <button
              onClick={() => handlePropChange('align', 'left')}
              className={`flex-1 py-1 rounded flex justify-center ${el.align === 'left' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePropChange('align', 'center')}
              className={`flex-1 py-1 rounded flex justify-center ${el.align === 'center' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePropChange('align', 'right')}
              className={`flex-1 py-1 rounded flex justify-center ${el.align === 'right' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </React.Fragment>
    );
  };

  const renderShapeProperties = () => {
    return (
      <React.Fragment>
        {/* Colors */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 block mb-1">Fill</label>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={el.fill === 'transparent' ? '#ffffff' : el.fill || '#ffffff'}
                disabled={el.fill === 'transparent'}
                onChange={(e) => handlePropChange('fill', e.target.value)}
                className="w-6 h-6 rounded border cursor-pointer border-gray-200 disabled:opacity-40"
              />
              <button
                onClick={() => handlePropChange('fill', el.fill === 'transparent' ? '#ffffff' : 'transparent')}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  el.fill === 'transparent' ? 'bg-gray-100 border-gray-300 font-bold' : 'border-gray-200'
                }`}
              >
                No Fill
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-400 block mb-1">Stroke</label>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={el.stroke || '#000000'}
                onChange={(e) => handlePropChange('stroke', e.target.value)}
                className="w-6 h-6 rounded border cursor-pointer border-gray-200"
              />
              <span className="text-[10px] font-mono uppercase text-gray-500 truncate">
                {el.stroke || '#000000'}
              </span>
            </div>
          </div>
        </div>

        {/* Stroke width */}
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
            <span>Stroke Width</span>
            <span className="text-gray-700">{el.strokeWidth || 2}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={el.strokeWidth || 2}
            onChange={(e) => handlePropChange('strokeWidth', parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Corner radius for Rectangle */}
        {el.type === 'rect' && (
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
              <span>Corner Radius</span>
              <span className="text-gray-700">{el.cornerRadius || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={el.cornerRadius || 0}
              onChange={(e) => handlePropChange('cornerRadius', parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer"
            />
          </div>
        )}
      </React.Fragment>
    );
  };

  const renderArrowProperties = () => {
    return (
      <React.Fragment>
        <div>
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">Line Color</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={el.stroke || '#000000'}
              onChange={(e) => handlePropChange('stroke', e.target.value)}
              className="w-7 h-7 rounded border cursor-pointer border-gray-200"
            />
            <span className="text-xs font-mono uppercase text-gray-600">{el.stroke || '#000000'}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
            <span>Line Weight</span>
            <span className="text-gray-700">{el.strokeWidth || 2}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="16"
            value={el.strokeWidth || 2}
            onChange={(e) => handlePropChange('strokeWidth', parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer"
          />
        </div>
      </React.Fragment>
    );
  };

  return (
    <div className="fixed right-4 top-4 bg-white border border-gray-200/80 rounded-xl shadow-lg p-4 w-[240px] z-45 space-y-4">
      {/* Header details */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Properties
        </span>
        <button
          onClick={() => handlePropChange('locked', !el.locked)}
          title={el.locked ? 'Unlock element' : 'Lock element'}
          className={`p-1 rounded hover:bg-gray-100 transition-colors ${
            el.locked ? 'text-blue-600 bg-blue-50' : 'text-gray-400'
          }`}
        >
          {el.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
      </div>

      {/* Render conditional inputs */}
      <div className="space-y-4">
        {el.type === 'threed' && render3DProperties()}
        {el.type === 'sticky' && renderStickyProperties()}
        {el.type === 'text' && renderTextProperties()}
        {['rect', 'ellipse'].includes(el.type) && renderShapeProperties()}
        {el.type === 'arrow' && renderArrowProperties()}
      </div>

      {/* Opacity control for all shapes */}
      {el.type !== 'image' && el.type !== 'sticky' && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
            <span>Opacity</span>
            <span className="text-gray-700">{Math.round((el.opacity !== undefined ? el.opacity : 1.0) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={el.opacity !== undefined ? el.opacity : 1.0}
            onChange={(e) => handlePropChange('opacity', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* Layer Ordering controls */}
      {!el.locked && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => bringToFront([id])}
            title="Bring to Front"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 text-[10px] font-bold text-gray-600 rounded hover:bg-gray-50"
          >
            <ChevronsUp className="w-3.5 h-3.5" /> Front
          </button>
          <button
            onClick={() => sendToBack([id])}
            title="Send to Back"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 text-[10px] font-bold text-gray-600 rounded hover:bg-gray-50"
          >
            <ChevronsDown className="w-3.5 h-3.5" /> Back
          </button>
        </div>
      )}

      {/* Delete trigger */}
      <button
        onClick={handleDelete}
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded transition-colors"
      >
        <Trash2 className="w-4 h-4" /> Delete Element
      </button>
    </div>
  );
}
