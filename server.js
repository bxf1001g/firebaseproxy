/**
 * Firebase SSE Proxy - FIXED FOR SSE STREAMING
 * Properly handles Server-Sent Events without buffering
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 10000;

// Firebase host
const FIREBASE_HOST = '';

console.log('🚀 Firebase SSE Proxy starting...');
console.log('📡 Target: ' + FIREBASE_HOST);
console.log('🔗 Port: ' + PORT);

// **FIXED SSE PROXY CONFIGURATION**
const proxyOptions = {
  target: FIREBASE_HOST,
  changeOrigin: true,
  ws: false,
  
  // **CRITICAL: Disable buffering for SSE**
  buffer: null,
  selfHandleResponse: false,
  
  onProxyReq: (proxyReq, req, res) => {
    // Set SSE headers
    proxyReq.setHeader('Accept', 'text/event-stream');
    proxyReq.setHeader('Cache-Control', 'no-cache');
    proxyReq.setHeader('Connection', 'keep-alive');
    
    console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  },
  
  onProxyRes: (proxyRes, req, res) => {
    // **CRITICAL: Remove buffering headers**
    delete proxyRes.headers['content-length'];
    delete proxyRes.headers['transfer-encoding'];
    
    // Force SSE headers
    proxyRes.headers['content-type'] = 'text/event-stream; charset=utf-8';
    proxyRes.headers['cache-control'] = 'no-cache, no-transform';
    proxyRes.headers['connection'] = 'keep-alive';
    proxyRes.headers['x-accel-buffering'] = 'no';
    
    console.log(`📤 [${new Date().toISOString()}] Status: ${proxyRes.statusCode}, Type: ${proxyRes.headers['content-type']}`);
  },
  
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Proxy error: ' + err.message);
    }
  },
  
  // No timeout for long-lived SSE connections
  proxyTimeout: 0,
  timeout: 0
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Firebase SSE Proxy (Fixed)',
    version: '2.0',
    timestamp: new Date().toISOString(),
    target: FIREBASE_HOST
  });
});

// Proxy all other requests to Firebase
app.use('/', createProxyMiddleware(proxyOptions));

// Start server
app.listen(PORT, () => {
  console.log('✅ Proxy server running!');
  console.log(`🌐 Access via: http://localhost:${PORT}`);
  console.log('📊 Health check: /health');
  console.log('🔧 SSE streaming: ENABLED (buffering disabled)');
  console.log('');
  console.log('Ready to proxy Firebase SSE requests! 🎉');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
