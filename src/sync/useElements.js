import { useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { createDefaultElement } from './elementSchema.js';
import { generateId } from '../lib/ids.js';

export function useElements(elementsMap, ydoc, showToast) {
  const [elements, setElements] = useState(new Map());

  // Update local React state whenever the Yjs elements map changes
  const syncElements = useCallback(() => {
    if (!elementsMap) return;
    const newMap = new Map();
    elementsMap.forEach((val, key) => {
      if (val instanceof Y.Map) {
        newMap.set(key, val.toJSON());
      }
    });
    setElements(newMap);
  }, [elementsMap]);

  useEffect(() => {
    if (!elementsMap) return;

    syncElements();

    // Listen for mutations in the shared Yjs map
    elementsMap.observe(syncElements);
    return () => {
      elementsMap.unobserve(syncElements);
    };
  }, [elementsMap, syncElements]);

  // Helper to count active 3D elements
  const getThreeDElementCount = useCallback(() => {
    let count = 0;
    if (!elementsMap) return 0;
    elementsMap.forEach((val) => {
      if (val instanceof Y.Map && val.get('type') === 'threed') {
        count++;
      }
    });
    return count;
  }, [elementsMap]);

  // 1. Add Element
  const addElement = useCallback(
    (type, data = {}) => {
      if (!elementsMap || !ydoc) return null;

      // Enforcement of the 8 3D element limit
      if (type === 'threed') {
        const count = getThreeDElementCount();
        if (count >= 8) {
          if (showToast) showToast('Limit of 8 3D elements reached');
          return null;
        }
      }

      const id = data.id || generateId();
      const defaultEl = createDefaultElement(type, { ...data, id });

      ydoc.transact(() => {
        const yel = new Y.Map();
        Object.entries(defaultEl).forEach(([k, v]) => {
          yel.set(k, v);
        });
        elementsMap.set(id, yel);
      });

      return id;
    },
    [elementsMap, ydoc, getThreeDElementCount, showToast]
  );

  // 2. Update Element (Shallow patch)
  const updateElement = useCallback(
    (id, patch) => {
      if (!elementsMap || !ydoc) return;
      const yel = elementsMap.get(id);
      if (!yel || !(yel instanceof Y.Map)) return;

      ydoc.transact(() => {
        Object.entries(patch).forEach(([k, v]) => {
          yel.set(k, v);
        });
        yel.set('updatedAt', Date.now());
      });
    },
    [elementsMap, ydoc]
  );

  // 3. Delete Elements
  const deleteElements = useCallback(
    (ids) => {
      if (!elementsMap || !ydoc || !ids.length) return;
      ydoc.transact(() => {
        ids.forEach((id) => {
          elementsMap.delete(id);
        });
      });
    },
    [elementsMap, ydoc]
  );

  // 4. Duplicate Elements (Offset by +20px)
  const duplicateElements = useCallback(
    (ids) => {
      if (!elementsMap || !ydoc || !ids.length) return [];
      const newIds = [];

      // Check how many new 3D elements we are trying to add
      const threedToDuplicate = ids.filter((id) => {
        const el = elementsMap.get(id);
        return el && el.get('type') === 'threed';
      });

      if (threedToDuplicate.length > 0) {
        const count = getThreeDElementCount();
        if (count + threedToDuplicate.length > 8) {
          if (showToast) showToast('Limit of 8 3D elements reached');
          return [];
        }
      }

      ydoc.transact(() => {
        ids.forEach((id) => {
          const original = elementsMap.get(id);
          if (!original) return;

          const data = original.toJSON();
          const newId = generateId();
          const duplicatedData = {
            ...data,
            id: newId,
            x: data.x + 20,
            y: data.y + 20,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          // Offset endpoints for arrow
          if (data.type === 'arrow') {
            duplicatedData.x2 = data.x2 + 20;
            duplicatedData.y2 = data.y2 + 20;
          }

          const yel = new Y.Map();
          Object.entries(duplicatedData).forEach(([k, v]) => {
            yel.set(k, v);
          });
          elementsMap.set(newId, yel);
          newIds.push(newId);
        });
      });

      return newIds;
    },
    [elementsMap, ydoc, getThreeDElementCount, showToast]
  );

  // Helper to reorder layers (bring forward, send backward, etc.)
  const getSortedElements = useCallback(() => {
    return [...elements.values()].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [elements]);

  // Adjust zIndex ordering for select elements
  const bringToFront = useCallback(
    (ids) => {
      if (!elementsMap || !ydoc || !ids.length) return;
      const sorted = getSortedElements();
      if (!sorted.length) return;
      
      const maxZ = sorted[sorted.length - 1].zIndex || 0;
      
      ydoc.transact(() => {
        ids.forEach((id, index) => {
          const yel = elementsMap.get(id);
          if (yel) {
            yel.set('zIndex', maxZ + 1 + index);
          }
        });
      });
    },
    [elementsMap, ydoc, getSortedElements]
  );

  const sendToBack = useCallback(
    (ids) => {
      if (!elementsMap || !ydoc || !ids.length) return;
      const sorted = getSortedElements();
      if (!sorted.length) return;
      
      const minZ = sorted[0].zIndex || 0;

      ydoc.transact(() => {
        ids.forEach((id, index) => {
          const yel = elementsMap.get(id);
          if (yel) {
            yel.set('zIndex', minZ - ids.length + index);
          }
        });
      });
    },
    [elementsMap, ydoc, getSortedElements]
  );

  return {
    elements,
    addElement,
    updateElement,
    deleteElements,
    duplicateElements,
    bringToFront,
    sendToBack,
    getSortedElements,
  };
}
