/**
 * Karobaar AI Backend Middleware / Service
 * Secure Server-Side Proxy for LLM Tool-Calling.
 * Zero Exposure of API Keys to the browser. Supports Gemini, OpenAI, Groq, OpenRouter, and Custom Gateways.
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

// Secure server-side environment resolver (reads process.env, .env.local, and .env without client leakage)
function getSecretEnv(keyName) {
  if (process.env[keyName]) return process.env[keyName].trim();

  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    try {
      const fullPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const k = trimmed.substring(0, eqIdx).trim();
            let v = trimmed.substring(eqIdx + 1).trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.slice(1, -1);
            }
            if (k === keyName) return v;
          }
        }
      }
    } catch (e) {
      // Ignore file reading errors
    }
  }
  return '';
}

// Simple in-memory rate limiter (40 requests per minute per IP)
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

      // Resolve API Key and Configuration from server environment securely
      const envKey = getSecretEnv('AI_API_KEY') || 
                     getSecretEnv('GEMINI_API_KEY') || 
                     getSecretEnv('OPENAI_API_KEY') || 
                     getSecretEnv('GROQ_API_KEY') ||
                     getSecretEnv('VITE_AI_API_KEY');

      const configuredProvider = getSecretEnv('AI_PROVIDER') || provider || 'auto';
      const configuredModel = getSecretEnv('AI_MODEL') || model || '';
      const customBaseUrl = getSecretEnv('AI_BASE_URL');

      const apiKey = (customApiKey || envKey || '').trim();

      if (!apiKey) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          fallback: true,
          error: 'NO_API_KEY',
          message: 'No external LLM API key detected. Please configure AI_API_KEY or GEMINI_API_KEY in .env.local, or provide one in Karobaar AI settings.'
        }));
        return;
      }

      // Determine provider, endpoint, and model
      let targetEndpoint = '';
      let targetModel = configuredModel;
      let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      if (customBaseUrl) {
        targetEndpoint = customBaseUrl;
        targetModel = targetModel || 'gpt-4o-mini';
      } else if (configuredProvider === 'openai' || apiKey.startsWith('sk-proj-') || (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-') && !apiKey.startsWith('sk-ant-'))) {
        targetEndpoint = 'https://api.openai.com/v1/chat/completions';
        targetModel = targetModel || 'gpt-4o-mini';
      } else if (configuredProvider === 'groq' || apiKey.startsWith('gsk_')) {
        targetEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
        targetModel = targetModel || 'llama-3.3-70b-versatile';
      } else if (configuredProvider === 'openrouter' || apiKey.startsWith('sk-or-')) {
        targetEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
        targetModel = targetModel || 'google/gemini-2.0-flash-exp:free';
      } else {
        // Default Google Gemini (OpenAI-compatible endpoint)
        targetEndpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
        targetModel = targetModel || 'gemini-1.5-flash';
      }

      // Prepare Messages with System Prompt
      const formattedMessages = [];
      const defaultSystemPrompt = systemPrompt || `You are Karobaar AI and Jarvis, the unified executive AI assistant and business co-pilot for the Karobaar business management platform.
Tagline: "Turn Work Into Growth."
You have two core capabilities:
1. GENERAL INTELLIGENCE: You can answer ANY question on any topic: science, technology, mathematics, programming, writing, history, geography, business economics, strategy, and casual conversation. Do not restrict yourself to Karobaar questions only.
2. APPLICATION CONTROL & LIVE DATA: You are connected to the store's live databases via tools. When asked about sales, revenue, expenses, stock, customers, invoices, or app navigation, execute the appropriate tool to fetch verified data or perform authorized actions.
Never invent financial figures, product IDs, or customer balances.
Format all answers with clean Markdown (headings, bullet points, and tables where helpful). Keep answers clear, accurate, and concise.`;

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

      // Execute request with safe error handling
      const response = await makeHttpsRequest(targetEndpoint, {
        method: 'POST',
        headers
      }, requestPayload);

      // Pass through provider's status code and data
      res.statusCode = response.statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.end(response.data);

    } catch (err) {
      console.error('[AI Gateway Server Error]:', err.message);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'AI_GATEWAY_ERROR',
        message: err.message || 'Internal error communicating with AI model provider.'
      }));
    }
  });
}
