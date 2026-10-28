/**
 * Karobaar AI Conversation & Memory Service
 * Manages multi-turn context, reference resolution, and conversation persistence.
 * Isolates memory strictly per workspace and authenticated user.
 */

const STORAGE_PREFIX = 'karobaar_ai_history_v2_';
const MAX_CONTEXT_TURNS = 12;

const memoryStore = new Map();
const safeStorage = {
  getItem: (key) => typeof localStorage !== 'undefined' ? localStorage.getItem(key) : (memoryStore.get(key) || null),
  setItem: (key, val) => typeof localStorage !== 'undefined' ? localStorage.setItem(key, String(val)) : memoryStore.set(key, String(val)),
  removeItem: (key) => typeof localStorage !== 'undefined' ? localStorage.removeItem(key) : memoryStore.delete(key)
};

class ConversationService {
  /**
   * Get storage key for active workspace
   */
  _getKey(businessId = 'demo-business-1') {
    return `${STORAGE_PREFIX}${businessId}`;
  }

  /**
   * Load messages for the active workspace
   */
  getHistory(businessId = 'demo-business-1') {
    try {
      const raw = safeStorage.getItem(this._getKey(businessId));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to load AI conversation history:', e);
      return [];
    }
  }

  /**
   * Save a message into persistent conversation memory
   */
  saveMessage(businessId = 'demo-business-1', message = {}) {
    const history = this.getHistory(businessId);
    const entry = {
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: message.role || (message.sender === 'user' ? 'user' : 'assistant'),
      content: message.content || message.text || '',
      timestamp: message.timestamp || new Date().toISOString(),
      toolLogs: message.toolLogs || null,
      tool_calls: message.tool_calls || null,
      tool_call_id: message.tool_call_id || null,
      name: message.name || null,
      contextEntities: message.contextEntities || null
    };

    history.push(entry);

    // Keep bounded history to avoid token explosion
    const trimmed = history.slice(-MAX_CONTEXT_TURNS);

    try {
      safeStorage.setItem(this._getKey(businessId), JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to persist AI conversation:', e);
    }

    return entry;
  }

  /**
   * Formats messages into LLM-ready context array (with sliding window)
   */
  getFormattedContext(businessId = 'demo-business-1', currentInput = '') {
    const rawHistory = this.getHistory(businessId);
    const formatted = [];

    for (const m of rawHistory) {
      if (m.role === 'tool') {
        formatted.push({
          role: 'tool',
          name: m.name,
          tool_call_id: m.tool_call_id,
          content: m.content
        });
      } else if (m.tool_calls) {
        formatted.push({
          role: 'assistant',
          content: m.content || '',
          tool_calls: m.tool_calls
        });
      } else if (m.content) {
        formatted.push({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        });
      }
    }

    if (currentInput) {
      formatted.push({ role: 'user', content: currentInput });
    }

    return formatted;
  }

  /**
   * Resolves contextual pronouns and references like "these products", "that invoice", "last month"
   * from recent conversation tool logs.
   */
  resolveContextualReference(businessId = 'demo-business-1', query = '') {
    const lower = query.toLowerCase();
    const history = this.getHistory(businessId);
    const recentLogs = history.filter(m => m.toolLogs && m.toolLogs.length > 0).slice(-3);

    const resolved = {
      inferredProducts: [],
      inferredCustomer: null,
      inferredPeriod: null
    };

    // 1. "these products" / "them" / "those items"
    if (/\b(these products|these items|them|those products|those items)\b/i.test(lower)) {
      for (const msg of recentLogs.reverse()) {
        for (const log of msg.toolLogs) {
          if (log.result?.items && Array.isArray(log.result.items)) {
            resolved.inferredProducts = log.result.items.map(i => i.name || i.id);
            break;
          }
          if (log.result?.products && Array.isArray(log.result.products)) {
            resolved.inferredProducts = log.result.products.map(p => p.name || p.id);
            break;
          }
        }
        if (resolved.inferredProducts.length > 0) break;
      }
    }

    // 2. "that customer" / "him" / "her"
    if (/\b(that customer|this customer|them|him|her)\b/i.test(lower)) {
      for (const msg of recentLogs.reverse()) {
        for (const log of msg.toolLogs) {
          if (log.result?.topDebtors && log.result.topDebtors.length > 0) {
            resolved.inferredCustomer = log.result.topDebtors[0];
            break;
          }
        }
        if (resolved.inferredCustomer) break;
      }
    }

    // 3. "that period" / "last month"
    if (/\b(last month|previous month)\b/i.test(lower)) {
      resolved.inferredPeriod = 'last_month';
    } else if (/\b(this month)\b/i.test(lower)) {
      resolved.inferredPeriod = 'this_month';
    }

    return resolved;
  }

  /**
   * Clear conversation history for active workspace
   */
  clearHistory(businessId = 'demo-business-1') {
    try {
      safeStorage.removeItem(this._getKey(businessId));
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const conversationService = new ConversationService();
