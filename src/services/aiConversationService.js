/**
 * Karobaar AI Conversation History Service
 * Multi-session conversation management, title generation, persistence, and archiving.
 */

const STORAGE_KEY = 'karobaar_ai_conversations_v3';

class AiConversationService {
  constructor() {
    this.conversations = this._loadConversations();
  }

  _loadConversations() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load AI conversations:', e);
      return [];
    }
  }

  _saveConversations() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('karobaar_ai_conversations_updated'));
      }
    } catch (e) {
      console.error('Failed to save AI conversations:', e);
    }
  }

  /**
   * Get all active conversations for a business
   */
  getConversations(businessId = null) {
    const all = this._loadConversations();
    if (!businessId) return all.filter(c => !c.isArchived);
    return all.filter(c => !c.isArchived && (!c.businessId || c.businessId === businessId));
  }

  /**
   * Get specific conversation by ID
   */
  getConversation(id) {
    return this.conversations.find(c => c.id === id) || null;
  }

  /**
   * Create a new conversation
   */
  createConversation({ title = 'New Conversation', initialMessages = [], businessId = null }) {
    const newConv = {
      id: 'conv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      title: title || 'New Conversation',
      businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
      messages: initialMessages || []
    };

    this.conversations.unshift(newConv);
    this._saveConversations();
    return newConv;
  }

  /**
   * Add a message to an existing conversation
   */
  addMessage(conversationId, message) {
    const conv = this.getConversation(conversationId);
    if (!conv) return null;

    const msgWithId = {
      id: message.id || 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      role: message.role || 'user',
      content: message.content || '',
      timestamp: message.timestamp || new Date().toISOString(),
      toolLogs: message.toolLogs || null,
      actionData: message.actionData || null,
      requiresConfirmation: message.requiresConfirmation || false,
      confirmationAction: message.confirmationAction || null
    };

    conv.messages.push(msgWithId);
    conv.updatedAt = new Date().toISOString();

    // Auto-generate title from first user query if still default title
    if (conv.title === 'New Conversation' && message.role === 'user') {
      const cleanTitle = message.content.slice(0, 32).trim() + (message.content.length > 32 ? '...' : '');
      conv.title = cleanTitle || 'Business Query';
    }

    this._saveConversations();
    return msgWithId;
  }

  /**
   * Rename a conversation
   */
  renameConversation(conversationId, newTitle) {
    const conv = this.getConversation(conversationId);
    if (!conv) return false;

    conv.title = (newTitle || 'Untitled').trim();
    conv.updatedAt = new Date().toISOString();
    this._saveConversations();
    return true;
  }

  /**
   * Archive a conversation
   */
  archiveConversation(conversationId) {
    const conv = this.getConversation(conversationId);
    if (!conv) return false;

    conv.isArchived = true;
    conv.updatedAt = new Date().toISOString();
    this._saveConversations();
    return true;
  }

  /**
   * Permanently delete a conversation
   */
  deleteConversation(conversationId) {
    this.conversations = this.conversations.filter(c => c.id !== conversationId);
    this._saveConversations();
    return true;
  }

  /**
   * Clear all conversations
   */
  clearAll(businessId = null) {
    if (businessId) {
      this.conversations = this.conversations.filter(c => c.businessId && c.businessId !== businessId);
    } else {
      this.conversations = [];
    }
    this._saveConversations();
  }
}

export const aiConversationService = new AiConversationService();
