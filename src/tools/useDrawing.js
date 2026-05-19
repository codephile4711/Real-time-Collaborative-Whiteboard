import { useState, useCallback } from 'react';
import { compressPath } from '../lib/pathUtils.js';

export function useDrawing(addElement, user) {
  // Store points of the currently drawing path locally before saving to Yjs
  const [currentPath, setCurrentPath] = useState(null);

  const startDrawing = useCallback((x, y, options = {}) => {
    setCurrentPath({
      points: [{ x, y }],
      stroke: options.stroke || '#000000',
      strokeWidth: options.strokeWidth || 3,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
    });
  }, []);

  const updateDrawing = useCallback((x, y) => {
    setCurrentPath((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, { x, y }],
      };
    });
  }, []);

  const finishDrawing = useCallback(() => {
    if (!currentPath || currentPath.points.length < 2) {
      setCurrentPath(null);
      return;
    }

    // Compress the path using simplify-js RDP algorithm
    const simplifiedPoints = compressPath(currentPath.points, 1.2);
    
    // Calculate bounding box of the drawing
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    simplifiedPoints.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    // Make path relative to its own bounding box (makes drag-to-move/resize cleaner)
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const relativePoints = simplifiedPoints.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
    }));

    // Add path to collective elements store
    addElement('path', {
      x: minX,
      y: minY,
      width,
      height,
      points: relativePoints,
      stroke: currentPath.stroke,
      strokeWidth: currentPath.strokeWidth,
      opacity: currentPath.opacity,
      createdBy: user.id,
    });

    setCurrentPath(null);
  }, [currentPath, addElement, user]);

  return {
    currentPath,
    startDrawing,
    updateDrawing,
    finishDrawing,
  };
}
