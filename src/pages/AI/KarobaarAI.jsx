import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Check, 
  RotateCcw, 
  Square, 
  Settings as SettingsIcon, 
  Menu, 
  X, 
  Mic, 
  MicOff, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Search,
  MessageSquare
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/databaseService';
import { aiConversationService } from '../../services/aiConversationService';
import { aiModelService } from '../../services/aiModelService';
import { executeKarobaarTool } from '../../services/aiToolsService';
import { KarobaarAIVisualizer } from '../../components/AI/KarobaarAIVisualizer';
import { useKarobaarAIAudio } from '../../components/AI/useKarobaarAIAudio';
import { Volume2, VolumeX } from 'lucide-react';
import './KarobaarAI.css';

export const KarobaarAI = () => {
  const { 
    currentUser, 
    currentBusiness, 
    theme, 
    toggleTheme 
  } = useAppContext();
  const navigate = useNavigate();

  const businessId = currentUser?.activeBusinessId || 'demo-business-1';

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active Chat State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [activeToolPills, setActiveToolPills] = useState([]);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('karobaar_ai_settings') || '{}');
    } catch {
      return {};
    }
  });

  // Speech Recognition & Audio State
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);

  const handleFinalSpeechTranscript = (finalText) => {
    if (finalText && finalText.trim()) {
      handleSendMessage(finalText.trim());
    }
  };

  const {
    visualizerState,
    setVisualizerState,
    audioLevel,
    isListening,
    isSpeaking,
    interimTranscript,
    errorMessage: audioError,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    stopSpeaking
  } = useKarobaarAIAudio({
    onFinalTranscript: handleFinalSpeechTranscript
  });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Load Conversations on Mount
  useEffect(() => {
    const list = aiConversationService.getConversations(businessId);
    setConversations(list);

    if (list.length > 0) {
      setActiveConvId(list[0].id);
      setMessages(list[0].messages || []);
    } else {
      // Create initial conversation
      const newConv = aiConversationService.createConversation({
        title: 'New Conversation',
        businessId
      });
      setConversations([newConv]);
      setActiveConvId(newConv.id);
      setMessages([]);
    }
  }, [businessId]);

  // Handle Global Navigation Event from AI Tools
  useEffect(() => {
    const handleNav = (e) => {
      if (e?.detail?.path) {
        navigate(e.detail.path);
      }
    };
    window.addEventListener('karobaar_ai_navigate', handleNav);
    return () => window.removeEventListener('karobaar_ai_navigate', handleNav);
  }, [navigate]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, statusText, activeToolPills]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(140, Math.max(48, textareaRef.current.scrollHeight)) + 'px';
    }
  }, [inputText]);

  // Switch Active Conversation
  const handleSelectConversation = (id) => {
    const conv = aiConversationService.getConversation(id);
    if (conv) {
      setActiveConvId(id);
      setMessages(conv.messages || []);
      setIsSidebarOpen(false);
    }
  };

  // Create New Conversation
  const handleNewChat = () => {
    const newConv = aiConversationService.createConversation({
      title: 'New Conversation',
      businessId
    });
    setConversations([newConv, ...conversations]);
    setActiveConvId(newConv.id);
    setMessages([]);
    setIsSidebarOpen(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Delete Conversation
  const handleDeleteConversation = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation history?')) {
      aiConversationService.deleteConversation(id);
      const updated = conversations.filter(c => c.id !== id);
      setConversations(updated);

      if (activeConvId === id) {
        if (updated.length > 0) {
          handleSelectConversation(updated[0].id);
        } else {
          handleNewChat();
        }
      }
    }
  };

  // Rename Conversation
  const handleRenameConversation = (e, id) => {
    e.stopPropagation();
    const conv = conversations.find(c => c.id === id);
    const newTitle = window.prompt('Rename conversation:', conv?.title || '');
    if (newTitle && newTitle.trim()) {
      aiConversationService.renameConversation(id, newTitle.trim());
      setConversations(conversations.map(c => c.id === id ? { ...c, title: newTitle.trim() } : c));
    }
  };

  // Copy Message to Clipboard
  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setStatusText('');
  };

  // Send User Message
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = '48px';

    const userMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    // Save message to conversation
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    aiConversationService.addMessage(activeConvId, userMessage);

    // Refresh conversation title if needed
    setConversations(aiConversationService.getConversations(businessId));

    setIsLoading(true);
    setStatusText('Thinking...');
    setVisualizerState('thinking');
    setActiveToolPills([]);

    try {
      const authContext = {
        db,
        businessId,
        currentUser,
        currentBusiness,
        navigate,
        theme,
        toggleTheme
      };

      const result = await aiModelService.sendMessage({
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        authContext,
        callbacks: {
          onToolStart: ({ name, args }) => {
            setStatusText(`Executing tool: ${name}...`);
            setVisualizerState('thinking');
            setActiveToolPills(prev => [...prev, { name, args, status: 'running' }]);
          },
          onToolEnd: ({ name, result }) => {
            setActiveToolPills(prev => prev.map(p => p.name === name ? { ...p, status: 'done', result } : p));
          },
          onStatusChange: (status) => {
            setStatusText(status);
            setVisualizerState('thinking');
          }
        },
        customApiKey: aiSettings.apiKey || '',
        provider: aiSettings.provider || 'auto',
        model: aiSettings.model || ''
      });

      const replyText = result.text || 'I analyzed that request.';

      // Extract spoken sentence
      let spokenSentence = result.spokenText;
      if (!spokenSentence) {
        const cleanForSpeech = replyText
          .replace(new RegExp('```[\s\S]*?```', 'g'), 'Code block output.')
          .replace(/[*#_`]/g, '')
          .replace(/•/g, '')
          .replace(/\|.*?\|/g, '')
          .replace(/\n+/g, ' ')
          .trim();
        const sentences = cleanForSpeech.split(/[.?!]\s+/);
        spokenSentence = (sentences.slice(0, 2).join('. ') + '.').slice(0, 240);
      }

      const aiMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: replyText,
        spokenText: spokenSentence,
        timestamp: new Date().toISOString(),
        toolLogs: result.toolLogs || null,
        requiresConfirmation: result.requiresConfirmation || false,
        confirmationAction: result.confirmationAction || null,
        actionData: result.actionData || null,
        quickActions: result.quickActions || null
      };

      setMessages(prev => [...prev, aiMessage]);
      aiConversationService.addMessage(activeConvId, aiMessage);

      // Play audio response if voice enabled
      if (voiceOutputEnabled && spokenSentence) {
        speakText(spokenSentence);
      } else {
        setVisualizerState('done');
        setTimeout(() => setVisualizerState('idle'), 1500);
      }

    } catch (err) {
      console.error('Chat error:', err);
      setVisualizerState('error');
      const errorMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: `I encountered an issue processing that query: ${err.message}. Please try again or rephrase.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      aiConversationService.addMessage(activeConvId, errorMessage);
      setTimeout(() => setVisualizerState('idle'), 2500);
    } finally {
      setIsLoading(false);
      setStatusText('');
      setActiveToolPills([]);
    }
  };

  // Confirm Sensitive Action Execution
  const handleConfirmAction = async (msgId, actionObj) => {
    if (!actionObj) return;

    setIsLoading(true);
    setStatusText(`Executing confirmed action: ${actionObj.toolName}...`);

    try {
      const authContext = {
        db,
        businessId,
        currentUser,
        currentBusiness,
        confirmed: true
      };

      const execResult = await executeKarobaarTool(actionObj.toolName, actionObj.toolArgs, authContext);

      // Append confirmation result message
      const resultMsg = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: execResult.success
          ? `✅ **Action Confirmed and Executed:**\n${execResult.message || JSON.stringify(execResult)}`
          : `❌ **Action Failed:** ${execResult.error}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, resultMsg]);
      aiConversationService.addMessage(activeConvId, resultMsg);

    } catch (err) {
      console.error('Confirmed action error:', err);
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  };

  // Keyboard shortcut in textarea: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Save Settings
  const handleSaveSettings = () => {
    localStorage.setItem('karobaar_ai_settings', JSON.stringify(aiSettings));
    setIsSettingsOpen(false);
  };

  // Simple Markdown Parser (Bold, Lists, Headings)
  const renderMarkdown = (content) => {
    if (!content) return null;
    const lines = content.split('\n');

    return lines.map((line, idx) => {
      // Heading
      if (line.startsWith('### ')) {
        return <h4 key={idx} style={{ fontSize: '1rem', fontWeight: 800, margin: '12px 0 6px 0' }}>{line.slice(4)}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} style={{ fontSize: '1.15rem', fontWeight: 800, margin: '14px 0 8px 0' }}>{line.slice(3)}</h3>;
      }

      // Bullet List
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().slice(2);
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', margin: '4px 0' }}>
            <span>•</span>
            <div>{renderInlineFormatting(itemText)}</div>
          </div>
        );
      }

      // Normal paragraph
      return (
        <p key={idx} style={{ margin: '0 0 6px 0', minHeight: line.trim() ? 'auto' : '8px' }}>
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  const renderInlineFormatting = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const filteredConversations = conversations.filter(c => 
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="karobaar-ai-page">
      {/* --- SIDEBAR: CONVERSATION HISTORY --- */}
      <aside className={`karobaar-ai-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="karobaar-ai-sidebar-header">
          <button 
            type="button" 
            onClick={handleNewChat}
            className="karobaar-ai-new-chat-btn"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>

          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="karobaar-ai-search-input"
            />
          </div>
        </div>

        <div className="karobaar-ai-conv-list custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#71717a', fontSize: '12px' }}>
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`karobaar-ai-conv-item ${conv.id === activeConvId ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <MessageSquare size={13} style={{ flexShrink: 0 }} />
                  <span className="karobaar-ai-conv-title">{conv.title || 'Untitled'}</span>
                </div>

                <div className="karobaar-ai-conv-actions">
                  <button 
                    type="button"
                    onClick={(e) => handleRenameConversation(e, conv.id)}
                    className="karobaar-ai-icon-btn-tiny"
                    title="Rename"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="karobaar-ai-icon-btn-tiny"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="karobaar-ai-sidebar-footer">
          <span>Karobaar AI v3.0</span>
          <button 
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="karobaar-ai-icon-btn-tiny"
            title="AI Settings"
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </aside>

      {/* --- MAIN CHAT CANVAS --- */}
      <main className="karobaar-ai-main">
        {/* Top Header */}
        <header className="karobaar-ai-header">
          <div className="karobaar-ai-header-left">
            <button 
              type="button" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="karobaar-ai-icon-btn md:hidden"
              title="Toggle History"
            >
              <Menu size={16} />
            </button>

            <div className="karobaar-ai-title-wrap">
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Karobaar AI</span>
              <div className="karobaar-ai-model-badge">
                <span className="karobaar-ai-status-dot" />
                <span>{aiSettings.provider ? aiSettings.provider.toUpperCase() : 'AUTO'} Gateway</span>
              </div>
            </div>
          </div>

          <div className="karobaar-ai-header-actions">
            <button 
              type="button" 
              onClick={() => {
                if (window.confirm('Clear messages in this conversation?')) {
                  setMessages([]);
                  aiConversationService.addMessage(activeConvId, { role: 'system', content: 'History reset' });
                }
              }}
              className="karobaar-ai-icon-btn"
              title="Clear active chat"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>

            <button 
              type="button" 
              onClick={() => setIsSettingsOpen(true)}
              className="karobaar-ai-icon-btn"
              title="Configure AI Model & Keys"
            >
              <SettingsIcon size={13} />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="karobaar-ai-messages-scroll custom-scrollbar">
          <div className="karobaar-ai-messages-container">
            {messages.length === 0 ? (
              /* Welcome Screen with Futuristic JARVIS AI Visualizer */
              <div className="karobaar-ai-welcome-state">
                <KarobaarAIVisualizer 
                  state={visualizerState}
                  audioLevel={audioLevel}
                  statusText={audioError || statusText || (isListening ? 'Listening to your voice...' : undefined)}
                  spokenText={interimTranscript}
                  size="large"
                  onMicClick={toggleListening}
                  onStopSpeaking={stopSpeaking}
                  showBranding={true}
                />

                <div className="karobaar-ai-prompt-cards-grid">
                  <div 
                    className="karobaar-ai-prompt-card"
                    onClick={() => handleSendMessage('Summarize today sales and calculate profit')}
                  >
                    <span className="karobaar-ai-prompt-card-label">📊 Financial Summary</span>
                    <span className="karobaar-ai-prompt-card-desc">Check today's sales, expenses, and gross profit</span>
                  </div>

                  <div 
                    className="karobaar-ai-prompt-card"
                    onClick={() => handleSendMessage('Which products are low in stock right now?')}
                  >
                    <span className="karobaar-ai-prompt-card-label">⚠️ Low Stock Audit</span>
                    <span className="karobaar-ai-prompt-card-desc">Identify items below reorder thresholds</span>
                  </div>

                  <div 
                    className="karobaar-ai-prompt-card"
                    onClick={() => handleSendMessage('Who owes me money and what is total udhaar?')}
                  >
                    <span className="karobaar-ai-prompt-card-label">👥 Customer Udhaar</span>
                    <span className="karobaar-ai-prompt-card-desc">Review pending customer receivables and khata</span>
                  </div>

                  <div 
                    className="karobaar-ai-prompt-card"
                    onClick={() => handleSendMessage('Explain how to calculate working capital for retail')}
                  >
                    <span className="karobaar-ai-prompt-card-label">💡 General Intelligence</span>
                    <span className="karobaar-ai-prompt-card-desc">Ask any question on coding, business, math, or history</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Message Bubbles */
              messages.map(msg => (
                <div key={msg.id} className={`karobaar-ai-message-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.role !== 'user' && (
                    <div className="karobaar-ai-avatar-pill">
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div className="karobaar-ai-message-bubble">
                    <div className="karobaar-ai-bubble-content">
                      {renderMarkdown(msg.content)}
                    </div>

                    {/* Sensitive Action Confirmation Card */}
                    {msg.requiresConfirmation && msg.confirmationAction && (
                      <div className="karobaar-ai-confirmation-card">
                        <div className="karobaar-ai-confirmation-header">
                          <AlertTriangle size={15} />
                          <span>Action Confirmation Required</span>
                        </div>
                        <div className="karobaar-ai-confirmation-body">
                          {msg.confirmationAction.summary}
                        </div>
                        <div className="karobaar-ai-confirmation-actions">
                          <button 
                            type="button"
                            onClick={() => handleConfirmAction(msg.id, msg.confirmationAction)}
                            className="karobaar-ai-confirm-btn"
                          >
                            Confirm & Execute
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              const cancelMsg = {
                                id: 'msg-' + Date.now(),
                                role: 'assistant',
                                content: 'Action cancelled by user.',
                                timestamp: new Date().toISOString()
                              };
                              setMessages(prev => [...prev, cancelMsg]);
                            }}
                            className="karobaar-ai-cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Card / Metrics */}
                    {msg.actionData && msg.actionData.metrics && (
                      <div style={{
                        marginTop: '12px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color, #27272a)'
                      }}>
                        {msg.actionData.metrics.map((m, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase' }}>{m.label}</span>
                            <span style={{ fontSize: '14px', fontWeight: 800 }}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tool Execution Logs */}
                    {msg.toolLogs && msg.toolLogs.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {msg.toolLogs.map((tl, idx) => (
                          <div key={idx} className="karobaar-ai-tool-pill">
                            <CheckCircle2 size={12} />
                            <span>Executed: {tl.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Copy & Retry actions */}
                    {msg.role === 'assistant' && (
                      <div className="karobaar-ai-message-footer">
                        <button 
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="karobaar-ai-icon-btn-tiny"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const lastUser = [...messages].reverse().find(m => m.role === 'user');
                            if (lastUser) handleSendMessage(lastUser.content);
                          }}
                          className="karobaar-ai-icon-btn-tiny"
                          title="Retry response"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Active Tool Execution Pills & Thinking Indicator */}
            {isLoading && (
              <div className="karobaar-ai-message-row ai">
                <div className="karobaar-ai-avatar-pill">
                  <Sparkles size={16} />
                </div>
                <div className="karobaar-ai-message-bubble">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{statusText || 'Thinking...'}</span>
                  </div>

                  {activeToolPills.map((pill, idx) => (
                    <div key={idx} className={`karobaar-ai-tool-pill ${pill.status === 'running' ? 'executing' : ''}`}>
                      <CheckCircle2 size={12} />
                      <span>{pill.status === 'running' ? '⚡ Calling:' : '✓ Executed:'} {pill.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="karobaar-ai-input-area">
          <div className="karobaar-ai-input-wrapper">
            <textarea 
              ref={textareaRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or command Karobaar AI..."
              className="karobaar-ai-textarea"
              rows={1}
            />

            <div className="karobaar-ai-input-controls">
              <div className="karobaar-ai-controls-left">
                <span>Press Enter ↵ to send</span>
              </div>

              <div className="karobaar-ai-controls-right">
                <button 
                  type="button" 
                  onClick={() => {
                    if (voiceOutputEnabled) stopSpeaking();
                    setVoiceOutputEnabled(!voiceOutputEnabled);
                  }}
                  className="karobaar-ai-icon-btn-tiny"
                  style={{ color: voiceOutputEnabled ? '#ffffff' : '#71717a' }}
                  title={voiceOutputEnabled ? 'Mute Voice Responses' : 'Enable Voice Responses'}
                >
                  {voiceOutputEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>

                <button 
                  type="button" 
                  onClick={toggleListening}
                  className={`karobaar-ai-icon-btn-tiny ${isListening ? 'active-listening-btn' : ''}`}
                  style={{ 
                    color: isListening ? '#09090b' : '#ffffff',
                    backgroundColor: isListening ? '#ffffff' : 'transparent',
                    boxShadow: isListening ? '0 0 16px rgba(255,255,255,0.4)' : 'none',
                    borderRadius: '50%'
                  }}
                  title={isListening ? 'Stop Listening' : 'Start Voice Input'}
                >
                  <Mic size={15} />
                </button>

                {isLoading ? (
                  <button 
                    type="button" 
                    onClick={handleStopGeneration}
                    className="karobaar-ai-stop-btn"
                  >
                    <Square size={12} />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
                    className="karobaar-ai-send-btn"
                    title="Send Message"
                  >
                    <Send size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="karobaar-ai-modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
          <div className="karobaar-ai-modal-card" onClick={e => e.stopPropagation()}>
            <div className="karobaar-ai-modal-header">
              <h3 className="karobaar-ai-modal-title">Karobaar AI Configuration</h3>
              <button 
                type="button" 
                onClick={() => setIsSettingsOpen(false)}
                className="karobaar-ai-icon-btn-tiny"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Model Provider
                </label>
                <select 
                  value={aiSettings.provider || 'auto'}
                  onChange={e => setAiSettings({ ...aiSettings, provider: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-body, #09090b)',
                    border: '1px solid var(--border-color, #27272a)',
                    color: 'var(--text-main, #ffffff)',
                    fontSize: '13px'
                  }}
                >
                  <option value="auto">Auto (Detects from API Key / Env)</option>
                  <option value="gemini">Google Gemini (gemini-2.5-flash / gemini-1.5-flash)</option>
                  <option value="openai">OpenAI (gpt-4o-mini / gpt-4o)</option>
                  <option value="groq">Groq (Llama-3.3-70b-versatile)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Custom API Key (Optional)
                </label>
                <input 
                  type="password"
                  placeholder="Paste your Gemini or OpenAI API key..."
                  value={aiSettings.apiKey || ''}
                  onChange={e => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-body, #09090b)',
                    border: '1px solid var(--border-color, #27272a)',
                    color: 'var(--text-main, #ffffff)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '11px', color: '#71717a', margin: '6px 0 0 0' }}>
                  Stored securely in your local browser session. You can also configure <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code> in your <code>.env</code> file.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsSettingsOpen(false)}
                  className="karobaar-ai-cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveSettings}
                  className="karobaar-ai-confirm-btn"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KarobaarAI;
