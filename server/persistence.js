import * as Y from 'yjs';
import db from './db.js';

// Debounce timers per room — avoid thrashing SQLite on every keystroke
const timers = new Map();
const DEBOUNCE_MS = 2000;

/**
 * Persist a Yjs document to SQLite after a debounce delay.
 * Called by the y-websocket server on every document update.
 */
export function persistDoc(roomId, ydoc) {
  if (timers.has(roomId)) clearTimeout(timers.get(roomId));
  timers.set(
    roomId,
    setTimeout(() => {
      const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
      db.prepare(
        `UPDATE boards SET ydoc_state = ?, updated_at = ? WHERE room_id = ?`
      ).run(state, Date.now(), roomId);
      timers.delete(roomId);
    }, DEBOUNCE_MS)
  );
}

/**
 * Load a persisted Yjs state into a new Y.Doc.
 * Returns null if the room doesn't exist or has no saved state.
 */
export function loadDoc(roomId) {
  const row = db.prepare(`SELECT name, ydoc_state FROM boards WHERE room_id = ?`).get(roomId);
  if (!row) return null;

  const ydoc = new Y.Doc();
  if (row.ydoc_state) {
    Y.applyUpdate(ydoc, new Uint8Array(row.ydoc_state));
  } else {
    // First time loading: initialize meta from db fields
    const meta = ydoc.getMap('meta');
    meta.set('boardName', row.name || 'Untitled Board');
    meta.set('createdAt', Date.now());
  }
  return ydoc;
}
