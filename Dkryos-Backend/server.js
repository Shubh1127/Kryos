const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/.env' });
// Kryos SDK helper (dynamic ESM import handled inside)
const { initKryos, getKryos, sendEvent, rotateKryosApiKey, getStatus, flushNow } = require('./kryosSdk');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-frontend-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logger with enhanced debugging
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log(`🔍 Headers:`, req.headers);
  console.log(`🔍 Query:`, req.query);
  console.log(`🔍 Body:`, req.body);
  console.log(`🔍 Origin:`, req.get('origin'));
  console.log('═══════════════════════════════════════');
  
  if (req.path.includes('/users/media')) {
    console.log('📱 Media upload request detected!');
    console.log('📱 Headers:', req.headers);
  }
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔍 MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    console.log('🔍 Full URI (first 20 chars):', process.env.MONGODB_URI?.substring(0, 20));
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Initialize Kryos SDK early (non-blocking)
initKryos().then(instance => {
  if (instance) {
    // Attach request logger & metrics middleware if available
    try {
      app.use(instance.getRequestLogger());
      app.use(instance.getMetricsMiddleware());
      console.log('🧩 Kryos middlewares attached');
    } catch (e) {
      console.warn('Kryos middleware attach failed:', e.message);
    }
  }
});

// Metrics endpoint (Prometheus format)
app.get('/metrics', async (req, res) => {
  try {
    const sdk = getKryos();
    if (!sdk) return res.status(503).send('# Kryos SDK not initialized');
    const metrics = await sdk.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (e) {
    res.status(500).send('# Metrics error: ' + e.message);
  }
});

// Simple custom event endpoint
app.post('/track/event', async (req, res) => {
  try {
    const { eventType, ...rest } = req.body || {};
    if (!eventType) return res.status(400).json({ success: false, message: 'eventType is required' });
    await sendEvent({ eventType, ...rest });
    res.json({ success: true, message: 'Event queued' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// SDK status route
app.get('/kryos/status', (req, res) => {
  res.json({ success: true, data: getStatus() });
});

// Rotate Kryos API key (protect with a simple admin token env var)
app.post('/kryos/rotate-key', async (req, res) => {
  try {
    const adminToken = process.env.KRYOS_ADMIN_TOKEN;
    if (!adminToken) return res.status(500).json({ success: false, message: 'Rotation not configured' });
    const provided = req.headers['x-admin-token'] || req.query.token;
    if (provided !== adminToken) return res.status(403).json({ success: false, message: 'Forbidden' });
    const { apiKey } = req.body || {};
    if (!apiKey) return res.status(400).json({ success: false, message: 'apiKey required' });
    await rotateKryosApiKey(apiKey);
    res.json({ success: true, message: 'API key rotated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Kryos Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      register: 'POST /api/users/register',
      login: 'POST /api/users/login',
      profile: 'GET /api/users/profile (Protected)',
      uploadMedia: 'POST /api/users/media (Protected)',
      uploadAvatar: 'POST /api/users/avatar (Protected)'
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Multer errors
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Default error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`👋 ${signal} received. Shutting down gracefully...`);
  try {
    await flushNow();
    const sdk = getKryos();
    if (sdk?.shutdown) {
      await sdk.shutdown();
    }
  } catch (e) {
    console.warn('SDK shutdown error:', e.message);
  }
  try {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed.');
  } catch (e) {
    console.error('❌ Error closing MongoDB connection:', e.message);
  } finally {
    process.exit(0);
  }
}

['SIGTERM','SIGINT'].forEach(sig => process.on(sig, () => gracefulShutdown(sig)));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
