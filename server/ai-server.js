/**
 * Standalone Karobaar AI Production Server
 * For Docker / VPS / Node.js hosting deployments.
 * Usage: node server/ai-server.js
 */

import http from 'http';
import { handleAiChatRequest, handleAiModelsRequest } from './ai-middleware.js';

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/ai/chat') {
    await handleAiChatRequest(req, res);
  } else if (url.pathname === '/api/ai/models') {
    await handleAiModelsRequest(req, res);
  } else if (url.pathname === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', service: 'Karobaar AI Gateway', timestamp: new Date().toISOString() }));
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`[Karobaar AI] Gateway Server running at http://localhost:${PORT}`);
});
