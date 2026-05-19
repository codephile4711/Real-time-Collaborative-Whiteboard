import { useCallback } from 'react';
import { useUIStore } from '../store/uiStore.js';

export function useViewport() {
  const { zoom, pan, setZoom, setPan } = useUIStore();

  const handleZoom = useCallback(
    (factor, centerX, centerY, stage) => {
      if (!stage) return;
      
      const oldZoom = zoom;
      const newZoom = Math.max(0.05, Math.min(4.0, oldZoom * factor));
      
      // Keep centering point constant when zooming
      const mousePointTo = {
        x: (centerX - pan.x) / oldZoom,
        y: (centerY - pan.y) / oldZoom,
      };

      const newPan = {
        x: centerX - mousePointTo.x * newZoom,
        y: centerY - mousePointTo.y * newZoom,
      };

      setZoom(newZoom);
      setPan(newPan);
    },
    [zoom, pan, setZoom, setPan]
  );

  const zoomToFit = useCallback(
    (elements, stageWidth, stageHeight) => {
      if (!elements || elements.size === 0) {
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
        return;
      }

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      elements.forEach((el) => {
        // Expand bounding box calculations for each element
        const x2 = el.type === 'arrow' ? el.x2 : el.x + el.width;
        const y2 = el.type === 'arrow' ? el.y2 : el.y + el.height;

        minX = Math.min(minX, el.x, x2);
        maxX = Math.max(maxX, el.x, x2);
        minY = Math.min(minY, el.y, y2);
        maxY = Math.max(maxY, el.y, y2);
      });

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      const padding = 100;
      const zoomX = (stageWidth - padding) / contentWidth;
      const zoomY = (stageHeight - padding) / contentHeight;
      const newZoom = Math.max(0.05, Math.min(1.5, Math.min(zoomX, zoomY)));

      const centerX = stageWidth / 2;
      const centerY = stageHeight / 2;
      const contentCenterX = minX + contentWidth / 2;
      const contentCenterY = minY + contentHeight / 2;

      setZoom(newZoom);
      setPan({
        x: centerX - contentCenterX * newZoom,
        y: centerY - contentCenterY * newZoom,
      });
    },
    [setZoom, setPan]
  );

  return {
    zoom,
    pan,
    setZoom,
    setPan,
    handleZoom,
    zoomToFit,
  };
}
