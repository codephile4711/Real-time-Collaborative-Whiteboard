import React, { useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Text as KonvaText } from 'react-konva';
import { ThreeRenderer } from '../three/ThreeRenderer.js';

export default function ThreeDElement({ element, active }) {
  const { id, x, y, width, height, rotation, scene, primaryColor, secondaryColor, autoRotate, rotationSpeed, wireframe, opacity, label } = element;
  
  const imageRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // 1. Initialize and Manage ThreeRenderer Lifecycle
  useEffect(() => {
    let renderer;
    try {
      renderer = new ThreeRenderer({
        width,
        height,
        sceneKey: scene,
        options: { primaryColor, secondaryColor, autoRotate, rotationSpeed, wireframe, opacity },
      });
      rendererRef.current = renderer;
      setWebGlSupported(true);
      setInitializing(false);
    } catch (err) {
      console.error('[3D Render Init Error]', err);
      setWebGlSupported(false);
      setInitializing(false);
      return;
    }

    return () => {
      if (renderer) {
        renderer.dispose();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [id, scene]);

  // 2. React to hot-reload option changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateOptions({
        primaryColor,
        secondaryColor,
        autoRotate,
        rotationSpeed,
        wireframe,
        opacity,
      });
    }
  }, [primaryColor, secondaryColor, autoRotate, rotationSpeed, wireframe, opacity]);

  // 3. React to Resizing
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(width, height);
    }
  }, [width, height]);

  // 4. RequestAnimationFrame (rAF) Render Loop
  useEffect(() => {
    if (!webGlSupported || initializing) return;

    let lastTime = performance.now();

    const tick = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (rendererRef.current && imageRef.current) {
        rendererRef.current.tick(delta);
        
        // Push the offscreen ThreeJS canvas to Konva.Image
        const canvas = rendererRef.current.getCanvas();
        imageRef.current.image(canvas);

        // Request Konva layer redraw
        const layer = imageRef.current.getLayer();
        if (layer) {
          layer.batchDraw();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [webGlSupported, initializing]);

  if (!webGlSupported) {
    return (
      <Group id={id} x={x} y={y} rotation={rotation} draggable={!element.locked && active}>
        <KonvaImage
          width={width}
          height={height}
          sceneFunc={(context) => {
            context.beginPath();
            context.rect(0, 0, width, height);
            context.fillStyle = '#fee2e2';
            context.fill();
            context.strokeStyle = '#ef4444';
            context.lineWidth = 2;
            context.stroke();
            
            context.fillStyle = '#b91c1c';
            context.font = '12px sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('3D WebGL failed', width / 2, height / 2);
          }}
        />
        {label && (
          <KonvaText
            text={label}
            x={0}
            y={height + 6}
            width={width}
            align="center"
            fontSize={11}
            fill="#374151"
            fontStyle="bold"
          />
        )}
      </Group>
    );
  }

  return (
    <Group id={id} x={x} y={y} rotation={rotation} draggable={!element.locked && active}>
      <KonvaImage
        ref={imageRef}
        x={0}
        y={0}
        width={width}
        height={height}
        clipFunc={(ctx) => {
          ctx.beginPath();
          const r = 8;
          ctx.roundRect(0, 0, width, height, r);
          ctx.closePath();
        }}
        sceneFunc={
          initializing
            ? (context) => {
                context.beginPath();
                context.rect(0, 0, width, height);
                context.fillStyle = '#f3f4f6';
                context.fill();
                context.strokeStyle = '#d1d5db';
                context.lineWidth = 1;
                context.stroke();
              }
            : undefined
        }
      />
      {label && !initializing && (
        <KonvaText
          text={label}
          x={0}
          y={height + 8}
          width={width}
          align="center"
          fontSize={11}
          fill="#374151"
          fontStyle="bold"
        />
      )}
    </Group>
  );
}
