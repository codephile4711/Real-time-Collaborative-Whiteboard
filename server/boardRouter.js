import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from './db.js';

const router = Router();

// POST /api/boards — create a new board, return its roomId
router.post('/', (req, res) => {
  const roomId = nanoid(10);
  let name = req.body?.name || '';
  
  if (typeof name !== 'string') {
    name = String(name);
  }
  
  // Basic sanitization
  name = name.trim().replace(/<[^>]*>?/gm, '').substring(0, 200);
  if (!name) name = 'Untitled Board';

  const now = Date.now();
  db.prepare(
    `INSERT INTO boards (room_id, name, ydoc_state, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?)`
  ).run(roomId, name, now, now);
  res.json({ roomId, name });
});

// GET /api/boards/:roomId — check a board exists
router.get('/:roomId', (req, res) => {
  const row = db
    .prepare(`SELECT room_id, name, created_at, updated_at FROM boards WHERE room_id = ?`)
    .get(req.params.roomId);
  if (!row) return res.status(404).json({ error: 'Board not found' });
  res.json({ roomId: row.room_id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at });
});

export default router;
