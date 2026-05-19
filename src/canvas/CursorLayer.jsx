import React from 'react';
import { Group, Path, Rect, Text } from 'react-konva';

export default function CursorLayer({ states, localClientId }) {
  const cursors = [];

  states.forEach((state, clientID) => {
    // Skip rendering local user's own cursor
    if (clientID === localClientId) return;
    if (!state.cursor || !state.user) return;

    const { x, y } = state.cursor;
    const { name, color } = state.user;

    cursors.push(
      <Group key={clientID} x={x} y={y}>
        {/* Pointer arrow icon path */}
        <Path
          data="M0,0 L0,15 L4,11 L8,18 L10,17 L6,10 L11,10 Z"
          fill={color || '#3B82F6'}
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />
        {/* Name tag background */}
        <Rect
          x={12}
          y={12}
          width={name.length * 7 + 16}
          height={20}
          fill={color || '#3B82F6'}
          cornerRadius={4}
          shadowColor="#000000"
          shadowBlur={2}
          shadowOpacity={0.1}
        />
        {/* Name text label */}
        <Text
          x={20}
          y={16}
          text={name}
          fontSize={10}
          fontFamily="Inter"
          fill="#FFFFFF"
          fontStyle="bold"
        />
      </Group>
    );
  });

  return <React.Fragment>{cursors}</React.Fragment>;
}
