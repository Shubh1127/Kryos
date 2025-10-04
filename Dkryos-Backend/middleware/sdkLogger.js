const KryosSDK = require('kryos-sdk');

// Initialize SDK (we'll configure this later)
let sdk = null;

// Initialize SDK with configuration
const initializeSDK = (config) => {
  try {
    sdk = new KryosSDK(config);
    console.log('🚀 Kryos SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Kryos SDK:', error);
  }
};

// Middleware to capture and forward all requests to main backend
const sdkRequestLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture request data
  const requestData = {
    // Request details
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    params: req.params,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer'),
      // Don't log sensitive headers like Authorization for security
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    },
    body: req.body,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    source: 'demo-backend'
  };

  // Add user info if available
  if (req.user) {
    requestData.user = {
      userId: req.user.userId,
      email: req.user.email || 'unknown'
    };
  }

  // Override res.json to capture response data
  const originalJson = res.json;
  let responseData = null;
  
  res.json = function(data) {
    responseData = data;
    return originalJson.call(this, data);
  };

  // Override res.end to capture final response
  const originalEnd = res.end;
  res.end = function(chunk) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Capture response data
    const completeRequestData = {
      ...requestData,
      response: {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        data: responseData,
        headers: res.getHeaders(),
        responseTime: responseTime
      },
      completedAt: new Date().toISOString()
    };

    // Send to SDK (async, don't block response)
    if (sdk) {
      setImmediate(() => {
        sendToMainBackend(completeRequestData);
      });
    }

    // Call original end
    return originalEnd.call(this, chunk);
  };

  next();
};

// Send data to main backend via SDK
const sendToMainBackend = async (requestData) => {
  try {
    if (!sdk) {
      console.warn('⚠️  SDK not initialized, skipping data transmission');
      return;
    }

    // Send request data to main backend
    await sdk.sendData({
      type: 'api_request',
      source: 'demo-backend',
      timestamp: new Date().toISOString(),
      data: requestData
    });

    console.log(`📡 Request data sent to main backend: ${requestData.method} ${requestData.path}`);
  } catch (error) {
    console.error('❌ Failed to send request data to main backend:', error.message);
    
    // Optional: Log failed requests for retry later
    // You could implement a queue system here
  }
};

// Function to send custom events to main backend
const sendCustomEvent = async (eventType, eventData) => {
  try {
    if (!sdk) {
      console.warn('⚠️  SDK not initialized, skipping event transmission');
      return;
    }

    await sdk.sendData({
      type: eventType,
      source: 'demo-backend',
      timestamp: new Date().toISOString(),
      data: eventData
    });

    console.log(`📡 Custom event sent to main backend: ${eventType}`);
  } catch (error) {
    console.error(`❌ Failed to send custom event ${eventType}:`, error.message);
  }
};

module.exports = {
  sdkRequestLogger,
  initializeSDK,
  sendCustomEvent
};