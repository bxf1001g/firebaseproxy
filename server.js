/**
 * Firebase SSE Proxy for Airtel M2M
 * Receives HTTP requests and forwards as HTTPS to Firebase
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 10000;

// Firebase host
const FIREBASE_HOST = 'https://relay-test1001-default-rtdb.asia-southeast1.firebasedatabase.app';

console.log('🚀 Firebase SSE Proxy starting...');
console.log('📡 Target: ' + FIREBASE_HOST);
console.log('🔗 Port: ' + PORT);

// Proxy configuration
const proxyOptions = {
  target: FIREBASE_HOST,
  changeOrigin: true,
  ws: false,  // Disable websockets (we're doing SSE)
  
  // Critical for SSE streaming
  onProxyReq: (proxyReq, req, res) => {
    // Forward original headers
    proxyReq.setHeader('Host', 'relay-test1001-default-rtdb.asia-southeast1.firebasedatabase.app');
    proxyReq.setHeader('Accept', 'text/event-stream');
    proxyReq.setHeader('Cache-Control', 'no-cache');
    proxyReq.setHeader('Connection', 'keep-alive');
    
    console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  },
  
  // Don't buffer responses (critical for SSE)
  onProxyRes: (proxyRes, req, res) => {
    // Remove content-length header for SSE streaming
    delete proxyRes.headers['content-length'];
    
    // Ensure streaming
    proxyRes.headers['cache-control'] = 'no-cache';
    proxyRes.headers['connection'] = 'keep-alive';
    
    console.log(`📤 [${new Date().toISOString()}] Response: ${proxyRes.statusCode}`);
  },
  
  // Error handling
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).send('Proxy error: ' + err.message);
  },
  
  // Timeout settings for long-lived SSE connections
  proxyTimeout: 3600000,  // 1 hour
  timeout: 3600000
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Firebase SSE Proxy',
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
  console.log('');
  console.log('Ready to proxy Firebase SSE requests! 🎉');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
