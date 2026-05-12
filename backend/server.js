const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

connectDB();

const io = initSocket(server);
app.set('io', io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || true
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  db: connectDB.isReady() ? 'connected' : 'disconnected',
  dbError: connectDB.lastError(),
}));

app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (!connectDB.isReady()) {
    return res.status(503).json({
      message: 'Database is unavailable. Please try again in a moment.',
    });
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));

// Serve the built SPA in production (after all /api routes, before the error handler)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  // SPA fallback: any non-/api GET request returns index.html.
  // Use middleware (not app.get('*')) — Express 5 / path-to-regexp v8
  // no longer accepts a bare '*' route pattern.
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} (HTTP + WebSocket)`));
