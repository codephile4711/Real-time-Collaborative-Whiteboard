import React, { useState, useEffect } from 'react';
import { Image as KonvaImage } from 'react-konva';

export default function ImageElement({ element, active }) {
  const { id, x, y, width, height, src, rotation } = element;
  const [imageObj, setImageObj] = useState(null);

  useEffect(() => {
    if (!src) return;
    
    // Validate src to prevent XSS (only allow http/https or data URIs)
    const isSafeUrl = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/');
    if (!isSafeUrl) {
      console.error('Unsafe image source detected:', src);
      return;
    }

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setImageObj(img);
    };
    img.onerror = (err) => {
      console.error('Failed loading image element:', err);
    };
  }, [src]);

  // Render a grey placeholder box if the image is still loading
  if (!imageObj) {
    return (
      <KonvaImage
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={rotation}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.rect(0, 0, width, height);
          context.fillStyle = '#e5e7eb';
          context.fill();
          context.strokeStyle = '#9ca3af';
          context.lineWidth = 1;
          context.stroke();
          
          context.fillStyle = '#6b7280';
          context.font = '12px sans-serif';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText('Loading Image...', width / 2, height / 2);
        }}
      />
    );
  }

  return (
    <KonvaImage
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      image={imageObj}
      rotation={rotation}
      draggable={!element.locked && active}
    />
  );
}
