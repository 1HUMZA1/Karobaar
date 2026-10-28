/**
 * Karobaar Gemini Client (Server-side)
 * Uses official @google/genai SDK for modern Gemini 2.5 / 2.0 / 1.5 models.
 * Zero client-side API key exposure.
 */

import { GoogleGenAI } from '@google/genai';

// Supported Gemini Models (checked against official Google GenAI registry)
export const SUPPORTED_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended - Fastest & Most Accurate)', tier: 'default' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Advanced Business Reasoning & Deep Audits)', tier: 'pro' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'fast' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Legacy)', tier: 'legacy' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Legacy)', tier: 'legacy' }
];

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Creates and initializes the GoogleGenAI client with the given API key.
 */
export function createGeminiClient(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required to initialize GoogleGenAI client.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Convert standard tool declarations (OpenAI / JSON Schema format)
 * into Gemini native FunctionDeclaration format.
 */
export function formatGeminiTools(tools = []) {
  if (!Array.isArray(tools) || tools.length === 0) return undefined;

  const functionDeclarations = tools.map(t => {
    const fn = t.function || t;
    return {
      name: fn.name,
      description: fn.description || '',
      parameters: fn.parameters || { type: 'object', properties: {} }
    };
  });

  return [{ functionDeclarations }];
}

/**
 * Convert conversation messages into Gemini contents format.
 */
export function formatGeminiContents(messages = []) {
  const contents = [];

  for (const m of messages) {
    if (!m) continue;
    const role = m.role === 'assistant' ? 'model' : (m.role === 'user' ? 'user' : 'user');

    // Handle tool call messages
    if (m.tool_calls && Array.isArray(m.tool_calls)) {
      const parts = [];
      if (m.content) parts.push({ text: m.content });
      for (const tc of m.tool_calls) {
        let args = {};
        try {
          args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        } catch (e) {
          args = {};
        }
        parts.push({
          functionCall: {
            name: tc.function.name,
            args
          }
        });
      }
      contents.push({ role: 'model', parts });
      continue;
    }

    // Handle tool response messages
    if (m.role === 'tool') {
      let responseData = {};
      try {
        responseData = typeof m.content === 'string' ? JSON.parse(m.content) : m.content;
      } catch (e) {
        responseData = { output: m.content };
      }
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: m.name || 'tool_response',
            response: responseData
          }
        }]
      });
      continue;
    }

    // Standard text message
    if (m.content !== undefined && m.content !== null) {
      contents.push({
        role,
        parts: [{ text: String(m.content) }]
      });
    }
  }

  return contents;
}

/**
 * Execute Gemini Chat Generation using the official Google GenAI SDK.
 */
export async function executeGeminiChat({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  messages = [],
  tools = [],
  systemInstruction = '',
  temperature = 0.2
}) {
  const ai = createGeminiClient(apiKey);
  const targetModel = model || DEFAULT_GEMINI_MODEL;

  const contents = formatGeminiContents(messages);
  const geminiTools = formatGeminiTools(tools);

  const config = {
    temperature: typeof temperature === 'number' ? temperature : 0.2
  };

  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  if (geminiTools) {
    config.tools = geminiTools;
  }

  // Call the official SDK method
  const response = await ai.models.generateContent({
    model: targetModel,
    contents,
    config
  });

  // Extract model parts, text, and function calls
  const candidate = response?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  
  let responseText = '';
  const toolCalls = [];

  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx];
    if (part.text) {
      responseText += part.text;
    }
    if (part.functionCall) {
      toolCalls.push({
        id: `call_${Date.now()}_${idx}`,
        type: 'function',
        function: {
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args || {})
        }
      });
    }
  }

  // Fallback to response.text if candidate extraction didn't yield text
  if (!responseText && !toolCalls.length && response?.text) {
    responseText = response.text;
  }

  return {
    model: targetModel,
    content: responseText,
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
    finish_reason: candidate?.finishReason || 'STOP',
    usage: response?.usageMetadata || null
  };
}
