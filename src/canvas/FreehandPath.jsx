import React from 'react';
import { Line } from 'react-konva';
import { flattenPoints } from '../lib/pathUtils.js';

export default function FreehandPath({ element, active }) {
  const { id, x, y, points, stroke, strokeWidth, opacity, rotation } = element;

  // Flatten the coordinate points array [{x, y}] -> [x1, y1, x2, y2...]
  const flatPoints = flattenPoints(points || []);

  return (
    <Line
      id={id}
      x={x}
      y={y}
      points={flatPoints}
      stroke={stroke || '#000000'}
      strokeWidth={strokeWidth || 3}
      opacity={opacity !== undefined ? opacity : 1}
      rotation={rotation}
      tension={0.5} // Smooth curves
      lineCap="round"
      lineJoin="round"
      draggable={!element.locked && active}
    />
  );
}
