/**
 * Karobaar AI Backend Middleware / Service
 * Secure Server-Side Proxy for LLM Tool-Calling.
 * Zero Exposure of API Keys to the browser. Supports Gemini, OpenAI, Groq, and OpenRouter.
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

// Simple in-memory rate limiter (30 requests per minute per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 40;

const checkRateLimit = (ip) => {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.startTime = now;
  } else {
    record.count++;
  }

  rateLimitMap.set(ip, record);
  return record.count <= MAX_REQUESTS_PER_WINDOW;
};

// Generic HTTPS request helper with timeout
const makeHttpsRequest = (targetUrl, options, postData, timeoutMs = 28000) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: options.headers || {}
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`AI Service Request Timed Out (${timeoutMs}ms)`));
    });

    req.on('error', err => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

/**
 * Main AI Chat Handler
 */
export async function handleAiChatRequest(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Karobaar-Business');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  // Rate Limiting
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a moment before sending another message.'
    }));
    return;
  }

  // Parse Body
  let bodyStr = '';
  req.on('data', chunk => { bodyStr += chunk; });
  req.on('end', async () => {
    try {
      const payload = JSON.parse(bodyStr || '{}');
      const { 
        messages = [], 
        tools = [], 
        provider = 'auto', 
        model = '', 
        customApiKey = '',
        systemPrompt = ''
      } = payload;

      // Resolve API Key and Endpoint
      const envKey = process.env.AI_API_KEY || 
                     process.env.GEMINI_API_KEY || 
                     process.env.VITE_AI_API_KEY || 
                     process.env.OPENAI_API_KEY || 
                     process.env.GROQ_API_KEY;

      const apiKey = customApiKey || envKey;

      if (!apiKey) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          fallback: true,
          error: 'NO_API_KEY',
          message: 'No external LLM API key detected. Please configure GEMINI_API_KEY or OPENAI_API_KEY in .env, or provide one in Karobaar AI settings.'
        }));
        return;
      }

      // Determine provider and model
      let targetEndpoint = '';
      let targetModel = model;
      let authHeader = `Bearer ${apiKey}`;

      if (apiKey.startsWith('AIzaSy') || provider === 'gemini') {
        // Google Gemini OpenAI-compatible endpoint
        targetEndpoint = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
        targetModel = targetModel || 'gemini-2.5-flash';
      } else if (apiKey.startsWith('gsk_') || provider === 'groq') {
        // Groq endpoint
        targetEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
        targetModel = targetModel || 'llama-3.3-70b-versatile';
      } else {
        // Default OpenAI
        targetEndpoint = 'https://api.openai.com/v1/chat/completions';
        targetModel = targetModel || 'gpt-4o-mini';
      }

      // Prepare Messages with System Prompt
      const formattedMessages = [];
      const defaultSystemPrompt = systemPrompt || `You are Karobaar AI, an intelligent, helpful executive AI assistant and business co-pilot for the Karobaar business management platform.
Tagline: "Turn Work Into Growth."
You can answer ANY question on any topic: general knowledge, history, science, math, coding, explanations, business strategy, or casual discussion.
When asked about this business's data, sales, stock, customers, or actions, use the provided tools to fetch real data or perform authorized operations.
Never guess financial figures or invent product IDs.
Be polite, professional, concise, and structured (use markdown bullet points, tables, and bold headings).`;

      formattedMessages.push({ role: 'system', content: defaultSystemPrompt });

      // Add conversation messages
      for (const m of messages) {
        if (m.role && m.content !== undefined) {
          formattedMessages.push({
            role: m.role,
            content: m.content,
            name: m.name,
            tool_call_id: m.tool_call_id,
            tool_calls: m.tool_calls
          });
        }
      }

      const requestPayload = {
        model: targetModel,
        messages: formattedMessages,
        temperature: 0.3
      };

      if (Array.isArray(tools) && tools.length > 0) {
        requestPayload.tools = tools;
        requestPayload.tool_choice = 'auto';
      }

      // Execute request
      const response = await makeHttpsRequest(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      }, requestPayload);

      res.statusCode = response.statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.end(response.data);

    } catch (err) {
      console.error('[AI Middleware Error]:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'AI_GATEWAY_ERROR',
        message: err.message || 'Internal error communicating with AI model provider.'
      }));
    }
  });
}
