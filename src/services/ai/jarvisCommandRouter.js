/**
 * JarvisCommandRouter
 * Central Command Engine for Project Karobaar
 *
 * Implements approved application function routing across all 10 core command categories:
 * A. Navigation Commands ("take me to...", "go to...", "open...")
 * B. Sales & POS Commands
 * C. Inventory Commands
 * D. Financial Intelligence Commands
 * E. Customer & Supplier Commands
 * F. Invoice Commands
 * G. Staff & Attendance Commands
 * H. Business Intelligence & 5-Part Recommendations
 * I. Workspace & Appearance Settings Commands (Instant opposite theme toggle)
 * J. General Assistant & Control Commands (Mute / Unmute / Stop / Animation toggles)
 */

import { aiService } from './aiService.js';
import { db } from '../databaseService.js';
import { localDb } from '../localDb.js';
import { jarvisSpeechService } from './jarvisSpeechService.js';
import { processJarvisQuery } from '../../components/AI/jarvisEngine.js';

export class JarvisCommandRouter {
  constructor() {
    this.history = [];
  }

  /**
   * Universal Command Dispatcher
   * @param {string} rawQuery - The natural language voice or text prompt
   * @param {object} context - Execution context: { user, workspace, navigate, toggleTheme, currentTheme, activeRoute, setVoiceOutput, setShowAnimation }
   * @returns {Promise<object>} Command response: { text, actionTaken, requiresConfirmation, payload, state }
   */
  async routeCommand(rawQuery, context = {}) {
    const query = String(rawQuery || '').trim();
    if (!query) return { text: "I'm ready. What would you like to do?", state: 'idle' };

    const lower = query.toLowerCase().replace(/[.,!?;:]/g, '').trim();
    const { user, workspace, navigate, toggleTheme, currentTheme } = context;
    const bizId = workspace?.id || 'demo-business-1';
    const userRole = user?.role || 'Owner';

    // ==============================================================
    // CATEGORY J: AUDIO MUTE & UNMUTE COMMANDS
    // ==============================================================
    if (
      lower === 'mute' || 
      lower === 'mute jarvis' || 
      lower === 'silence' || 
      lower === 'be quiet' || 
      lower === 'stop talking' || 
      lower === 'shut up' ||
      lower.includes('mute voice') ||
      lower.includes('turn off voice')
    ) {
      jarvisSpeechService.stop();
      jarvisSpeechService.voiceEnabled = false;
      try {
        localStorage.setItem('karobaar_jarvis_voice_output', 'false');
      } catch (_) {}
      if (context.setVoiceOutput) context.setVoiceOutput(false);

      return {
        text: "Jarvis is now muted. Voice responses have been turned off.",
        actionTaken: 'MUTE_VOICE',
        state: 'idle'
      };
    }

    if (
      lower === 'unmute' || 
      lower === 'unmute jarvis' || 
      lower.includes('turn on voice') || 
      lower.includes('enable voice') ||
      lower === 'speak'
    ) {
      jarvisSpeechService.voiceEnabled = true;
      try {
        localStorage.setItem('karobaar_jarvis_voice_output', 'true');
      } catch (_) {}
      if (context.setVoiceOutput) context.setVoiceOutput(true);

      return {
        text: "Voice responses have been unmuted and enabled.",
        actionTaken: 'UNMUTE_VOICE',
        state: 'idle'
      };
    }

    // ==============================================================
    // ANIMATION ON / OFF (Talk without animation)
    // ==============================================================
    if (
      lower.includes('hide animation') || 
      lower.includes('turn off animation') || 
      lower.includes('disable animation') ||
      lower.includes('without animation') ||
      lower === 'text only'
    ) {
      if (context.setShowAnimation) context.setShowAnimation(false);
      try {
        localStorage.setItem('karobaar_jarvis_show_animation', 'false');
      } catch (_) {}
      return {
        text: "AI visualizer hidden. You can now chat in clean, text-only mode.",
        actionTaken: 'TOGGLE_ANIMATION',
        state: 'idle'
      };
    }

    if (
      lower.includes('show animation') || 
      lower.includes('turn on animation') || 
      lower.includes('enable animation') ||
      lower.includes('with animation')
    ) {
      if (context.setShowAnimation) context.setShowAnimation(true);
      try {
        localStorage.setItem('karobaar_jarvis_show_animation', 'true');
      } catch (_) {}
      return {
        text: "AI animation visualizer enabled.",
        actionTaken: 'TOGGLE_ANIMATION',
        state: 'idle'
      };
    }

    // ==============================================================
    // GENERAL CONTROL COMMANDS (Stop / Cancel / Help)
    // ==============================================================
    if (lower === 'stop' || lower === 'cancel' || lower === 'abort' || lower === 'never mind') {
      jarvisSpeechService.stop();
      return {
        text: "Operation stopped. Standing by.",
        actionTaken: 'CANCEL_OPERATION',
        state: 'idle'
      };
    }

    if (
      lower.includes('what can you do') || 
      lower.includes('what can jarvis do') || 
      lower === 'help' || 
      lower.includes('show commands')
    ) {
      return this._handleHelpCommand(userRole);
    }

    // ==============================================================
    // CATEGORY I: SETTINGS & APPEARANCE (Always toggle to opposite)
    // ==============================================================
    if (
      !lower.includes('business') && !lower.includes('store') && !lower.includes('branch') &&
      (
        lower === 'switch' ||
        lower.startsWith('switch ') ||
        lower.includes('switch theme') ||
        lower.includes('switch mode') ||
        lower.includes('switch display') ||
        lower.includes('switch colour') ||
        lower.includes('switch color') ||
        lower.includes('toggle theme') ||
        lower.includes('toggle mode') ||
        lower.includes('toggle display') ||
        lower.includes('change theme') ||
        lower.includes('change mode') ||
        lower.includes('dark mode') || 
        lower.includes('light mode') ||
        lower.includes('dark theme') ||
        lower.includes('light theme')
      )
    ) {
      return this._handleThemeToggle(lower, currentTheme, toggleTheme);
    }

    // ==============================================================
    // CATEGORY A: NAVIGATION COMMANDS ("Take me to...", "Open...", "Go to...")
    // ==============================================================
    const navMatch = this._matchNavigationCommand(lower);
    if (navMatch && navigate) {
      navigate(navMatch.path);
      return {
        text: `Navigating to ${navMatch.label}.`,
        actionTaken: 'NAVIGATE',
        destination: navMatch.path,
        state: 'success'
      };
    }

    // ==============================================================
    // CATEGORY B: FAST POS COMMANDS (Counter Speed)
    // ==============================================================
    const posAction = this._matchPOSCommand(lower, bizId);
    if (posAction) {
      return posAction;
    }

    // ==============================================================
    // ADVANCED AI ENGINE ROUTING (Categories B, C, D, E, F, G, H)
    // ==============================================================
    try {
      const aiResponse = await aiService.chatWithGemini(query, {
        user,
        workspace,
        conversationId: 'jarvis-master-session'
      });

      return {
        text: aiResponse.text,
        requiresConfirmation: aiResponse.requiresConfirmation || false,
        pendingAction: aiResponse.pendingAction || null,
        toolCalls: aiResponse.toolCalls || [],
        actionTaken: aiResponse.actionTaken || null,
        state: aiResponse.requiresConfirmation ? 'awaiting_confirmation' : 'success'
      };
    } catch (err) {
      console.warn('[JarvisCommandRouter] Remote AI fallback to local engine:', err);
      try {
        const localResult = await processJarvisQuery(query, {
          db,
          businessId: bizId,
          currentBusiness: workspace,
          currentUser: user,
          navigate,
          theme: currentTheme,
          toggleTheme
        });
        return {
          text: localResult.replyText || localResult.spokenText || "I've checked your store data and handled your request.",
          actionTaken: localResult.actionData?.type || null,
          toolCalls: [],
          requiresConfirmation: false,
          state: 'success'
        };
      } catch (localErr) {
        return {
          text: `I'm ready to assist with your store. You can ask about today's sales, stock levels, khata balances, or open POS.`,
          state: 'idle'
        };
      }
    }
  }

  // --- Helpers: Navigation Matcher ---
  _matchNavigationCommand(lower) {
    // POS / Billing
    if (
      lower.includes('open pos') || lower.includes('go to pos') || lower.includes('take me to pos') ||
      lower.includes('billing') || lower.includes('counter') || lower.includes('new sale')
    ) {
      return { path: '/pos', label: 'Point of Sale (POS)' };
    }

    // Dashboard
    if (
      lower.includes('open dashboard') || lower.includes('go to dashboard') || lower.includes('take me to dashboard') ||
      lower.includes('home screen') || lower === 'dashboard'
    ) {
      return { path: '/dashboard', label: 'Store Dashboard' };
    }

    // Tasks
    if (
      lower.includes('tasks') || lower.includes('task management') || lower.includes('to do') ||
      lower.includes('take me to tasks') || lower.includes('open tasks')
    ) {
      return { path: '/tasks', label: 'Task Management' };
    }

    // Inventory & Stock
    if (
      lower.includes('open inventory') || lower.includes('go to inventory') || lower.includes('take me to inventory') ||
      lower.includes('stock') || lower.includes('products') || lower.includes('catalog')
    ) {
      return { path: '/inventory', label: 'Inventory & Stock' };
    }

    // Customers / Khata
    if (
      lower.includes('open customers') || lower.includes('go to customers') || lower.includes('take me to customers') ||
      lower.includes('khata') || lower.includes('customer list') || lower.includes('udhaar')
    ) {
      return { path: '/customers', label: 'Customer Khata' };
    }

    // Reports & Analytics
    if (
      lower.includes('open reports') || lower.includes('go to reports') || lower.includes('take me to reports') ||
      lower.includes('analytics') || lower.includes('p&l') || lower.includes('profit and loss')
    ) {
      return { path: '/reports', label: 'Financial Reports' };
    }

    // Invoices
    if (
      lower.includes('open invoices') || lower.includes('go to invoices') || lower.includes('take me to invoices') ||
      lower.includes('invoice list')
    ) {
      return { path: '/invoices', label: 'Invoices' };
    }

    // Settings
    if (
      lower.includes('open settings') || lower.includes('go to settings') || lower.includes('take me to settings')
    ) {
      return { path: '/settings', label: 'Workspace Settings' };
    }

    // Team & Staff
    if (
      lower.includes('team management') || lower.includes('manage staff') || lower.includes('open team') ||
      lower.includes('take me to team') || lower.includes('employees')
    ) {
      return { path: '/settings?tab=team', label: 'Team Management' };
    }

    // Expenses & Finance
    if (
      lower.includes('open expenses') || lower.includes('go to expenses') || lower.includes('take me to expenses') ||
      lower.includes('finance') || lower.includes('banking')
    ) {
      return { path: '/finance', label: 'Finance & Banking' };
    }

    // Purchases & Suppliers
    if (
      lower.includes('open purchases') || lower.includes('take me to purchases') || 
      lower.includes('suppliers') || lower.includes('take me to suppliers')
    ) {
      return { path: '/purchases', label: 'Suppliers & Purchases' };
    }

    // Attendance
    if (
      lower.includes('attendance') || lower.includes('clock in') || lower.includes('take me to attendance')
    ) {
      return { path: '/attendance', label: 'Staff Attendance' };
    }

    // Website / Landing
    if (
      lower.includes('website') || lower.includes('landing') || lower.includes('take me to website') ||
      lower.includes('marketing page')
    ) {
      return { path: '/home', label: 'Official Website' };
    }

    return null;
  }

  // --- Helpers: Fast POS Matcher ---
  _matchPOSCommand(lower, bizId) {
    if (lower === 'clear cart' || lower === 'empty cart') {
      window.dispatchEvent(new CustomEvent('karobaar_pos_clear_cart'));
      return {
        text: "Cleared current POS register cart.",
        actionTaken: 'POS_CLEAR_CART',
        state: 'success'
      };
    }

    const discountMatch = lower.match(/(?:apply|give|set)\s*(\d+)%?\s*discount/);
    if (discountMatch) {
      const pct = parseInt(discountMatch[1], 10);
      window.dispatchEvent(new CustomEvent('karobaar_pos_apply_discount', { detail: { percentage: pct } }));
      return {
        text: `Applied ${pct}% discount to the current order.`,
        actionTaken: 'POS_APPLY_DISCOUNT',
        payload: { percentage: pct },
        state: 'success'
      };
    }

    if (lower.includes('pay with cash') || lower.includes('cash payment')) {
      window.dispatchEvent(new CustomEvent('karobaar_pos_select_payment', { detail: { method: 'CASH' } }));
      return {
        text: "Selected Cash payment tender.",
        actionTaken: 'POS_SET_PAYMENT',
        state: 'success'
      };
    }

    if (lower.includes('pay with upi') || lower.includes('upi payment') || lower.includes('qr payment')) {
      window.dispatchEvent(new CustomEvent('karobaar_pos_select_payment', { detail: { method: 'UPI' } }));
      return {
        text: "Opened UPI QR payment dialog.",
        actionTaken: 'POS_SET_PAYMENT',
        state: 'success'
      };
    }

    return null;
  }

  // --- Helpers: Mode Toggle (ALWAYS SWITCH TO THE OPPOSITE COLOR) ---
  _handleThemeToggle(lower, currentTheme, toggleTheme) {
    if (typeof document === 'undefined') {
      return { text: "Theme toggling is only available in browser mode.", state: 'idle' };
    }

    const html = document.documentElement;
    // Live DOM check for ground truth
    const isDomDark = html.getAttribute('data-theme') === 'dark' || 
                      html.classList.contains('dark') || 
                      currentTheme === 'dark';

    // The user requested: "when i say switch change the theme to the oppsite colour like when it is black change it to white and when it is white change it ti dark"
    let nextTheme;

    if (lower.includes('light') && !lower.includes('dark')) {
      // If user asks for light and already in light -> flip to dark if command is "switch"; else ensure light
      nextTheme = isDomDark ? 'light' : (lower.includes('switch') ? 'dark' : 'light');
    } else if (lower.includes('dark') && !lower.includes('light')) {
      // If user asks for dark and already in dark -> flip to light if command is "switch"; else ensure dark
      nextTheme = !isDomDark ? 'dark' : (lower.includes('switch') ? 'light' : 'dark');
    } else {
      // Any generic "switch", "switch mode", "toggle", etc. -> ALWAYS flip to opposite color
      nextTheme = isDomDark ? 'light' : 'dark';
    }

    // Apply directly to the DOM immediately
    html.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    try {
      localStorage.setItem('karobaar_theme', nextTheme);
    } catch (_) {}

    if (toggleTheme) {
      toggleTheme(nextTheme);
    }

    window.dispatchEvent(new CustomEvent('karobaar_theme_changed', { detail: { theme: nextTheme } }));

    const targetLabel = nextTheme === 'dark' ? 'Dark' : 'Light';
    return {
      text: `Switched display mode to ${targetLabel}.`,
      state: 'success',
      actionTaken: 'TOGGLE_THEME',
      newTheme: nextTheme
    };
  }

  // --- Helpers: Help Capabilities Matrix ---
  _handleHelpCommand(userRole) {
    const isStaff = userRole === 'Staff' || userRole === 'Cashier';
    const lines = [
      "Here are the live commands and functions you can execute right now:",
      "• **Navigation:** 'Take me to inventory', 'Open POS', 'Show tasks', 'Go to reports', 'Open settings'",
      "• **Controls:** 'Switch' (flips between Dark and Light mode), 'Mute' (turns off voice), 'Hide animation' (talk without animation)",
      "• **POS Counter:** 'Start a new sale', 'Apply 10% discount', 'Pay with UPI', 'Pay with Cash'",
      "• **Inventory:** 'Which products are running low?', 'Search products [name]', 'Stock audit'",
      "• **Customer Khata:** 'Who owes me money?', 'Customer balances', 'Search customer [name]'"
    ];

    if (!isStaff) {
      lines.push("• **Financial Intelligence:** 'Today's sales', 'This month's expenses', 'Calculate gross profit', 'Store health audit'");
      lines.push("• **Executive Strategy:** 'Give me business recommendations', 'Compare sales trends'");
    }

    return {
      text: lines.join('\n'),
      state: 'idle'
    };
  }
}

export const jarvisCommandRouter = new JarvisCommandRouter();
