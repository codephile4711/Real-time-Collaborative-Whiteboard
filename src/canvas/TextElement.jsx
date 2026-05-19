import React from 'react';
import { Text } from 'react-konva';
import { useUIStore } from '../store/uiStore.js';

export default function TextElement({ element, active }) {
  const { id, x, y, width, height, rotation, text, fontSize, fontFamily, fill, align, bold, italic } = element;
  const { editingId, setEditingId } = useUIStore();

  const isEditing = editingId === id;

  const handleDoubleClick = () => {
    if (element.locked) return;
    setEditingId(id);
  };

  const fontStyle = `${bold ? 'bold' : ''} ${italic ? 'italic' : ''}`.trim() || 'normal';

  return (
    <Text
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      text={isEditing ? '' : text}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fill={fill}
      align={align}
      fontStyle={fontStyle}
      rotation={rotation}
      draggable={!element.locked && active && !isEditing}
      onDblClick={handleDoubleClick}
      wrap="char"
    />
  );
}
