/**
 * Karobaar Unified AI Service (v2.0)
 * Central interface for all business AI requests, tool calling, memory management, and autonomous actions.
 */

import { getRegisteredToolDeclarations } from './toolRegistry.js';
import { aiActionService } from './aiActionService.js';
import { conversationService } from './conversationService.js';
import { businessContextService } from './businessContextService.js';
import { aiSettingsService } from './aiSettingsService.js';
import { recommendationEngine } from './recommendationEngine.js';
import { aiEvaluationService } from './aiEvaluationService.js';
import { processJarvisQuery } from '../../components/AI/jarvisEngine.js';

const MAX_TOOL_ITERATIONS = 5;

class AiService {
  constructor() {
    this.contextService = businessContextService;
    this.actionService = aiActionService;
    this.conversation = conversationService;
    this.settings = aiSettingsService;
    this.recommendations = recommendationEngine;
    this.evaluation = aiEvaluationService;
  }

  /**
   * Main query execution pipeline
   */
  async sendMessage({
    query = '',
    messages = [],
    authContext = {},
    callbacks = {},
    customApiKey = '',
    model = ''
  }) {
    const { onToolStart, onToolEnd, onStatusChange } = callbacks;
    const businessId = authContext.businessId || 
                       authContext.currentBusiness?.id || 
                       localStorage.getItem('karobaar-active-business') || 
                       'demo-business-1';

    // 1. Load active settings
    const currentSettings = this.settings.getSettings(businessId);
    if (!currentSettings.aiEnabled) {
      return {
        text: 'Karobaar AI is currently disabled in Settings. You can enable it in Settings > Customize AI & Automations.',
        spokenText: 'Karobaar AI is currently disabled in Settings.'
      };
    }

    const targetModel = model || currentSettings.model || 'gemini-2.5-flash';
    const apiKey = customApiKey || currentSettings.customApiKey || '';

    // 2. Resolve contextual references like "these products", "that invoice"
    const resolvedContext = this.conversation.resolveContextualReference(businessId, query);

    // 3. Build live business context
    const systemContext = await this.contextService.buildSystemContext(authContext);

    // 4. Prepare message list for conversation
    let currentMessages = messages && messages.length > 0 
      ? [...messages]
      : this.conversation.getFormattedContext(businessId, query);

    if (query && (!messages || messages.length === 0)) {
      this.conversation.saveMessage(businessId, { role: 'user', content: query });
    }

    // 5. Tool-calling loop
    let iterations = 0;
    const executedToolLogs = [];
    const toolDeclarations = getRegisteredToolDeclarations();

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      if (onStatusChange) {
        onStatusChange(iterations === 1 ? 'Consulting Karobaar AI...' : 'Analyzing business data...');
      }

      let responsePayload;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: currentMessages,
            tools: toolDeclarations,
            model: targetModel,
            customApiKey: apiKey,
            systemPrompt: systemContext,
            businessContext: {
              businessId,
              businessName: authContext.currentBusiness?.name,
              userRole: authContext.currentUser?.role || 'Owner'
            }
          })
        });

        if (!res.ok) {
          throw new Error(`AI Gateway responded with HTTP ${res.status}`);
        }

        responsePayload = await res.json();
      } catch (networkErr) {
        console.warn('[AI Service] Cloud gateway unreachable, activating Local Neural Engine:', networkErr.message);
        responsePayload = { fallback: true };
      }

      // If backend reports no API key or network unreachable, run Local Neural Engine
      if (responsePayload.fallback || responsePayload.error === 'NO_API_KEY' || responsePayload.error === 'INVALID_API_KEY') {
        return this._executeLocalFallback(query, currentMessages, authContext, onStatusChange);
      }

      const choice = responsePayload.choices?.[0];
      const message = choice?.message;

      if (!message) {
        throw new Error(responsePayload.message || 'No response returned from AI model.');
      }

      // 6. Handle Tool Calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        currentMessages.push(message);

        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs = {};
          try {
            fnArgs = typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments || '{}')
              : toolCall.function.arguments;
          } catch (e) {
            fnArgs = {};
          }

          // Merge contextual entities if not provided in args
          if (resolvedContext.inferredProducts.length > 0 && !fnArgs.productId && !fnArgs.query) {
            fnArgs.query = resolvedContext.inferredProducts[0];
          }

          if (onToolStart) {
            onToolStart({ id: toolCall.id, name: fnName, args: fnArgs });
          }

          // Execute tool with role permissions & workspace scoping
          const toolResult = await this.actionService.executeTool(fnName, fnArgs, authContext);

          if (onToolEnd) {
            onToolEnd({ id: toolCall.id, name: fnName, result: toolResult });
          }

          executedToolLogs.push({
            name: fnName,
            args: fnArgs,
            result: toolResult
          });

          // If sensitive action requires user confirmation, return reviewable action draft
          if (toolResult.requiresConfirmation) {
            const botResponse = {
              text: toolResult.message || `Please confirm: ${toolResult.summary}`,
              spokenText: `Please confirm this action on screen.`,
              requiresConfirmation: true,
              confirmationAction: {
                toolName: fnName,
                toolArgs: fnArgs,
                summary: toolResult.summary
              },
              toolLogs: executedToolLogs
            };
            this.conversation.saveMessage(businessId, { role: 'assistant', ...botResponse });
            return botResponse;
          }

          // Feed tool result back to model for synthesis
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: fnName,
            content: JSON.stringify(toolResult)
          });
        }

        // Continue loop to let Gemini synthesize the final answer
        continue;
      }

      // 7. Final Response Synthesis
      const finalReply = message.content || 'I completed that action for you.';
      const spokenText = this._cleanForSpeech(finalReply);

      const botResponse = {
        text: finalReply,
        spokenText,
        toolLogs: executedToolLogs,
        modelUsed: responsePayload.model || targetModel
      };

      this.conversation.saveMessage(businessId, { role: 'assistant', ...botResponse });
      return botResponse;
    }

    // Maximum iterations reached safety exit
    return {
      text: 'I gathered the necessary data from your store records.',
      spokenText: 'I gathered the necessary data from your store records.',
      toolLogs: executedToolLogs
    };
  }

  /**
   * Execute a user-confirmed action (e.g. creating a sale, adjusting stock)
   */
  async executeConfirmedAction(actionData, authContext = {}) {
    const { toolName, toolArgs } = actionData;
    const confirmedArgs = { ...toolArgs, _confirmed: true };

    const result = await this.actionService.executeTool(toolName, confirmedArgs, authContext);
    const businessId = authContext.businessId || 'demo-business-1';

    const botResponse = {
      text: result.message || `Action ${toolName} completed successfully.`,
      spokenText: result.message || `Action completed successfully.`,
      toolLogs: [{ name: toolName, args: confirmedArgs, result }]
    };

    this.conversation.saveMessage(businessId, { role: 'assistant', ...botResponse });
    return botResponse;
  }

  /**
   * Local Neural Fallback (runs when offline or without external cloud API key)
   */
  async _executeLocalFallback(query, messages, authContext, onStatusChange) {
    if (onStatusChange) onStatusChange('Analyzing store data...');

    const latestUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const userQuery = query || (latestUserMsg ? latestUserMsg.content : '');

    const result = await processJarvisQuery(userQuery, {
      db: authContext.db,
      businessId: authContext.businessId,
      currentBusiness: authContext.currentBusiness,
      currentUser: authContext.currentUser,
      navigate: authContext.navigate || (() => {}),
      theme: authContext.theme,
      toggleTheme: authContext.toggleTheme,
      aiLanguage: authContext.aiLanguage || 'hinglish',
      assistantName: authContext.assistantName || 'Jarvis'
    });

    const botResponse = {
      text: result.replyText,
      spokenText: result.spokenText,
      actionData: result.actionData || null,
      quickActions: result.quickActions || [],
      toolLogs: [{
        name: result.actionData?.type || 'local_intelligence',
        args: { query: userQuery },
        result: result.actionData
      }],
      modelUsed: 'Karobaar Local Neural Engine'
    };

    const businessId = authContext.businessId || 'demo-business-1';
    this.conversation.saveMessage(businessId, { role: 'assistant', ...botResponse });

    return botResponse;
  }

  /**
   * Cleans Markdown response into natural spoken sentences for speech synthesis
   */
  _cleanForSpeech(text = '') {
    const clean = text
      .replace(/```[\s\S]*?```/g, 'Code block output.')
      .replace(/[*#_`]/g, '')
      .replace(/•/g, '')
      .replace(/\|.*?\|/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    const sentences = clean.split(/[.?!]\s+/);
    return (sentences.slice(0, 2).join('. ') + '.').slice(0, 240);
  }
}

export const aiService = new AiService();
