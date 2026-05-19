import React from 'react';
import { Arrow } from 'react-konva';
import StickyNote from './StickyNote.jsx';
import FreehandPath from './FreehandPath.jsx';
import ShapeElement from './ShapeElement.jsx';
import TextElement from './TextElement.jsx';
import ImageElement from './ImageElement.jsx';
import ThreeDElement from './ThreeDElement.jsx';

export default function ElementRenderer({ element, active, onUpdate, onTransform }) {
  const { id, type, x, y, x2, y2, stroke, strokeWidth, startArrow, endArrow, rotation } = element;

  switch (type) {
    case 'sticky':
      return (
        <StickyNote
          element={element}
          active={active}
          onUpdate={onUpdate}
          onTransform={onTransform}
        />
      );

    case 'path':
      return <FreehandPath element={element} active={active} />;

    case 'rect':
    case 'ellipse':
      return <ShapeElement element={element} active={active} />;

    case 'text':
      return (
        <TextElement
          element={element}
          active={active}
          onUpdate={onUpdate}
        />
      );

    case 'image':
      return <ImageElement element={element} active={active} />;

    case 'threed':
      return (
        <ThreeDElement
          element={element}
          active={active}
          onTransform={onTransform}
        />
      );

    case 'arrow':
      // Render Arrow using standard Konva Arrow component
      const dx = (x2 || 0) - x;
      const dy = (y2 || 0) - y;
      return (
        <Arrow
          id={id}
          x={x}
          y={y}
          points={[0, 0, dx, dy]}
          stroke={stroke || '#000000'}
          strokeWidth={strokeWidth || 2}
          fill={stroke || '#000000'}
          pointerLength={8}
          pointerWidth={8}
          pointerAtBeginning={startArrow}
          pointerAtEnding={endArrow}
          rotation={rotation}
          draggable={!element.locked && active}
        />
      );

    default:
      return null;
  }
}
