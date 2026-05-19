import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import { useUIStore } from '../store/uiStore.js';
import { useYjs } from '../sync/useYjs.js';
import { useElements } from '../sync/useElements.js';
import { useAwareness } from '../sync/useAwareness.js';
import { useHistory } from '../tools/useHistory.js';
import { useViewport } from '../tools/useViewport.js';
import WhiteboardCanvas from '../canvas/WhiteboardCanvas.jsx';
import Toolbar from '../ui/Toolbar.jsx';
import PropertiesPanel from '../ui/PropertiesPanel.jsx';
import PresenceBar from '../ui/PresenceBar.jsx';
import ShareModal from '../ui/ShareModal.jsx';
import ThreeDPicker from '../ui/ThreeDPicker.jsx';
import Toast from '../ui/Toast.jsx';
import ContextMenu from '../ui/ContextMenu.jsx';
import {
  Share2,
  ChevronLeft,
  Download,
  Upload,
  Undo2,
  Redo2,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function Board() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const {
    tool,
    setTool,
    selectedIds,
    setSelectedIds,
    editingId,
    user,
    zoom,
    pan,
    setZoom,
    setPan,
    showToast,
  } = useUIStore();

  // Yjs Collaboration Layer
  const { ydoc, provider, connected, elementsMap, metaMap } = useYjs(roomId);
  
  // Element Actions
  const {
    elements,
    addElement,
    updateElement,
    deleteElements,
    duplicateElements,
    bringToFront,
    sendToBack,
    getSortedElements,
  } = useElements(elementsMap, ydoc, showToast);

  // Awareness (collaborator tracking)
  const { states, updateCursor, updateTool, updateSelection } = useAwareness(provider, user);

  // Undo/Redo tracking
  const { undo, redo, canUndo, canRedo } = useHistory(elementsMap);

  // Zoom & Pan manipulation
  const { handleZoom, zoomToFit } = useViewport();

  // Modals / Dropdowns open state
  const [shareOpen, setShareOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [boardName, setBoardName] = useState('Loading Board...');
  
  // Local copy buffer for Ctrl+C/V
  const copyBuffer = useRef([]);

  // Right-click context menu coordinates
  const [menuState, setMenuState] = useState({ x: 0, y: 0, visible: false, canvasX: 0, canvasY: 0 });

  // Sync board meta name
  useEffect(() => {
    if (!metaMap) return;
    const updateName = () => {
      setBoardName(metaMap.get('boardName') || 'Untitled Board');
    };
    updateName();
    metaMap.observe(updateName);
    return () => metaMap.unobserve(updateName);
  }, [metaMap]);

  // Count active 3D elements
  const threedCount = [...elements.values()].filter((e) => e.type === 'threed').length;

  // Sync active selection changes to awareness
  useEffect(() => {
    updateSelection(selectedIds);
  }, [selectedIds, updateSelection]);

  // Sync active tool changes to awareness
  useEffect(() => {
    updateTool(tool);
  }, [tool, updateTool]);

  // 1. Export whiteboard contents to JSON
  const handleExportJSON = () => {
    const list = [...elements.values()];
    const boardData = {
      name: boardName,
      createdAt: metaMap?.get('createdAt') || Date.now(),
      elements: list,
    };
    
    const blob = new Blob([JSON.stringify(boardData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${boardName.toLowerCase().replace(/\s+/g, '-')}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Board JSON exported successfully');
  };

  // 2. Import whiteboard contents from JSON
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const boardData = JSON.parse(event.target.result);
        if (!Array.isArray(boardData.elements)) {
          throw new Error('Invalid board elements array');
        }

        // Count how many incoming 3D elements there are
        const incomingThreedCount = boardData.elements.filter((el) => el.type === 'threed').length;
        if (threedCount + incomingThreedCount > 8) {
          showToast(`Import rejected: Would exceed 8 3D element limit`);
          return;
        }

        // Batch inserting in Yjs
        ydoc.transact(() => {
          const allowedKeys = ['id', 'type', 'x', 'y', 'x2', 'y2', 'width', 'height', 'rotation', 'color', 'text', 'src', 'sceneType', 'stroke', 'strokeWidth', 'startArrow', 'endArrow', 'locked'];
          
          boardData.elements.forEach((el) => {
            if (!el.id || typeof el.id !== 'string') return;
            
            const yel = new Y.Map();
            Object.entries(el).forEach(([k, v]) => {
              // Prevent prototype pollution and only allow expected schema keys
              if (k === '__proto__' || k === 'constructor' || !allowedKeys.includes(k)) return;
              yel.set(k, v);
            });
            elementsMap.set(el.id, yel);
          });
          
          if (boardData.name && typeof boardData.name === 'string' && metaMap) {
            metaMap.set('boardName', boardData.name.substring(0, 200));
          }
        });

        showToast(`Imported ${boardData.elements.length} elements successfully`);
      } catch (err) {
        console.error(err);
        showToast('Failed to import board: invalid JSON schema');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input file
  };

  // Helper for Copy action
  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selectedList = selectedIds
      .map((id) => elements.get(id))
      .filter(Boolean);
    copyBuffer.current = selectedList;
    showToast(`Copied ${selectedList.length} elements`);
  }, [selectedIds, elements, showToast]);

  // Helper for Paste action
  const handlePaste = useCallback(() => {
    if (copyBuffer.current.length === 0) return;

    // Enforcement of the 8 3D element limit
    const incomingThreed = copyBuffer.current.filter((el) => el.type === 'threed');
    if (incomingThreed.length > 0 && threedCount + incomingThreed.length > 8) {
      showToast('Limit of 8 3D elements reached');
      return;
    }

    const pastedIds = [];
    ydoc.transact(() => {
      copyBuffer.current.forEach((el) => {
        // Offset coords by +20px from copy anchor
        const newId = crypto.randomUUID().slice(0, 12);
        const data = {
          ...el,
          id: newId,
          x: el.x + 20,
          y: el.y + 20,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        if (el.type === 'arrow') {
          data.x2 = el.x2 + 20;
          data.y2 = el.y2 + 20;
        }

        const yel = new Y.Map();
        Object.entries(data).forEach(([k, v]) => yel.set(k, v));
        elementsMap.set(newId, yel);
        pastedIds.push(newId);
      });
    });

    setSelectedIds(pastedIds);
    // Refresh copy buffer position offset so consecutive pastes keep cascade positioning
    copyBuffer.current = copyBuffer.current.map((el) => ({
      ...el,
      x: el.x + 20,
      y: el.y + 20,
      ...(el.type === 'arrow' ? { x2: el.x2 + 20, y2: el.y2 + 20 } : {}),
    }));
    
    showToast(`Pasted ${pastedIds.length} elements`);
  }, [elementsMap, ydoc, threedCount, setSelectedIds, showToast]);

  // Context Menu Actions Routing
  const handleLockToggle = useCallback(() => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    const el = elements.get(id);
    if (el) {
      updateElement(id, { locked: !el.locked });
    }
  }, [selectedIds, elements, updateElement]);

  // Triggered by Toolbar 3D or Key "3"
  const handleThreeDSelect = (options) => {
    setPickerOpen(false);
    // Switch to place 3D tool
    setTool('threed');
    // Store configured 3D element parameters temporarily
    useUIStore.getState().pendingThreeD = options;
    showToast('Click anywhere on the canvas to place your 3D element');
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore global hotkeys if editing text inputs/textareas
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      // Check key bindings
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Undo / Redo
      if (ctrl && key === 'z') {
        e.preventDefault();
        if (shift) redo();
        else undo();
        return;
      }
      if (ctrl && key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Copy / Paste / Duplicate
      if (ctrl && key === 'c') {
        e.preventDefault();
        handleCopy();
        return;
      }
      if (ctrl && key === 'v') {
        e.preventDefault();
        handlePaste();
        return;
      }
      if (ctrl && key === 'd') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          const ids = duplicateElements(selectedIds);
          if (ids.length > 0) {
            setSelectedIds(ids);
          }
        }
        return;
      }

      // Select All
      if (ctrl && key === 'a') {
        e.preventDefault();
        const allIds = [...elements.keys()];
        setSelectedIds(allIds);
        return;
      }

      // Zoom commands
      if (ctrl && e.key === '=') {
        e.preventDefault();
        handleZoom(1.1, window.innerWidth / 2, window.innerHeight / 2, { current: true });
        return;
      }
      if (ctrl && e.key === '-') {
        e.preventDefault();
        handleZoom(0.9, window.innerWidth / 2, window.innerHeight / 2, { current: true });
        return;
      }
      if (ctrl && key === '0') {
        e.preventDefault();
        zoomToFit(elements, window.innerWidth, window.innerHeight);
        return;
      }

      // Delete elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          deleteElements(selectedIds);
          setSelectedIds([]);
        }
        return;
      }

      // Layer ordering backward/forward
      if (ctrl && e.key === '[') {
        e.preventDefault();
        sendToBack(selectedIds);
        return;
      }
      if (ctrl && e.key === ']') {
        e.preventDefault();
        bringToFront(selectedIds);
        return;
      }

      // Tool selection shortcuts
      if (key === 'v') setTool('select');
      else if (key === 'h') setTool('hand');
      else if (key === 'p') setTool('pen');
      else if (key === 's') setTool('sticky');
      else if (key === 'r') setTool('rect');
      else if (key === 'e') setTool('ellipse');
      else if (key === 'a') setTool('arrow');
      else if (key === 't') setTool('text');
      else if (key === '3') {
        e.preventDefault();
        setPickerOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    elements,
    selectedIds,
    tool,
    setTool,
    setSelectedIds,
    deleteElements,
    duplicateElements,
    bringToFront,
    sendToBack,
    undo,
    redo,
    handleZoom,
    zoomToFit,
    handleCopy,
    handlePaste,
  ]);

  if (!ydoc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f15] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4" />
        <span className="text-sm font-semibold tracking-wide text-gray-400">Syncing board session...</span>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      {/* Top Header Row */}
      <div className="fixed top-4 left-4 flex items-center gap-3 z-40 bg-white border border-gray-200/80 rounded-xl shadow-lg px-4 py-2">
        <button
          onClick={() => navigate('/')}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {/* Title display */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Project Room</span>
          <span className="text-sm font-black text-gray-800 truncate max-w-[140px]">{boardName}</span>
        </div>

        <div className="w-[1px] h-5 bg-gray-200" />

        {/* Sync status */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {connected ? (
            <React.Fragment>
              <Wifi className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">Sync Live</span>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <WifiOff className="w-4 h-4 text-amber-500" />
              <span className="text-amber-600">Offline</span>
            </React.Fragment>
          )}
        </div>
      </div>

      {/* Export / Collab Buttons (Top-Mid bar) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 bg-white border border-gray-200/80 rounded-xl shadow-lg px-3 py-1.5">
        <button
          onClick={handleExportJSON}
          title="Export board as JSON"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
        >
          <Download className="w-4 h-4" /> Export
        </button>

        <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 cursor-pointer transition-all">
          <Upload className="w-4 h-4" /> Import
          <input
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </label>

        <div className="w-[1px] h-4 bg-gray-200" />

        {/* Share Whiteboard trigger */}
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-blue-500/10"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {/* Undo/Redo floating buttons */}
      <div className="fixed left-4 bottom-4 flex items-center gap-1 z-40 bg-white border border-gray-200/80 rounded-xl shadow-lg p-1.5">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 disabled:opacity-40 hover:bg-gray-100"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 disabled:opacity-40 hover:bg-gray-100"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* User collaborators bar */}
      <PresenceBar states={states} />

      {/* Properties panel for elements */}
      <PropertiesPanel
        elements={elements}
        updateElement={updateElement}
        deleteElements={deleteElements}
        bringToFront={bringToFront}
        sendToBack={sendToBack}
      />

      {/* Floating Canvas controls */}
      <Toolbar
        onThreeDClick={() => setPickerOpen(true)}
        onImageSelect={(base64) => {
          // If in image selection mode, add file to canvas coordinates
          const targetWidth = 300;
          const targetHeight = 200;
          addElement('image', {
            x: -pan.x / zoom + window.innerWidth / (2 * zoom) - targetWidth / 2,
            y: -pan.y / zoom + window.innerHeight / (2 * zoom) - targetHeight / 2,
            width: targetWidth,
            height: targetHeight,
            src: base64,
          });
        }}
      />

      {/* Whiteboard Interactive Canvas */}
      <WhiteboardCanvas
        elements={elements}
        addElement={(type, data) => {
          // Check if we are placing a customized 3D element from the picker
          if (type === 'threed' && useUIStore.getState().pendingThreeD) {
            const options = useUIStore.getState().pendingThreeD;
            useUIStore.getState().pendingThreeD = null;
            return addElement('threed', { ...data, ...options });
          }
          return addElement(type, data);
        }}
        updateElement={updateElement}
        deleteElements={deleteElements}
        states={states}
        localClientId={provider.awareness.clientID}
        updateCursor={updateCursor}
        updateSelection={updateSelection}
        onContextMenu={(x, y, canvasX, canvasY) => {
          setMenuState({ x, y, visible: true, canvasX, canvasY });
        }}
      />

      {/* Status Bar */}
      <div className="fixed bottom-4 right-4 flex items-center gap-3 bg-white border border-gray-200/80 rounded-xl shadow-lg px-3 py-1.5 z-40 text-xs text-gray-500 font-medium">
        {/* GPU 3D elements counter indicator */}
        {threedCount > 0 && (
          <span className="font-mono text-[11px] text-gray-500 font-semibold pr-2 border-r border-gray-200">
            3D active ({threedCount}/8)
          </span>
        )}

        {/* Zoom adjustment triggers */}
        <button
          onClick={() => handleZoom(0.9, window.innerWidth / 2, window.innerHeight / 2, { current: true })}
          className="hover:text-gray-800 font-bold px-1"
        >
          -
        </button>
        <span className="font-mono text-[11px] font-bold text-gray-600">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => handleZoom(1.1, window.innerWidth / 2, window.innerHeight / 2, { current: true })}
          className="hover:text-gray-800 font-bold px-1"
        >
          +
        </button>

        <div className="w-[1px] h-3 bg-gray-200" />
        <button
          onClick={() => zoomToFit(elements, window.innerWidth, window.innerHeight)}
          className="hover:text-gray-800 font-semibold"
        >
          Fit All
        </button>
      </div>

      {/* Share whiteboard modal */}
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />

      {/* 3D element picker config modal */}
      <ThreeDPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleThreeDSelect}
      />

      {/* Right Click Actions Menu */}
      <ContextMenu
        menuState={menuState}
        onClose={() => setMenuState((prev) => ({ ...prev, visible: false }))}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDuplicate={() => {
          if (selectedIds.length > 0) {
            const ids = duplicateElements(selectedIds);
            if (ids.length > 0) setSelectedIds(ids);
          }
        }}
        onLockToggle={handleLockToggle}
        onSendBackward={() => sendToBack(selectedIds)}
        onBringForward={() => bringToFront(selectedIds)}
        onDelete={() => {
          deleteElements(selectedIds);
          setSelectedIds([]);
        }}
      />

      {/* Global alert toaster */}
      <Toast />
    </div>
  );
}
