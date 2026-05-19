import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function useYjs(roomId) {
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [connected, setConnected] = useState(false);
  const [elementsMap, setElementsMap] = useState(null);
  const [metaMap, setMetaMap] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    // Create a new Yjs Document instance
    const doc = new Y.Doc();

    // Determine target WebSocket protocol & hostname
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Vite proxy handles /ws on local dev, but in production we can point directly to hostname
    const isLocal = window.location.hostname === 'localhost';
    const wsHost = isLocal ? 'localhost:3001' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws`;

    console.log(`Connecting to Yjs WebSocket at: ${wsUrl}/${roomId}`);
    const wsProvider = new WebsocketProvider(wsUrl, roomId, doc);

    const onStatus = (event) => {
      setConnected(event.status === 'connected');
    };

    wsProvider.on('status', onStatus);

    // Grab references to the top-level Yjs shared data structures
    const elements = doc.getMap('elements');
    const meta = doc.getMap('meta');

    setYdoc(doc);
    setProvider(wsProvider);
    setElementsMap(elements);
    setMetaMap(meta);

    // Cleanup connection when room is changed or component unmounts
    return () => {
      wsProvider.off('status', onStatus);
      wsProvider.disconnect();
      doc.destroy();
    };
  }, [roomId]);

  return {
    ydoc,
    provider,
    connected,
    elementsMap,
    metaMap,
  };
}
