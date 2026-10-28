/**
 * Karobaar AI Backend Middleware / Service
 * Secure Server-Side Proxy for Gemini 2.5 / 2.0 / 1.5 with official @google/genai SDK.
 * Zero Exposure of API Keys to the browser.
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { 
  executeGeminiChat, 
  SUPPORTED_GEMINI_MODELS, 
  DEFAULT_GEMINI_MODEL 
} from './geminiClient.js';

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

// In-memory rate limiter (60 requests per minute per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 60;

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

// Generic HTTPS request helper for fallback providers
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
 * Handle AI Models Discovery Endpoint
 */
export async function handleAiModelsRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    models: SUPPORTED_GEMINI_MODELS,
    defaultModel: DEFAULT_GEMINI_MODEL
  }));
}

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

  // Parse Request Body
  let bodyStr = '';
  req.on('data', chunk => { bodyStr += chunk; });
  req.on('end', async () => {
    try {
      const payload = JSON.parse(bodyStr || '{}');
      const { 
        messages = [], 
        tools = [], 
        provider = 'gemini', 
        model = '', 
        customApiKey = '',
        systemPrompt = '',
        businessContext = {}
      } = payload;

      // Resolve API Key securely from server environment
      const envKey = getSecretEnv('GEMINI_API_KEY') || 
                     getSecretEnv('AI_API_KEY') || 
                     getSecretEnv('VITE_FIREBASE_API_KEY') ||
                     getSecretEnv('VITE_AI_API_KEY') ||
                     getSecretEnv('OPENAI_API_KEY') || 
                     getSecretEnv('GROQ_API_KEY');

      const configuredProvider = getSecretEnv('AI_PROVIDER') || provider || 'gemini';
      const configuredModel = getSecretEnv('AI_MODEL') || model || DEFAULT_GEMINI_MODEL;
      const customBaseUrl = getSecretEnv('AI_BASE_URL');

      const apiKey = (customApiKey || envKey || '').trim();

      if (!apiKey) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          fallback: true,
          error: 'NO_API_KEY',
          message: 'No cloud AI API key detected. Using Karobaar Local Neural Intelligence.'
        }));
        return;
      }

      // Build context-rich system instruction
      const defaultSystemPrompt = systemPrompt || `You are Karobaar AI and Jarvis, the executive business intelligence assistant and autonomous co-pilot for the Karobaar business management platform.
Tagline: "Turn Work Into Growth."
Current Store: "${businessContext.businessName || 'My Store'}" (ID: ${businessContext.businessId || 'active'})
User Role: ${businessContext.userRole || 'Owner'}
Operating Rules:
1. ALWAYS use the provided tools to query real business metrics: sales, revenue, products, low stock, customer udhaar balances, and expenses.
2. NEVER fabricate financial numbers, order IDs, or product stock.
3. When summarizing financial reports, clearly separate Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, and Net Profit.
4. For consequential operations (creating sales, modifying inventory, deleting products), prepare a reviewable draft and require explicit user confirmation.
5. Provide clear, concise answers formatted in clean Markdown with tables or bullet points where appropriate.`;

      // Branch 1: Official Google GenAI SDK (Gemini)
      const isGemini = configuredProvider === 'gemini' || 
                       apiKey.startsWith('AIzaSy') || 
                       configuredModel.includes('gemini');

      if (isGemini && !customBaseUrl) {
        try {
          const geminiResult = await executeGeminiChat({
            apiKey,
            model: configuredModel,
            messages,
            tools,
            systemInstruction: defaultSystemPrompt,
            temperature: 0.2
          });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            choices: [{
              message: {
                role: 'assistant',
                content: geminiResult.content || '',
                tool_calls: geminiResult.tool_calls
              },
              finish_reason: geminiResult.finish_reason
            }],
            model: geminiResult.model,
            usage: geminiResult.usage
          }));
          return;
        } catch (geminiError) {
          console.warn('[Gemini SDK Warning]:', geminiError.message);
          if (geminiError.status === 400 || geminiError.message?.includes('API_KEY_INVALID')) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              fallback: true,
              error: 'INVALID_API_KEY',
              message: 'Provided API Key was rejected by Google Gemini. Reverting to Local Neural Engine.'
            }));
            return;
          }
          throw geminiError;
        }
      }

      // Branch 2: Fallback to OpenAI / Groq Compatible endpoint
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
      } else {
        // Fallback OpenAI-compatible endpoint for Google Generative Language
        targetEndpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
        targetModel = targetModel || DEFAULT_GEMINI_MODEL;
      }

      const formattedMessages = [{ role: 'system', content: defaultSystemPrompt }];
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
        temperature: 0.2
      };

      if (Array.isArray(tools) && tools.length > 0) {
        requestPayload.tools = tools;
        requestPayload.tool_choice = 'auto';
      }

      const response = await makeHttpsRequest(targetEndpoint, {
        method: 'POST',
        headers
      }, requestPayload);

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
