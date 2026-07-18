// ============================================
// Drishti Kavach — Main Server
// दृष्टि कवच — The Vision Shield
// ============================================

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const { Server } = require('socket.io');

const { initSocketIO } = require('./websocket/socket');
const { startCronJobs } = require('./cron/jobs');

// Routes
const authRoutes = require('./routes/auth');
const logRoutes = require('./routes/log');
const dashboardRoutes = require('./routes/dashboard');
const ipRoutes = require('./routes/ip');
const securityRoutes = require('./routes/security');
const formRoutes = require('./routes/forms');
const incidentRoutes = require('./routes/incidents');
const aiRoutes = require('./routes/ai');
const ddosRoutes = require('./routes/ddos');
const reportRoutes = require('./routes/reports');
const websiteRoutes = require('./routes/websites');
const clientRoutes = require('./routes/clients');
const tokenRoutes = require('./routes/tokens');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const complianceRoutes = require('./routes/compliance');
const vulnerabilityRoutes = require('./routes/vulnerabilities');
const sdkRoutes = require('./routes/sdk');
const cleanupRoutes = require('./routes/cleanup');
const emailRoutes = require('./routes/email');
const ipInfoRoutes = require('./routes/ipinfo');
const integrationsRoutes = require('./routes/integrations');
const analyticsRoutes = require('./routes/analytics');
const mitreRoutes = require('./routes/mitre');

const app = express();
const server = http.createServer(app);

// ─── Sentry Initialization ────────────────────────────────────
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

// Sentry Request Handler (must be first middleware)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // configured separately
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://drishti-kavach.vercel.app',
    /\.quickkaam\.in$/i,
    /localhost/i,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

app.use(express.json({ limit: '50mb' }));  // Increased for ZIP upload base64 payloads
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP detection (render uses proxies)
// Set to 1 to trust the first proxy only (Render's proxy)
app.set('trust proxy', 1);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

// SDK event limiter (per IP)
const sdkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'SDK rate limit exceeded.' },
});

// Attach io to req so routes can emit events
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Drishti Kavach API',
    tagline: 'दृष्टिः रक्षति, रक्षा दृश्यते',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────

// Public SDK (requires API key, not JWT)
app.use('/api/sdk', sdkLimiter, sdkRoutes);

// Public log endpoint (legacy / direct)
app.use('/api/log', sdkLimiter, logRoutes);

// Auth
app.use('/api/auth', authLimiter, authRoutes);

// Protected (JWT required — middleware applied inside route files)
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ip', ipRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ddos', ddosRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/ipinfo', ipInfoRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mitre', mitreRoutes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Sentry Error Handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ─── WebSocket ────────────────────────────────────────────────
initSocketIO(io);

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🕉️  Drishti Kavach API running on port ${PORT}`);
  console.log(`   दृष्टिः रक्षति, रक्षा दृश्यते`);
  console.log(`   "Vision protects, and protection is seen."\n`);
  startCronJobs();
});

module.exports = { app, server, io };
