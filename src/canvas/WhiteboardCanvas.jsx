import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect as KonvaRect, Line as KonvaLine } from 'react-konva';
import { useUIStore } from '../store/uiStore.js';
import ElementRenderer from './ElementRenderer.jsx';
import SelectionBox from './SelectionBox.jsx';
import CursorLayer from './CursorLayer.jsx';
import { generateId } from '../lib/ids.js';
import { snapToGrid } from '../lib/geometry.js';
import { flattenPoints } from '../lib/pathUtils.js';

export default function WhiteboardCanvas({
  elements,
  addElement,
  updateElement,
  deleteElements,
  states,
  localClientId,
  updateCursor,
  updateSelection,
  onContextMenu,
}) {
  const stageRef = useRef(null);
  const { tool, setTool, zoom, pan, setPan, selectedIds, setSelectedIds, editingId, setEditingId, showToast } = useUIStore();

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [tempShape, setTempShape] = useState(null); // Local preview during drag

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute stage coordinates from screen position
  const getStageCoords = useCallback(
    (e) => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const pointer = stage.getPointerPosition();
      if (!pointer) return { x: 0, y: 0 };
      return {
        x: (pointer.x - pan.x) / zoom,
        y: (pointer.y - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Filter elements to viewport (Virtualization)
  const getVisibleElements = useCallback(() => {
    const vx1 = -pan.x / zoom;
    const vy1 = -pan.y / zoom;
    const vx2 = (dimensions.width - pan.x) / zoom;
    const vy2 = (dimensions.height - pan.y) / zoom;

    const visible = [];
    elements.forEach((el) => {
      let xMin = el.x;
      let xMax = el.x + (el.width || 0);
      let yMin = el.y;
      let yMax = el.y + (el.height || 0);

      if (el.type === 'arrow') {
        xMin = Math.min(el.x, el.x2);
        xMax = Math.max(el.x, el.x2);
        yMin = Math.min(el.y, el.y2);
        yMax = Math.max(el.y, el.y2);
      }

      // Add a buffer of 50px around the viewport
      const buffer = 50;
      if (
        xMax >= vx1 - buffer &&
        xMin <= vx2 + buffer &&
        yMax >= vy1 - buffer &&
        yMin <= vy2 + buffer
      ) {
        visible.push(el);
      }
    });

    // Sort by zIndex
    return visible.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [elements, pan, zoom, dimensions]);

  // Stage Mouse Handlers
  const handleMouseDown = (e) => {
    if (editingId) return;

    // Right click triggers context menu
    if (e.evt.button === 2) {
      e.evt.preventDefault();
      const coords = getStageCoords(e);
      onContextMenu(e.evt.clientX, e.evt.clientY, coords.x, coords.y);
      return;
    }

    const coords = getStageCoords(e);
    const isBlank = e.target === stageRef.current;

    // Panning (hand tool or Space pressed)
    if (tool === 'hand' || e.evt.spaceKey || (e.evt.button === 0 && isBlank && tool === 'select')) {
      setIsDrawing(true);
      setDrawStart({ x: e.evt.clientX - pan.x, y: e.evt.clientY - pan.y });
      return;
    }

    // Freehand / Shape creation
    if (['pen', 'rect', 'ellipse', 'arrow'].includes(tool)) {
      setIsDrawing(true);
      setDrawStart(coords);

      if (tool === 'pen') {
        setTempShape({ type: 'path', points: [coords] });
      } else {
        setTempShape({
          type: tool,
          x: coords.x,
          y: coords.y,
          width: 0,
          height: 0,
          x2: coords.x,
          y2: coords.y,
        });
      }
      return;
    }

    // Direct Placement Tools (click-to-place)
    if (['sticky', 'text', 'threed'].includes(tool)) {
      const type = tool;
      let w = 200;
      let h = 200;
      if (type === 'sticky') {
        w = 200;
        h = 120;
      } else if (type === 'text') {
        w = 150;
        h = 40;
      }
      
      const newId = addElement(type, {
        x: coords.x - w / 2,
        y: coords.y - h / 2,
        width: w,
        height: h,
        text: type === 'sticky' ? '' : type === 'text' ? 'Double click to edit' : undefined,
      });
      
      if (newId) {
        setSelectedIds([newId]);
        if (type !== 'threed') {
          // Immediately start editing
          setTimeout(() => useUIStore.getState().setEditingId(newId), 50);
        }
      }
      setTool('select');
      return;
    }

    // Multi-select / Drag start logic
    if (tool === 'select') {
      if (isBlank) {
        setSelectedIds([]);
        updateSelection([]);
      } else {
        // Select elements by clicking
        const clickedId = e.target.id();
        if (clickedId) {
          const shiftPressed = e.evt.shiftKey;
          if (shiftPressed) {
            const current = [...selectedIds];
            if (current.includes(clickedId)) {
              const updated = current.filter((id) => id !== clickedId);
              setSelectedIds(updated);
              updateSelection(updated);
            } else {
              const updated = [...current, clickedId];
              setSelectedIds(updated);
              updateSelection(updated);
            }
          } else {
            if (!selectedIds.includes(clickedId)) {
              setSelectedIds([clickedId]);
              updateSelection([clickedId]);
            }
          }
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    const coords = getStageCoords(e);
    // Broadcast pointer location
    updateCursor({ x: coords.x, y: coords.y });

    if (!isDrawing) return;

    // Viewport panning
    if (tool === 'hand' || drawStart.x > dimensions.width || tempShape === null) {
      setPan({
        x: e.evt.clientX - drawStart.x,
        y: e.evt.clientY - drawStart.y,
      });
      return;
    }

    // Update draw preview
    if (tool === 'pen' && tempShape) {
      setTempShape((prev) => ({
        ...prev,
        points: [...prev.points, coords],
      }));
    } else if (tempShape) {
      const dx = coords.x - drawStart.x;
      const dy = coords.y - drawStart.y;

      // Handle Shift key constraints (square/circle)
      const shiftPressed = e.evt.shiftKey;
      let finalW = dx;
      let finalH = dy;
      if (shiftPressed && ['rect', 'ellipse'].includes(tool)) {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        finalW = dx < 0 ? -side : side;
        finalH = dy < 0 ? -side : side;
      }

      setTempShape((prev) => ({
        ...prev,
        width: finalW,
        height: finalH,
        x2: coords.x,
        y2: coords.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (!tempShape) return;

    if (tool === 'pen') {
      // Create path
      if (tempShape.points.length > 1) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        tempShape.points.forEach((p) => {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        });

        const w = Math.max(maxX - minX, 1);
        const h = Math.max(maxY - minY, 1);
        const relPoints = tempShape.points.map((p) => ({
          x: p.x - minX,
          y: p.y - minY,
        }));

        addElement('path', {
          x: minX,
          y: minY,
          width: w,
          height: h,
          points: relPoints,
        });
      }
    } else if (['rect', 'ellipse', 'arrow'].includes(tool)) {
      // Calculate normalized bounds
      let x = tempShape.x;
      let y = tempShape.y;
      let w = tempShape.width;
      let h = tempShape.height;

      if (tool !== 'arrow') {
        if (w < 0) {
          x += w;
          w = Math.abs(w);
        }
        if (h < 0) {
          y += h;
          h = Math.abs(h);
        }
      }

      if (Math.abs(w) > 3 || Math.abs(h) > 3) {
        addElement(tool, {
          x,
          y,
          width: w,
          height: h,
          x2: tempShape.x2,
          y2: tempShape.y2,
        });
      }
    }

    setTempShape(null);
    setTool('select');
  };

  // Image Drag & Drop / File drop handler
  const handleDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

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
      const stage = stageRef.current;
      const pointer = stage.getPointerPosition() || { x: dimensions.width / 2, y: dimensions.height / 2 };
      const canvasPos = {
        x: (pointer.x - pan.x) / zoom,
        y: (pointer.y - pan.y) / zoom,
      };

      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const targetWidth = Math.min(img.width, 400);
        const targetHeight = (img.height / img.width) * targetWidth;

        addElement('image', {
          x: canvasPos.x - targetWidth / 2,
          y: canvasPos.y - targetHeight / 2,
          width: targetWidth,
          height: targetHeight,
          src: reader.result,
          naturalWidth: img.width,
          naturalHeight: img.height,
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Drag listeners inside Konva for moving elements
  const handleNodeDragStart = (e) => {
    const node = e.target;
    const id = node.id();
    if (!id || selectedIds.includes(id)) return;
    
    // Select elements dragged directly
    setSelectedIds([id]);
    updateSelection([id]);
  };

  const handleNodeDragEnd = (e) => {
    const node = e.target;
    const id = node.id();
    if (!id) return;
    
    const el = elements.get(id);
    if (!el) return;

    if (el.type === 'ellipse') {
      const rx = el.width / 2;
      const ry = el.height / 2;
      updateElement(id, {
        x: node.x() - rx,
        y: node.y() - ry,
      });
    } else {
      updateElement(id, {
        x: node.x(),
        y: node.y(),
      });
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        // infinite grid background style
        backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        backgroundColor: '#f8fafc',
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onDragStart={handleNodeDragStart}
        onDragEnd={handleNodeDragEnd}
      >
        <Layer>
          {/* Elements inside viewport */}
          {getVisibleElements().map((el) => (
            <ElementRenderer
              key={el.id}
              element={el}
              active={selectedIds.includes(el.id)}
              onUpdate={updateElement}
            />
          ))}

          {/* Active drawing shape preview */}
          {tempShape && (
            <React.Fragment>
              {tempShape.type === 'path' && (
                <KonvaLine
                  points={flattenPoints(tempShape.points)}
                  stroke="#3b82f6"
                  strokeWidth={3}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              {tempShape.type === 'rect' && (
                <KonvaRect
                  x={tempShape.x}
                  y={tempShape.y}
                  width={tempShape.width}
                  height={tempShape.height}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dash={[4, 4]}
                />
              )}
              {/* Ellipse and Arrow rendering previews are simplified or drawn similarly */}
            </React.Fragment>
          )}

          {/* Transformer resize/rotation handles */}
          <SelectionBox
            selectedIds={selectedIds}
            stageRef={stageRef}
            onTransformEnd={(e, elId) => {
              const node = e.target;
              const el = elements.get(elId);
              if (!el) return;
              
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              node.scaleX(1);
              node.scaleY(1);

              updateElement(elId, {
                x: node.x(),
                y: node.y(),
                width: Math.max(5, node.width() * scaleX),
                height: Math.max(5, node.height() * scaleY),
                rotation: node.rotation(),
              });
            }}
          />

          {/* Collab Presence Cursor Layer */}
          <CursorLayer states={states} localClientId={localClientId} />
        </Layer>
      </Stage>

      {/* ReactDOM absolute positioned textarea overlay, avoiding custom renderer context conflicts */}
      {(() => {
        if (!editingId) return null;
        const el = elements.get(editingId);
        if (!el) return null;
        if (el.type !== 'text' && el.type !== 'sticky') return null;

        // Convert coordinates to screen space
        const screenX = pan.x + el.x * zoom;
        const screenY = pan.y + el.y * zoom;
        const screenWidth = el.width * zoom;
        const screenHeight = el.height * zoom;

        const handleTextChange = (e) => {
          updateElement(editingId, { text: e.target.value });
        };

        const handleBlur = () => {
          setEditingId(null);
        };

        const handleKeyDown = (e) => {
          if (e.key === 'Escape') {
            setEditingId(null);
          } else if (el.type === 'sticky' && e.key === 'Enter' && !e.shiftKey) {
            setEditingId(null);
          }
        };

        // Styling based on element type
        const isSticky = el.type === 'sticky';
        const style = isSticky
          ? {
              position: 'absolute',
              left: `${screenX}px`,
              top: `${screenY}px`,
              width: `${screenWidth}px`,
              height: `${screenHeight}px`,
              fontSize: `${(el.fontSize || 16) * zoom}px`,
              fontFamily: 'Inter',
              color: '#1f2937',
              backgroundColor: el.color,
              border: `2px solid #2563eb`,
              padding: `${16 * zoom}px`,
              boxSizing: 'border-box',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              borderRadius: `${4 * zoom}px`,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              transform: `rotate(${el.rotation || 0}deg)`,
              transformOrigin: 'top left',
              zIndex: 50,
            }
          : {
              position: 'absolute',
              left: `${screenX}px`,
              top: `${screenY}px`,
              width: `${screenWidth}px`,
              height: `${screenHeight}px`,
              fontSize: `${(el.fontSize || 20) * zoom}px`,
              fontFamily: el.fontFamily || 'Inter',
              fontWeight: el.bold ? 'bold' : 'normal',
              fontStyle: el.italic ? 'italic' : 'normal',
              color: el.fill || '#000000',
              textAlign: el.align || 'left',
              background: 'transparent',
              border: `1.5px dashed #2563eb`,
              padding: '0px',
              margin: '0px',
              boxSizing: 'border-box',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              transform: `rotate(${el.rotation || 0}deg)`,
              transformOrigin: 'top left',
              zIndex: 50,
            };

        return (
          <textarea
            autoFocus
            value={el.text || ''}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={style}
            ref={(textarea) => {
              if (textarea) {
                const len = textarea.value.length;
                textarea.setSelectionRange(len, len);
              }
            }}
          />
        );
      })()}
    </div>
  );
}
