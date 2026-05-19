import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';
import { loadDoc, persistDoc } from './persistence.js';

// Room storage: docName -> { doc, awareness, clients }
const rooms = new Map();

export function initSyncServer(server) {
  const wss = new WebSocketServer({ 
    noServer: true,
    maxPayload: 1 * 1024 * 1024 // 1MB limit to prevent memory exhaustion
  });

  // Intercept WebSocket upgrade requests on pathname /ws/:boardId
  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[WS Upgrade] Pathname: ${url.pathname}`);
      }
      
      if (url.pathname.startsWith('/ws/')) {
        const origin = request.headers.origin;
        const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
        
        // Origin validation to prevent Cross-Site WebSocket Hijacking (CSWSH)
        if (process.env.NODE_ENV === 'production' && origin && origin !== allowedOrigin) {
          console.warn(`[WS Upgrade] Rejected origin: ${origin}`);
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          socket.destroy();
          return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        console.log(`[WS Upgrade] Rejecting non-ws upgrade: ${url.pathname}`);
        socket.destroy();
      }
    } catch (e) {
      console.error('[WS Upgrade Error]', e);
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request) => {
    // Extract room/board ID from URL, e.g., /ws/boardId
    const url = request.url || '';
    const parts = url.split('/');
    const rawDocName = parts[parts.length - 1] || 'default';
    
    // Sanitize docName (alphanumeric and dashes/underscores, max 64)
    const docName = rawDocName.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 64) || 'default';
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[WS Connect] Room: ${docName}`);
    }

    // Get or create room
    let room = rooms.get(docName);
    if (!room) {
      console.log(`[WS Server] Creating room "${docName}"`);
      const doc = new Y.Doc();
      const awareness = new awarenessProtocol.Awareness(doc);

      // Load initial state from SQLite
      try {
        const persistedDoc = loadDoc(docName);
        if (persistedDoc) {
          Y.applyUpdate(doc, Y.encodeStateAsUpdate(persistedDoc));
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[WS Server] Loaded room state for "${docName}"`);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`[WS Server] Failed loading room state for "${docName}":`, err);
        } else {
          console.error(`[WS Server] Failed loading room state for "${docName}"`);
        }
      }

      // Sync doc updates to database and other collaborators
      doc.on('update', (update, origin) => {
        // Persist state in SQLite (debounced)
        persistDoc(docName, doc);

        // Broadcast sync step 2 / update payload to all active connections
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 0); // messageSync
        syncProtocol.writeUpdate(encoder, update);
        const message = encoding.toUint8Array(encoder);

        room.clients.forEach((client) => {
          if (client !== origin && client.readyState === 1) { // OPEN
            try {
              client.send(message);
            } catch (err) {
              console.error('[WS Broadcast Update Error]', err);
            }
          }
        });
      });

      // Broadcast user awareness updates (cursors, presence)
      awareness.on('update', ({ added, updated, removed }, origin) => {
        const changedClients = added.concat(updated).concat(removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 1); // messageAwareness
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
        );
        const message = encoding.toUint8Array(encoder);

        room.clients.forEach((client) => {
          if (client.readyState === 1) {
            try {
              client.send(message);
            } catch (err) {
              console.error('[WS Broadcast Awareness Error]', err);
            }
          }
        });
      });

      room = { doc, awareness, clients: new Set() };
      rooms.set(docName, room);
    }

    // Add socket connection to room
    room.clients.add(ws);

    // Step 1: Send Sync Step 1 to new collaborator
    try {
      const syncEncoder = encoding.createEncoder();
      encoding.writeVarUint(syncEncoder, 0); // messageSync
      syncProtocol.writeSyncStep1(syncEncoder, room.doc);
      ws.send(encoding.toUint8Array(syncEncoder));
    } catch (err) {
      console.error('[WS Send Sync Step 1 Error]', err);
    }

    // Step 2: Send current awareness presence to new collaborator
    try {
      const awarenessStates = room.awareness.getStates();
      if (awarenessStates.size > 0) {
        const awarenessEncoder = encoding.createEncoder();
        encoding.writeVarUint(awarenessEncoder, 1); // messageAwareness
        encoding.writeVarUint8Array(
          awarenessEncoder,
          awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(awarenessStates.keys()))
        );
        ws.send(encoding.toUint8Array(awarenessEncoder));
      }
    } catch (err) {
      console.error('[WS Send Awareness Error]', err);
    }

    // Process incoming client updates
    ws.on('message', (message) => {
      try {
        const decoder = decoding.createDecoder(new Uint8Array(message));
        const messageType = decoding.readVarUint(decoder);

        if (messageType === 0) { // messageSync
          const replyEncoder = encoding.createEncoder();
          encoding.writeVarUint(replyEncoder, 0); // messageSync
          syncProtocol.readSyncMessage(decoder, replyEncoder, room.doc, ws);
          if (encoding.length(replyEncoder) > 1) {
            ws.send(encoding.toUint8Array(replyEncoder));
          }
        } else if (messageType === 1) { // messageAwareness
          const update = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(room.awareness, update, ws);
        }
      } catch (err) {
        console.error('[WS Message Handle Error]', err);
      }
    });

    // Cleanup connection on disconnect
    ws.on('close', () => {
      console.log(`[WS Disconnect] Room: ${docName}`);
      room.clients.delete(ws);
      if (room.clients.size === 0) {
        console.log(`[WS Server] Closing empty room "${docName}"`);
        rooms.delete(docName);
      }
    });

    ws.on('error', (err) => {
      console.error('[WS Socket Connection Error]', err);
    });
  });

  return wss;
}
