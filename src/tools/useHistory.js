import { useEffect, useState, useRef, useCallback } from 'react';
import * as Y from 'yjs';

export function useHistory(elementsMap) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoManagerRef = useRef(null);

  useEffect(() => {
    if (!elementsMap) return;

    // Instantiate Yjs UndoManager specifically targeting elements map edits
    const undoManager = new Y.UndoManager(elementsMap, {
      captureTimeout: 500, // Group changes made within 500ms
    });

    undoManagerRef.current = undoManager;

    const checkUndoRedo = () => {
      setCanUndo(undoManager.undoStack.length > 0);
      setCanRedo(undoManager.redoStack.length > 0);
    };

    // Update stack size details on transactions
    undoManager.on('stack-item-added', checkUndoRedo);
    undoManager.on('stack-item-popped', checkUndoRedo);

    return () => {
      undoManager.destroy();
    };
  }, [elementsMap]);

  const undo = useCallback(() => {
    if (undoManagerRef.current && undoManagerRef.current.undoStack.length > 0) {
      undoManagerRef.current.undo();
    }
  }, []);

  const redo = useCallback(() => {
    if (undoManagerRef.current && undoManagerRef.current.redoStack.length > 0) {
      undoManagerRef.current.redo();
    }
  }, []);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
