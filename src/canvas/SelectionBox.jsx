import React, { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';

export default function SelectionBox({ selectedIds, stageRef, onTransformEnd }) {
  const transformerRef = useRef(null);

  useEffect(() => {
    if (!stageRef.current || !transformerRef.current) return;

    const stage = stageRef.current;
    const transformer = transformerRef.current;

    // Retrieve Konva Node elements matching the active selectedIds
    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean);

    // Filter out locked elements from transformer handles
    const transformableNodes = nodes.filter((node) => {
      const attrs = node.attrs;
      // Do not allow transforming locked items
      return !attrs.locked;
    });

    transformer.nodes(transformableNodes);
    
    const layer = transformer.getLayer();
    if (layer) {
      layer.batchDraw();
    }
  }, [selectedIds, stageRef]);

  if (selectedIds.length === 0) return null;

  return (
    <Transformer
      ref={transformerRef}
      borderStroke="#3B82F6" // Standard 2px blue selection border
      borderStrokeWidth={2}
      anchorStroke="#3B82F6"
      anchorFill="#FFFFFF"
      anchorSize={8}
      anchorCornerRadius={2}
      rotateAnchorOffset={20}
      keepRatio={true} // Maintain proportions on corner resize
      boundBoxFunc={(oldBox, newBox) => {
        // Enforce a minimum bounding box size of 5px to avoid inversion issues
        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
          return oldBox;
        }
        return newBox;
      }}
      // Propagate transform completion to write values to Yjs
      onTransformEnd={(e) => {
        if (onTransformEnd && selectedIds.length === 1) {
          onTransformEnd(e, selectedIds[0]);
        }
      }}
    />
  );
}
