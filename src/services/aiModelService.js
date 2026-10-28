/**
 * Karobaar AI Model Service
 * Handles communication with the AI gateway, bounded tool-calling loop (max 5 iterations),
 * local neural engine fallback, and response synthesis.
 */

import { KAROBAAR_TOOL_DECLARATIONS, executeKarobaarTool } from './aiToolsService';
import { processJarvisQuery } from '../components/AI/jarvisEngine';

const MAX_TOOL_ITERATIONS = 5;

class AiModelService {
  /**
   * Send a query with full conversation history and tools
   */
  async sendMessage({
    messages,
    authContext,
    callbacks = {},
    customApiKey = '',
    provider = 'auto',
    model = ''
  }) {
    const { onToolStart, onToolEnd, onStatusChange } = callbacks;

    // Check custom settings
    let savedKey = customApiKey;
    if (!savedKey) {
      try {
        const savedSettings = JSON.parse(localStorage.getItem('karobaar_ai_settings') || '{}');
        savedKey = savedSettings.apiKey || '';
      } catch (e) {}
    }

    let iterations = 0;
    let currentMessages = [...messages];
    const executedToolLogs = [];

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      if (onStatusChange) {
        onStatusChange(iterations === 1 ? 'Thinking...' : 'Analyzing tool data...');
      }

      let responsePayload;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: currentMessages,
            tools: KAROBAAR_TOOL_DECLARATIONS,
            provider,
            model,
            customApiKey: savedKey,
            businessContext: {
              businessId: authContext.businessId,
              businessName: authContext.currentBusiness?.name,
              userRole: authContext.currentUser?.role
            }
          })
        });

        if (!res.ok) {
          throw new Error(`AI Gateway responded with HTTP ${res.status}`);
        }

        responsePayload = await res.json();
      } catch (networkErr) {
        console.warn('[AI Model Service] Backend API not reachable, falling back to Local Neural Engine:', networkErr.message);
        responsePayload = { fallback: true };
      }

      // If backend reports no API key or network unreachable, run Local Neural Tool Engine
      if (responsePayload.fallback || responsePayload.error === 'NO_API_KEY') {
        return this._executeLocalNeuralFallback(messages, authContext, onStatusChange);
      }

      // Extract model message
      const choice = responsePayload.choices?.[0];
      const message = choice?.message;

      if (!message) {
        throw new Error(responsePayload.message || 'No response message returned from AI model.');
      }

      // 1. Check if the model wants to call tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        currentMessages.push(message);

        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch (e) {
            fnArgs = {};
          }

          if (onToolStart) {
            onToolStart({ id: toolCall.id, name: fnName, args: fnArgs });
          }

          // Execute tool on real database
          const toolResult = await executeKarobaarTool(fnName, fnArgs, authContext);

          if (onToolEnd) {
            onToolEnd({ id: toolCall.id, name: fnName, result: toolResult });
          }

          executedToolLogs.push({
            name: fnName,
            args: fnArgs,
            result: toolResult
          });

          // If sensitive action needs user confirmation, interrupt and return confirmation state
          if (toolResult.requiresConfirmation) {
            return {
              text: toolResult.message || `Please confirm: ${toolResult.summary}`,
              requiresConfirmation: true,
              confirmationAction: {
                toolName: fnName,
                toolArgs: fnArgs,
                summary: toolResult.summary
              },
              toolLogs: executedToolLogs
            };
          }

          // Feed tool output back to model
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: fnName,
            content: JSON.stringify(toolResult)
          });
        }

        // Loop continues so model can synthesize the final response based on tool outputs
        continue;
      }

      // 2. Final response achieved (no more tool calls)
      return {
        text: message.content || 'I completed that action for you.',
        toolLogs: executedToolLogs,
        modelUsed: responsePayload.model || model || 'Karobaar AI'
      };
    }

    // Safety timeout loop exit
    return {
      text: 'I gathered the necessary data but reached the maximum tool reasoning depth.',
      toolLogs: executedToolLogs
    };
  }

  /**
   * Robust Local Neural Fallback
   * Uses real database queries + deterministic calculations when no cloud API key is configured.
   */
  async _executeLocalNeuralFallback(messages, authContext, onStatusChange) {
    if (onStatusChange) onStatusChange('Analyzing store data...');

    const latestUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const userQuery = latestUserMsg ? latestUserMsg.content : '';

    // Delegate to Jarvis neural intent engine with full database access
    const result = await processJarvisQuery(userQuery, {
      db: authContext.db,
      businessId: authContext.businessId || authContext.currentUser?.activeBusinessId,
      currentBusiness: authContext.currentBusiness,
      currentUser: authContext.currentUser,
      navigate: authContext.navigate || (() => {}),
      theme: authContext.theme || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'light') || 'light',
      toggleTheme: authContext.toggleTheme || (() => {}),
      aiLanguage: authContext.aiLanguage || 'hinglish',
      assistantName: authContext.assistantName || 'Jarvis',
      triggerBackupExport: authContext.triggerBackupExport
    });

    const toolLogs = [];
    if (result.actionData) {
      toolLogs.push({
        name: result.actionData.type || 'database_query',
        args: { query: userQuery },
        result: result.actionData
      });
    }

    return {
      text: result.replyText,
      toolLogs,
      actionData: result.actionData,
      quickActions: result.quickActions,
      modelUsed: 'Karobaar Local Neural Engine (Offline)'
    };
  }
}

export const aiModelService = new AiModelService();
