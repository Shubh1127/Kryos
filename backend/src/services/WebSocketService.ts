import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import ApiKey from '../models/ApiKey';
import { IApiKey } from '../models/ApiKey';

export interface AuthenticatedSocket extends Socket {
  apiKey?: IApiKey;
  companyId?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, string> = new Map(); // socketId -> companyId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"]
      }
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  private setupAuthentication() {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Extract API key from token (format: keyId.keySecret)
        const [keyId, keySecret] = token.split('.');
        
        if (!keyId || !keySecret) {
          return next(new Error('Invalid token format'));
        }

        // Find and validate API key
        const apiKey = await ApiKey.findOne({ 
          keyId, 
          isActive: true,
          $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
          ]
        }).populate('company');

        if (!apiKey || !apiKey.validateKey(keySecret)) {
          return next(new Error('Invalid or expired token'));
        }

        // Check if API key has dashboard permissions
        if (!apiKey.permissions.includes('dashboard:read')) {
          return next(new Error('Insufficient permissions for real-time monitoring'));
        }

        socket.apiKey = apiKey;
        socket.companyId = apiKey.company._id.toString();
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      console.log(`🔌 Client connected: ${socket.id} (Company: ${socket.companyId})`);
      
      // Store the connection
      this.connectedClients.set(socket.id, socket.companyId);

      // Join company-specific room for targeted updates
      socket.join(`company_${socket.companyId}`);

      // Send initial real-time data
      this.sendInitialData(socket);

      // Handle client requests for specific data
      socket.on('request_monitoring_update', () => {
        this.sendMonitoringUpdate(socket);
      });

      socket.on('request_security_alerts', () => {
        this.sendSecurityAlerts(socket);
      });

      socket.on('request_analytics_update', (timeRange: string) => {
        this.sendAnalyticsUpdate(socket, timeRange);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });

    // Start broadcasting periodic updates
    this.startPeriodicUpdates();
  }

  private async sendInitialData(socket: any) {
    try {
      // Send current system status
      socket.emit('monitoring_update', {
        timestamp: new Date().toISOString(),
        systemStatus: 'operational',
        activeConnections: this.connectedClients.size,
        uptime: process.uptime(),
      });

      // Send security overview
      socket.emit('security_overview', {
        timestamp: new Date().toISOString(),
        threatLevel: 'low',
        activeAlerts: 2,
        newAlerts: 1,
      });
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  private async sendMonitoringUpdate(socket: any) {
    try {
      const monitoringData = {
        timestamp: new Date().toISOString(),
        systemMetrics: {
          cpu: Math.floor(Math.random() * 30) + 20,
          memory: Math.floor(Math.random() * 40) + 30,
          disk: Math.floor(Math.random() * 20) + 15,
          network: Math.floor(Math.random() * 50) + 10,
        },
        activeConnections: this.connectedClients.size,
        requestsPerMinute: Math.floor(Math.random() * 100) + 50,
        averageResponseTime: Math.floor(Math.random() * 50) + 80,
        errorRate: (Math.random() * 2).toFixed(2),
      };

      socket.emit('monitoring_update', monitoringData);
    } catch (error) {
      console.error('Error sending monitoring update:', error);
    }
  }

  private async sendSecurityAlerts(socket: any) {
    try {
      // In a real implementation, this would query the database for new alerts
      const securityData = {
        timestamp: new Date().toISOString(),
        newAlerts: Math.floor(Math.random() * 3),
        threatLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        recentThreat: {
          type: 'suspicious_ip',
          severity: 'medium',
          source: `192.168.1.${Math.floor(Math.random() * 255)}`,
          timestamp: new Date().toISOString(),
        }
      };

      socket.emit('security_alert_update', securityData);
    } catch (error) {
      console.error('Error sending security alerts:', error);
    }
  }

  private async sendAnalyticsUpdate(socket: any, timeRange: string = '1h') {
    try {
      const analyticsData = {
        timestamp: new Date().toISOString(),
        timeRange,
        requestCount: Math.floor(Math.random() * 1000) + 500,
        uniqueUsers: Math.floor(Math.random() * 200) + 100,
        topEndpoints: [
          { endpoint: '/api/data/submit', requests: Math.floor(Math.random() * 100) + 50 },
          { endpoint: '/api/data/users', requests: Math.floor(Math.random() * 80) + 30 },
          { endpoint: '/api/files/upload', requests: Math.floor(Math.random() * 60) + 20 },
        ]
      };

      socket.emit('analytics_update', analyticsData);
    } catch (error) {
      console.error('Error sending analytics update:', error);
    }
  }

  private startPeriodicUpdates() {
    // Send monitoring updates every 30 seconds
    setInterval(() => {
      this.io.emit('monitoring_update', {
        timestamp: new Date().toISOString(),
        systemMetrics: {
          cpu: Math.floor(Math.random() * 30) + 20,
          memory: Math.floor(Math.random() * 40) + 30,
          disk: Math.floor(Math.random() * 20) + 15,
          network: Math.floor(Math.random() * 50) + 10,
        },
        activeConnections: this.connectedClients.size,
        requestsPerMinute: Math.floor(Math.random() * 100) + 50,
        averageResponseTime: Math.floor(Math.random() * 50) + 80,
      });
    }, 30000);

    // Send analytics updates every 2 minutes
    setInterval(() => {
      this.io.emit('analytics_update', {
        timestamp: new Date().toISOString(),
        requestCount: Math.floor(Math.random() * 1000) + 500,
        uniqueUsers: Math.floor(Math.random() * 200) + 100,
        errorCount: Math.floor(Math.random() * 10),
      });
    }, 120000);

    // Check for security alerts every minute
    setInterval(() => {
      // In a real implementation, this would check for new security alerts
      if (Math.random() > 0.8) { // 20% chance of new alert
        this.io.emit('security_alert_new', {
          timestamp: new Date().toISOString(),
          type: ['suspicious_ip', 'brute_force', 'rate_limit_exceeded'][Math.floor(Math.random() * 3)],
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
          source: `192.168.1.${Math.floor(Math.random() * 255)}`,
        });
      }
    }, 60000);
  }

  // Public methods for triggering specific events
  public broadcastSecurityAlert(companyId: string, alert: any) {
    this.io.to(`company_${companyId}`).emit('security_alert_new', {
      timestamp: new Date().toISOString(),
      ...alert
    });
  }

  public broadcastSystemAlert(companyId: string, alert: any) {
    this.io.to(`company_${companyId}`).emit('system_alert', {
      timestamp: new Date().toISOString(),
      ...alert
    });
  }

  public getConnectedClients(): number {
    return this.connectedClients.size;
  }

  public getCompanyConnections(companyId: string): number {
    return Array.from(this.connectedClients.values())
      .filter(id => id === companyId).length;
  }
}

export default WebSocketService;