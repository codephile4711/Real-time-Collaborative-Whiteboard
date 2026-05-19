import { useCallback, useRef } from 'react';
import { useUIStore } from '../store/uiStore.js';
import { snapToElementEdges } from '../lib/geometry.js';

export function useSelection(elements, updateElement) {
  const { selectedIds, setSelectedIds, setEditingId } = useUIStore();
  const dragStartPositions = useRef(new Map());

  // Check if click hit empty space or an element
  const handleStageMouseDown = useCallback(
    (e) => {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedIds([]);
        setEditingId(null);
      }
    },
    [setSelectedIds, setEditingId]
  );

  // Set up dragging anchor positions on drag start
  const handleDragStart = useCallback(
    (e, elId) => {
      if (!selectedIds.includes(elId)) {
        // If we drag an unselected element, select it first
        setSelectedIds([elId]);
      }

      const activeIds = selectedIds.includes(elId) ? selectedIds : [elId];
      dragStartPositions.current.clear();
      
      activeIds.forEach((id) => {
        const el = elements.get(id);
        if (el && !el.locked) {
          dragStartPositions.current.set(id, { x: el.x, y: el.y, x2: el.x2, y2: el.y2 });
        }
      });
    },
    [selectedIds, elements, setSelectedIds]
  );

  // Update positions for all selected elements on drag
  const handleDragMove = useCallback(
    (e, elId) => {
      const activeIds = selectedIds.includes(elId) ? selectedIds : [elId];
      if (dragStartPositions.current.size === 0) return;

      const targetNode = e.target;
      const originalPos = dragStartPositions.current.get(elId);
      if (!originalPos) return;

      // Calculate translation offset
      const dx = targetNode.x() - originalPos.x;
      const dy = targetNode.y() - originalPos.y;

      activeIds.forEach((id) => {
        if (id === elId) return; // Main element is dragged by Konva automatically
        const start = dragStartPositions.current.get(id);
        const el = elements.get(id);
        if (start && el && !el.locked) {
          updateElement(id, {
            x: start.x + dx,
            y: start.y + dy,
            ...(el.type === 'arrow' ? { x2: start.x2 + dx, y2: start.y2 + dy } : {}),
          });
        }
      });
    },
    [selectedIds, elements, updateElement]
  );

  // Save final positions to Yjs
  const handleDragEnd = useCallback(
    (e, elId) => {
      const activeIds = selectedIds.includes(elId) ? selectedIds : [elId];
      const targetNode = e.target;
      const originalPos = dragStartPositions.current.get(elId);

      if (!originalPos) return;

      const dx = targetNode.x() - originalPos.x;
      const dy = targetNode.y() - originalPos.y;

      // Save main element position first
      const el = elements.get(elId);
      if (el && !el.locked) {
        let updates = {
          x: targetNode.x(),
          y: targetNode.y(),
        };

        if (el.type === 'arrow') {
          // Snap arrow endpoint to element boundaries if close
          const baseSnapped = snapToElementEdges(targetNode.x(), targetNode.y(), elements, elId);
          const headSnapped = snapToElementEdges(originalPos.x2 + dx, originalPos.y2 + dy, elements, elId);
          updates = {
            x: baseSnapped.x,
            y: baseSnapped.y,
            x2: headSnapped.x,
            y2: headSnapped.y,
          };
        }

        updateElement(elId, updates);
      }

      // Save other dragged elements
      activeIds.forEach((id) => {
        if (id === elId) return;
        const start = dragStartPositions.current.get(id);
        const otherEl = elements.get(id);
        if (start && otherEl && !otherEl.locked) {
          let updates = {
            x: start.x + dx,
            y: start.y + dy,
          };
          if (otherEl.type === 'arrow') {
            updates.x2 = start.x2 + dx;
            updates.y2 = start.y2 + dy;
          }
          updateElement(id, updates);
        }
      });

      dragStartPositions.current.clear();
    },
    [selectedIds, elements, updateElement]
  );

  // Process resize/rotation transforms
  const handleTransformEnd = useCallback(
    (e, elId) => {
      const node = e.target;
      const el = elements.get(elId);
      if (!el) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale factors on the Konva node back to 1 to avoid shape distortion
      node.scaleX(1);
      node.scaleY(1);

      const width = Math.max(5, node.width() * scaleX);
      const height = Math.max(5, node.height() * scaleY);
      const rotation = node.rotation();

      updateElement(elId, {
        x: node.x(),
        y: node.y(),
        width,
        height,
        rotation,
      });
    },
    [elements, updateElement]
  );

  return {
    handleStageMouseDown,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleTransformEnd,
  };
}
