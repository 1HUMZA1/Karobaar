import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Bot, 
  Send, 
  X, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  Check, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Moon, 
  Sun, 
  LayoutDashboard, 
  RotateCcw,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/databaseService';
import './CustomizeAIChatbot.css';

export const CustomizeAIChatbot = () => {
  const { theme, toggleTheme, appUiVersion, setAppUiVersion, currentUser, currentBusiness } = useAppContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Settings for Customize AI
  const [aiSettings, setAiSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('karobaar_customize_ai_settings');
      return saved ? JSON.parse(saved) : {
        assistantName: 'Customize',
        showFloatingBubble: true,
        autoExecute: true,
        dailySummaryAlert: true
      };
    } catch {
      return { assistantName: 'Customize', showFloatingBubble: true, autoExecute: true };
    }
  });

  // Conversation history
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem('karobaar_customize_ai_history');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'welcome-1',
        sender: 'bot',
        text: `Hello! I am **Customize**, your AI automation assistant for ${currentBusiness?.name || 'Karobaar'}. I can automate sales, check inventory, switch operating modes, analyze finances, or execute commands for you.`,
        timestamp: new Date().toISOString(),
        quickActions: [
          { label: '📊 Today\'s Total Sales', query: 'Show today sales summary' },
          { label: '⚠️ Check Low Stock', query: 'Which items are low in stock?' },
          { label: '⚡ Switch to Legacy Desk', query: 'Switch to legacy operations desk' },
          { label: '🌙 Toggle Theme', query: 'Toggle dark mode' },
          { label: '🛒 Open POS Terminal', query: 'Open POS register' }
        ]
      }
    ];
  });

  // Listen to open event from Topbar or Global Search
  useEffect(() => {
    const handleOpenAi = (e) => {
      setIsOpen(true);
      if (e.detail && e.detail.query) {
        handleUserQuery(e.detail.query);
      }
    };
    window.addEventListener('karobaar_open_ai_assistant', handleOpenAi);
    return () => window.removeEventListener('karobaar_open_ai_assistant', handleOpenAi);
  }, []);

  // Save conversation history
  useEffect(() => {
    try {
      localStorage.setItem('karobaar_customize_ai_history', JSON.stringify(messages.slice(-30)));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleClearHistory = () => {
    if (window.confirm('Clear AI chat history?')) {
      const resetMsg = [
        {
          id: 'welcome-reset',
          sender: 'bot',
          text: `Chat history cleared. How can **Customize** assist your business today?`,
          timestamp: new Date().toISOString(),
          quickActions: [
            { label: '📊 Check Today\'s Sales', query: 'Show today sales summary' },
            { label: '📦 Low Stock Alert', query: 'Which items are low in stock?' }
          ]
        }
      ];
      setMessages(resetMsg);
      localStorage.removeItem('karobaar_customize_ai_history');
    }
  };

  // AI Command & Query Processing Engine
  const handleUserQuery = async (queryText) => {
    const query = (queryText || inputMessage).trim();
    if (!query) return;

    setInputMessage('');
    const userMsgId = 'user-' + Date.now();
    const newMessages = [...messages, {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString()
    }];
    setMessages(newMessages);
    setIsTyping(true);

    const businessId = currentUser?.activeBusinessId || 'demo-business-1';
    const lower = query.toLowerCase();

    // Emulated AI thinking time
    setTimeout(async () => {
      let botResponse = '';
      let botActionData = null;

      try {
        // 1. Sales & Revenue Automation
        if (lower.includes('sale') || lower.includes('revenue') || lower.includes('income') || lower.includes('kamayi') || lower.includes('earning')) {
          const sales = await db.getCollection('sales', businessId);
          const today = new Date().toISOString().split('T')[0];
          const todaySales = sales.filter(s => (s.date || '').startsWith(today));
          const totalRev = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
          const ordersCount = todaySales.length;

          botResponse = `Here is today's sales report for **${currentBusiness?.name || 'your business'}**:\n\n• **Total Revenue:** ₹${totalRev.toFixed(2)}\n• **Transactions:** ${ordersCount} orders\n• **All-Time Recorded Sales:** ${sales.length} orders`;
          botActionData = {
            type: 'metrics',
            title: "Today's Performance",
            metrics: [
              { label: 'Today Revenue', value: `₹${totalRev.toFixed(2)}` },
              { label: 'Total Orders', value: ordersCount },
              { label: 'Lifetime Sales', value: sales.length }
            ],
            cta: { label: 'View Orders Feed', path: '/orders' }
          };
        }

        // 2. Low Stock & Inventory Automation
        else if (lower.includes('stock') || lower.includes('inventory') || lower.includes('maal') || lower.includes('product') && lower.includes('low')) {
          const products = await db.getCollection('products', businessId);
          const lowStock = products.filter(p => (p.stockQuantity || 0) <= 10);

          if (lowStock.length === 0) {
            botResponse = `All your inventory looks healthy! No products currently below threshold (10 units). Total items tracked: ${products.length}.`;
          } else {
            botResponse = `Found **${lowStock.length} items** requiring re-order attention:\n` +
              lowStock.slice(0, 5).map(p => `• **${p.name}**: Only ${p.stockQuantity || 0} units left (₹${p.sellingPrice || p.price || 0})`).join('\n') +
              (lowStock.length > 5 ? `\n...and ${lowStock.length - 5} more items.` : '');
            
            botActionData = {
              type: 'inventory_alert',
              title: 'Low Stock Reorder Guard',
              items: lowStock.slice(0, 4),
              cta: { label: 'Open Inventory', path: '/products' }
            };
          }
        }

        // 3. Theme Toggle Automation
        else if (lower.includes('dark') || lower.includes('light') || lower.includes('theme') || lower.includes('mode') && (lower.includes('change') || lower.includes('toggle') || lower.includes('switch'))) {
          toggleTheme();
          const newTheme = theme === 'light' ? 'Dark' : 'Light';
          botResponse = `Switched theme to **${newTheme} Mode**! Both Black & White high-contrast palettes have been updated.`;
          botActionData = {
            type: 'action_confirmed',
            badge: `${newTheme} Theme Activated`
          };
        }

        // 4. Operating Mode Automation (Legacy vs Premium)
        else if (lower.includes('legacy') || lower.includes('premium')) {
          const target = lower.includes('legacy') ? 'legacy' : 'premium';
          setAppUiVersion(target);
          navigate('/dashboard');
          botResponse = `Switched workspace mode to **${target === 'legacy' ? 'Legacy Operations Desk' : 'Premium Command Center'}**! Navigated to Dashboard.`;
          botActionData = {
            type: 'action_confirmed',
            badge: `${target === 'legacy' ? 'Legacy Desk' : 'Premium Center'} Active`
          };
        }

        // 5. Direct POS Navigation & New Sale
        else if (lower.includes('pos') || lower.includes('billing') || lower.includes('new sale') || lower.includes('register') || lower.includes('counter')) {
          navigate('/pos');
          botResponse = `Opening **POS Register / New Sale Terminal** [F2]! All category filters, held bills, and touch grid are ready.`;
          botActionData = {
            type: 'action_confirmed',
            badge: 'POS Terminal Launched'
          };
        }

        // 6. Customers & Udhaar Khata Automation
        else if (lower.includes('customer') || lower.includes('khata') || lower.includes('udhaar') || lower.includes('dues') || lower.includes('credit')) {
          const customers = await db.getCollection('customers', businessId);
          const withDues = customers.filter(c => (c.outstandingBalance || 0) > 0);
          const totalDues = withDues.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

          botResponse = `You have **${withDues.length} customers** with pending Udhaar/Credit totaling **₹${totalDues.toFixed(2)}**:\n` +
            withDues.slice(0, 4).map(c => `• **${c.name}**: Due ₹${c.outstandingBalance.toFixed(2)} (${c.phone || 'No phone'})`).join('\n') +
            (withDues.length > 4 ? `\n...and ${withDues.length - 4} more customers.` : '');
          
          botActionData = {
            type: 'dues_alert',
            title: 'Udhaar Outstanding Ledger',
            cta: { label: 'View Customer Khata', path: '/customers' }
          };
        }

        // 7. General Settings & Configuration
        else if (lower.includes('setting') || lower.includes('config') || lower.includes('backup') || lower.includes('role') || lower.includes('password')) {
          navigate('/settings');
          botResponse = `Taking you to **Settings & Workspace** where you can configure Business Profile, Preferences, Features & Modules, and Customize AI rules.`;
        }

        // 8. General AI Business Consulting & Assistance
        else {
          botResponse = `I have analyzed your request: "${query}".\n\nI can automate operations for you: check sales, audit low stock, add custom products, launch POS billing, switch to Legacy or Premium modes, or track customer dues.\n\nTry clicking any of the quick automation shortcuts below!`;
        }
      } catch (err) {
        console.error('AI Error:', err);
        botResponse = `I ran into an issue automating that request. Please verify connection or try a direct command like "Show sales" or "Check stock".`;
      }

      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toISOString(),
        actionData: botActionData,
        quickActions: [
          { label: '📊 Sales Report', query: 'Show today sales summary' },
          { label: '⚠️ Low Stock', query: 'Which items are low in stock?' },
          { label: '⚡ Legacy Mode', query: 'Switch to legacy operations desk' },
          { label: '🛒 Open POS', query: 'Open POS register' }
        ]
      }]);
    }, 450);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserQuery();
    }
  };

  return (
    <>
      {/* Floating Launcher Bubble (Strictly Monochrome) */}
      {aiSettings.showFloatingBubble && !isOpen && (
        <button 
          className="customize-ai-floating-trigger"
          onClick={() => setIsOpen(true)}
          title="Open Customize AI Automator"
        >
          <Sparkles size={18} className="customize-sparkle-icon" />
          <span className="customize-trigger-text">Customize AI</span>
        </button>
      )}

      {/* AI Assistant Drawer Window */}
      {isOpen && (
        <div className="customize-ai-drawer-overlay" onClick={() => setIsOpen(false)}>
          <div className="customize-ai-panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="customize-ai-header">
              <div className="customize-ai-header-left">
                <div className="customize-ai-avatar">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="customize-ai-title-row">
                    <h3 className="customize-ai-title">{aiSettings.assistantName || 'Customize'}</h3>
                    <span className="customize-ai-badge">AI Automator</span>
                  </div>
                  <p className="customize-ai-status">● Live • Ready to automate</p>
                </div>
              </div>

              <div className="customize-ai-header-actions">
                <button 
                  onClick={handleClearHistory} 
                  className="customize-ai-icon-btn"
                  title="Clear conversation"
                >
                  <Trash2 size={15} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="customize-ai-icon-btn"
                  title="Close AI window"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="customize-ai-messages custom-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`customize-ai-message-row ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                  {msg.sender === 'bot' && (
                    <div className="customize-ai-bot-icon">
                      <Bot size={14} />
                    </div>
                  )}

                  <div className="customize-ai-bubble-wrap">
                    <div className={`customize-ai-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                      <div className="customize-ai-bubble-text">
                        {msg.text.split('\n').map((line, idx) => (
                          <p key={idx} style={{ margin: '0 0 4px 0' }}>
                            {line.startsWith('• ') ? (
                              <span style={{ display: 'inline-block', marginLeft: '6px' }}>{line}</span>
                            ) : line}
                          </p>
                        ))}
                      </div>

                      {/* Interactive Action Card */}
                      {msg.actionData && (
                        <div className="customize-ai-action-card">
                          {msg.actionData.badge && (
                            <div className="customize-ai-action-badge">
                              <CheckCircle2 size={13} />
                              <span>{msg.actionData.badge}</span>
                            </div>
                          )}

                          {msg.actionData.metrics && (
                            <div className="customize-ai-metrics-grid">
                              {msg.actionData.metrics.map((m, i) => (
                                <div key={i} className="customize-ai-metric-item">
                                  <span className="metric-label">{m.label}</span>
                                  <span className="metric-value">{m.value}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {msg.actionData.items && (
                            <div className="customize-ai-items-list">
                              {msg.actionData.items.map(it => (
                                <div key={it.id} className="customize-ai-item-row">
                                  <span>{it.name}</span>
                                  <span className="stock-alert">{it.stockQuantity} left</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {msg.actionData.cta && (
                            <button 
                              className="customize-ai-cta-btn"
                              onClick={() => {
                                setIsOpen(false);
                                navigate(msg.actionData.cta.path);
                              }}
                            >
                              <span>{msg.actionData.cta.label}</span>
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Suggestion Chips */}
                    {msg.quickActions && (
                      <div className="customize-ai-chips-wrap">
                        {msg.quickActions.map((qa, i) => (
                          <button 
                            key={i} 
                            className="customize-ai-chip"
                            onClick={() => handleUserQuery(qa.query)}
                          >
                            {qa.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="customize-ai-message-row bot">
                  <div className="customize-ai-bot-icon">
                    <Bot size={14} />
                  </div>
                  <div className="customize-ai-bubble bot-bubble">
                    <div className="customize-ai-typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="customize-ai-input-bar">
              <input 
                type="text"
                placeholder="Ask Customize AI or automate an action..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="customize-ai-input"
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => handleUserQuery()}
                disabled={!inputMessage.trim() || isTyping}
                className="customize-ai-send-btn"
                title="Send instruction"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
