import { useEffect, useRef, useState } from 'react';

interface SecurityAlert {
  _id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  source: {
    ip: string;
    location?: string;
  };
  details: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RealTimeData {
  timestamp: string;
  systemMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  apiMetrics: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: string;
    activeConnections: number;
  };
  alerts: SecurityAlert | null;
}

interface UseRealTimeOptions {
  enabled?: boolean;
  apiKey?: string;
  onAlert?: (alert: SecurityAlert) => void;
  onError?: (error: Error) => void;
}

export function useRealTime(options: UseRealTimeOptions = {}) {
  const { enabled = true, apiKey, onAlert, onError } = options;
  const [data, setData] = useState<RealTimeData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!enabled || !apiKey) return;

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log('🔴 Establishing real-time connection...');
      
      // Add Authorization header (Note: EventSource doesn't support custom headers directly)
      // We'll need to pass the API key as a query parameter or use a different approach
      const urlWithAuth = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/realtime/stream?apiKey=${encodeURIComponent(apiKey)}`;
      const authenticatedEventSource = new EventSource(urlWithAuth);

      authenticatedEventSource.onopen = () => {
        console.log('✅ Real-time connection established');
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      authenticatedEventSource.onmessage = (event) => {
        try {
          const newData: RealTimeData = JSON.parse(event.data);
          setData(newData);

          // Handle new alerts
          if (newData.alerts && onAlert) {
            onAlert(newData.alerts);
          }
        } catch (err) {
          console.error('Error parsing real-time data:', err);
        }
      };

      authenticatedEventSource.onerror = (event) => {
        console.error('❌ Real-time connection error:', event);
        setConnected(false);
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
          console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          const errorMsg = 'Real-time connection failed after maximum retry attempts';
          setError(errorMsg);
          if (onError) {
            onError(new Error(errorMsg));
          }
        }
      };

      // Handle ping events to keep connection alive
      authenticatedEventSource.addEventListener('ping', (event) => {
        console.log('📡 Received ping:', event.data);
      });

      eventSourceRef.current = authenticatedEventSource;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to establish real-time connection';
      console.error('❌ Real-time connection setup error:', err);
      setError(errorMsg);
      if (onError) {
        onError(new Error(errorMsg));
      }
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnected(false);
    setData(null);
    reconnectAttemptsRef.current = 0;
  };

  useEffect(() => {
    if (enabled && apiKey) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, apiKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    data,
    connected,
    error,
    connect,
    disconnect,
    reconnect: () => {
      disconnect();
      setTimeout(connect, 100);
    },
  };
}

// Alternative hook for polling-based real-time updates (fallback)
export function usePollingRealTime(options: UseRealTimeOptions & { interval?: number } = {}) {
  const { enabled = true, interval = 5000, onError } = options;
  const [data, setData] = useState<Partial<RealTimeData> | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = async () => {
    if (!enabled) return;

    setIsPolling(true);

    const poll = async () => {
      try {
        // Simulate polling by generating random data
        const mockData = {
          timestamp: new Date().toISOString(),
          systemMetrics: {
            cpu: Math.floor(Math.random() * 30) + 20,
            memory: Math.floor(Math.random() * 40) + 30,
            disk: Math.floor(Math.random() * 20) + 15,
            network: Math.floor(Math.random() * 50) + 10,
          },
          apiMetrics: {
            requestsPerMinute: Math.floor(Math.random() * 100) + 20,
            averageResponseTime: Math.floor(Math.random() * 50) + 100,
            errorRate: (Math.random() * 2).toFixed(2) + '%',
            activeConnections: Math.floor(Math.random() * 500) + 100,
          },
        };

        setData(mockData);
      } catch (err) {
        console.error('Polling error:', err);
        if (onError) {
          onError(err instanceof Error ? err : new Error('Polling failed'));
        }
      }
    };

    // Initial poll
    await poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  };

  const stopPolling = () => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (enabled) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval]);

  return {
    data,
    isPolling,
    startPolling,
    stopPolling,
  };
}