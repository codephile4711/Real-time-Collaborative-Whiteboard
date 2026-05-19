import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import boardRouter from './boardRouter.js';
import { initSyncServer } from './syncServer.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);

const port = process.env.PORT || 3001;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in dev or configure it correctly for Vite
}));

// Enable CORS for frontend HTTP API calls
app.use(cors({
  origin: clientOrigin,
  credentials: true
}));

// Body size limit to prevent payload flooding (DoS)
app.use(express.json({ limit: '1mb' }));

// API Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Routes
app.use('/api/boards', apiLimiter, boardRouter);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: Date.now() });
});

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Initialize the WebSocket server
initSyncServer(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
