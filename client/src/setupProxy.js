console.log('setupProxy.js loaded, proxying /api & /ws → http://localhost:8085');

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  console.log('Registering HTTP proxy for /api');
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8085',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq(proxyReq, req) {
        console.log('➡️  HTTP:', req.method, req.url);
      },
      onProxyRes(proxyRes, req) {
        console.log('⬅️  HTTP:', proxyRes.statusCode, req.url);
      },
      onError(err) {
        console.error('❌ HTTP proxy error:', err.message);
      }
    })
  );
  console.log('/api HTTP proxy registered');

  console.log('Registering WS proxy for /ws');
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://localhost:8085',
      changeOrigin: true,
      ws: true, 
      logLevel: 'debug',
      onProxyReqWs(proxyReq, req, socket, options, head) {
        console.log('➡️  WS handshake for', req.url);
      },
      onError(err) {
        console.error('❌ WS proxy error:', err.message);
      }
    })
  );
  console.log('/ws WebSocket proxy registered');
};
