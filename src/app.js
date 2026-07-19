const express = require('express');
const app = express();
app.use((req, res, next) => {
  if (req.url.startsWith('/socket.io')) {
    return;
  }
  next();
});
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const usersRoutes = require('./routes/usersRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp(io) {
  const app = express();

  // Trust proxy (needed on Render/Railway/Vercel/behind load balancers)
  app.set('trust proxy', 1);

  // Security headers — helmet ko bataya ki images ko block na kare
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  // CORS — pure frontend ko access allow kiya
  app.use(
    cors({
      origin: [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'https://pothole-frontend-97c9-psi.vercel.app'
].filter(Boolean),
      credentials: true,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // Sanitization against XSS and HTTP parameter pollution
  app.use(xss());
  app.use(hpp());

  // Global rate limiter
  const globalLimiter = rateLimit({
    windowMs: (Number(process.env.RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', globalLimiter);

  // Attach socket.io instance to requests for real-time emits
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  // Static file serving for uploaded images
  app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/notifications', notificationsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
