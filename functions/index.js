/**
 * Firebase Cloud Functions integration for Karobaar AI
 * Deploy with: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const https = require('https');

exports.karobaarAiChat = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.AI_API_KEY || functions.config().ai?.key;
  if (!apiKey) {
    res.status(200).json({
      fallback: true,
      error: 'NO_API_KEY',
      message: 'Configure ai.key in Firebase functions config.'
    });
    return;
  }

  // Forward to OpenAI or Gemini
  const endpoint = apiKey.startsWith('AIzaSy')
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const reqData = JSON.stringify(req.body);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  };

  const proxyReq = https.request(endpoint, options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  proxyReq.write(reqData);
  proxyReq.end();
});
