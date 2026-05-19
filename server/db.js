import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || './data/boards.db';
const resolvedPath = path.resolve(__dirname, '..', dbPath);

// Ensure the data directory exists
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create boards table: stores room metadata + the binary Yjs state
db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    room_id   TEXT PRIMARY KEY,
    name      TEXT NOT NULL DEFAULT 'Untitled Board',
    ydoc_state BLOB,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

export default db;
