import { useEffect, useState, useCallback } from 'react';

export function useAwareness(provider, localUser) {
  const [states, setStates] = useState(new Map());

  // Listen to remote changes on other clients' awareness
  const handleAwarenessChange = useCallback(() => {
    if (!provider) return;
    const newStates = new Map();
    provider.awareness.getStates().forEach((state, clientID) => {
      // Map other users' active awareness states
      newStates.set(clientID, state);
    });
    setStates(newStates);
  }, [provider]);

  useEffect(() => {
    if (!provider || !localUser) return;

    // Set initial awareness state for this client
    provider.awareness.setLocalState({
      user: localUser,
      cursor: null,
      tool: 'select',
      selectedIds: [],
    });

    // Handle updates
    provider.awareness.on('change', handleAwarenessChange);
    handleAwarenessChange();

    return () => {
      provider.awareness.off('change', handleAwarenessChange);
    };
  }, [provider, localUser, handleAwarenessChange]);

  // Update cursor position in awareness
  const updateCursor = useCallback(
    (cursor) => {
      if (!provider) return;
      const localState = provider.awareness.getLocalState();
      if (!localState) return;
      provider.awareness.setLocalStateField('cursor', cursor);
    },
    [provider]
  );

  // Update active tool in awareness
  const updateTool = useCallback(
    (tool) => {
      if (!provider) return;
      const localState = provider.awareness.getLocalState();
      if (!localState) return;
      provider.awareness.setLocalStateField('tool', tool);
    },
    [provider]
  );

  // Update selected element IDs in awareness
  const updateSelection = useCallback(
    (selectedIds) => {
      if (!provider) return;
      const localState = provider.awareness.getLocalState();
      if (!localState) return;
      provider.awareness.setLocalStateField('selectedIds', selectedIds);
    },
    [provider]
  );

  return {
    states,
    updateCursor,
    updateTool,
    updateSelection,
  };
}
