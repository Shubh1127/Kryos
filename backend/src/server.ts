import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from './config/config';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import WebSocketService from './services/WebSocketService';

// Import routes
import apiKeyRoutes from './routes/apiKeys';
import dataIngestionRoutes from './routes/dataIngestion';
import companyRoutes from './routes/companies';
import analyticsRoutes from './routes/analytics';
import securityRoutes from './routes/security';
import dashboardRoutes from './routes/dashboard';
import realtimeRoutes from './routes/realtime';
import sdkRoutes from './routes/sdk';

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// CORS debug endpoint
app.get('/cors-debug', (req, res) => {
  res.status(200).json({
    origin: req.headers.origin,
    allowedOrigins: config.corsOrigin,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/companies', companyRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/data', dataIngestionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/security/alerts', securityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/sdk', sdkRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = config.port || 5000;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
new WebSocketService(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
});

export default app;