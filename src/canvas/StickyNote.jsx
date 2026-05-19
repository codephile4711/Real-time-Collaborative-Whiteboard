import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { useUIStore } from '../store/uiStore.js';

export default function StickyNote({ element, active }) {
  const { id, x, y, width, height, rotation, text, color, fontSize } = element;
  const { editingId, setEditingId } = useUIStore();

  const isEditing = editingId === id;

  const handleDoubleClick = () => {
    if (element.locked) return;
    setEditingId(id);
  };

  return (
    <Group
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      draggable={!element.locked && active && !isEditing}
      onDblClick={handleDoubleClick}
    >
      {/* Sticky Note Rect */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={color}
        shadowColor="#000000"
        shadowBlur={6}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.15}
        stroke={active ? '#2563eb' : '#d1d5db'}
        strokeWidth={active ? 1.5 : 0.5}
        cornerRadius={4}
      />

      {/* Sticky Note Content Text */}
      {!isEditing && (
        <Text
          text={text || 'Double click to edit'}
          width={width}
          height={height}
          padding={16}
          fontSize={fontSize}
          fontFamily="Inter"
          fill="#1f2937"
          align="center"
          verticalAlign="middle"
          wrap="char"
          ellipsis={true}
        />
      )}
    </Group>
  );
}
