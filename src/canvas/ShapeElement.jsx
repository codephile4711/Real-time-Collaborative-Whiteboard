import React from 'react';
import { Rect, Ellipse } from 'react-konva';

export default function ShapeElement({ element, active }) {
  const { id, type, x, y, width, height, fill, stroke, strokeWidth, cornerRadius, rotation } = element;

  if (type === 'rect') {
    return (
      <Rect
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={cornerRadius || 0}
        rotation={rotation}
        draggable={!element.locked && active}
      />
    );
  }

  if (type === 'ellipse') {
    // Ellipse geometry centers in Konva
    const rx = width / 2;
    const ry = height / 2;
    return (
      <Ellipse
        id={id}
        x={x + rx}
        y={y + ry}
        radiusX={Math.max(1, rx)}
        radiusY={Math.max(1, ry)}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rotation={rotation}
        draggable={!element.locked && active}
        // Offset center of drag so coordinates remain consistent
        dragBoundFunc={(pos) => {
          // Adjust for center displacement during drag if needed,
          // but since Konva handles group/shape movements, standard drag is fine
          return pos;
        }}
      />
    );
  }

  return null;
}
