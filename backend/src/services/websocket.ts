// WebSocket service for real-time dashboard updates
// Note: This is a basic implementation. For production, install socket.io: npm install socket.io @types/socket.io

interface WebSocketConnection {
  id: string;
  companyId: string;
  lastPing: Date;
}

class WebSocketService {
  private connections: Map<string, WebSocketConnection> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Simulate real-time data generation
  generateRealTimeData() {
    return {
      timestamp: new Date().toISOString(),
      systemMetrics: {
        cpu: Math.floor(Math.random() * 30) + 20, // 20-50%
        memory: Math.floor(Math.random() * 40) + 30, // 30-70%
        disk: Math.floor(Math.random() * 20) + 15, // 15-35%
        network: Math.floor(Math.random() * 50) + 10, // 10-60 Mbps
      },
      apiMetrics: {
        requestsPerMinute: Math.floor(Math.random() * 100) + 20,
        averageResponseTime: Math.floor(Math.random() * 50) + 100,
        errorRate: (Math.random() * 2).toFixed(2) + '%',
        activeConnections: Math.floor(Math.random() * 500) + 100,
      },
      alerts: this.generateRandomAlert(),
    };
  }

  generateRandomAlert() {
    const alertTypes = ['suspicious_ip', 'brute_force', 'rate_limit_exceeded', 'sql_injection'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    // 10% chance of generating a new alert
    if (Math.random() < 0.1) {
      return {
        _id: 'realtime-' + Date.now(),
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        title: 'Real-time Security Alert',
        description: 'New security event detected',
        source: {
          ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          location: 'Unknown',
        },
        details: {
          timestamp: new Date().toISOString(),
          automated: true,
        },
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }

  // Server-Sent Events (SSE) implementation for real-time updates
  // This is a simpler alternative to WebSocket that works with standard HTTP
  setupSSE(companyId: string, res: any, req?: any) {
    // Set headers for SSE
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
    const origin = req?.headers?.origin;
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    const connectionId = `${companyId}-${Date.now()}`;
    
    // Store connection
    this.connections.set(connectionId, {
      id: connectionId,
      companyId,
      lastPing: new Date(),
    });

    // Send initial data
    const initialData = this.generateRealTimeData();
    res.write(`data: ${JSON.stringify(initialData)}\n\n`);

    // Set up interval to send updates every 5 seconds
    const interval = setInterval(() => {
      const data = this.generateRealTimeData();
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 5000);

    this.intervals.set(connectionId, interval);

    // Handle client disconnect
    res.on('close', () => {
      this.connections.delete(connectionId);
      if (this.intervals.has(connectionId)) {
        clearInterval(this.intervals.get(connectionId)!);
        this.intervals.delete(connectionId);
      }
    });

    // Send periodic ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (this.connections.has(connectionId)) {
        res.write(`event: ping\ndata: ${Date.now()}\n\n`);
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

    return connectionId;
  }

  // Broadcast specific events to all connected clients for a company
  broadcastToCompany(companyId: string, event: string, data: any) {
    // In a real implementation, this would send data to all connections for the company
    console.log(`Broadcasting to company ${companyId}: ${event}`, data);
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      connectionsByCompany: Array.from(this.connections.values()).reduce((acc, conn) => {
        acc[conn.companyId] = (acc[conn.companyId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Clean up old connections
  cleanup() {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [id, connection] of this.connections.entries()) {
      if (now.getTime() - connection.lastPing.getTime() > timeout) {
        this.connections.delete(id);
        if (this.intervals.has(id)) {
          clearInterval(this.intervals.get(id)!);
          this.intervals.delete(id);
        }
      }
    }
  }
}

export const webSocketService = new WebSocketService();

// Clean up connections every minute
setInterval(() => {
  webSocketService.cleanup();
}, 60000);