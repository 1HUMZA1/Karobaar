/**
 * JarvisCommandRouter
 * Central Command Engine for Project Karobaar
 *
 * Implements approved application function routing across all 10 core command categories:
 * A. Navigation Commands
 * B. Sales & POS Commands
 * C. Inventory Commands
 * D. Financial Intelligence Commands
 * E. Customer & Supplier Commands
 * F. Invoice Commands
 * G. Staff & Attendance Commands
 * H. Business Intelligence & 5-Part Recommendations
 * I. Workspace & Appearance Settings Commands
 * J. General Assistant & Control Commands
 */

import { aiService } from './aiService.js';
import { db } from '../databaseService.js';
import { localDb } from '../localDb.js';

export class JarvisCommandRouter {
  constructor() {
    this.history = [];
  }

  /**
   * Universal Command Dispatcher
   * @param {string} rawQuery - The natural language voice or text prompt
   * @param {object} context - Execution context: { user, workspace, navigate, toggleTheme, currentTheme, activeRoute }
   * @returns {Promise<object>} Command response: { text, actionTaken, requiresConfirmation, payload, state }
   */
  async routeCommand(rawQuery, context = {}) {
    const query = String(rawQuery || '').trim();
    if (!query) return { text: "I'm ready. What would you like to do?", state: 'idle' };

    const lower = query.toLowerCase();
    const { user, workspace, navigate, toggleTheme, currentTheme } = context;
    const bizId = workspace?.id || 'demo-business-1';
    const userRole = user?.role || 'Owner';

    // ==============================================================
    // CATEGORY J: GENERAL CONTROL COMMANDS (Stop / Cancel / Help)
    // ==============================================================
    if (lower === 'stop' || lower === 'cancel' || lower === 'abort' || lower === 'never mind') {
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
    // CATEGORY I: SETTINGS & APPEARANCE (Mode toggling)
    // ==============================================================
    if (
      lower.includes('dark mode') || 
      lower.includes('light mode') || 
      lower.includes('switch mode') || 
      lower.includes('toggle mode') ||
      lower.includes('toggle theme')
    ) {
      return this._handleThemeToggle(lower, currentTheme, toggleTheme);
    }

    // ==============================================================
    // CATEGORY A: NAVIGATION COMMANDS
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
    // Runs through Gemini SDK with registered tools, RBAC, deterministic math & confirmation
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
      console.error('[JarvisCommandRouter] AI dispatch failed, falling back:', err);
      return {
        text: `I encountered an issue processing that: ${err.message}. Please try again or rephrase.`,
        state: 'error'
      };
    }
  }

  // --- Helpers: Navigation Matcher ---
  _matchNavigationCommand(lower) {
    if (lower.includes('open pos') || lower.includes('go to pos') || lower.includes('billing counter')) {
      return { path: '/pos', label: 'Point of Sale (POS)' };
    }
    if (lower.includes('open dashboard') || lower.includes('go to dashboard') || lower.includes('home screen')) {
      return { path: '/dashboard', label: 'Store Dashboard' };
    }
    if (lower.includes('open inventory') || lower.includes('go to stock') || lower.includes('view products') || lower.includes('catalog')) {
      return { path: '/inventory', label: 'Inventory & Stock' };
    }
    if (lower.includes('open customers') || lower.includes('go to customers') || lower.includes('khata') || lower.includes('customer list')) {
      return { path: '/customers', label: 'Customer Khata' };
    }
    if (lower.includes('open reports') || lower.includes('go to reports') || lower.includes('analytics') || lower.includes('p&l')) {
      return { path: '/reports', label: 'Financial Reports' };
    }
    if (lower.includes('open settings') || lower.includes('go to settings')) {
      return { path: '/settings', label: 'Workspace Settings' };
    }
    if (lower.includes('team management') || lower.includes('manage staff') || lower.includes('open team')) {
      return { path: '/settings?tab=team', label: 'Team Management' };
    }
    if (lower.includes('open expenses') || lower.includes('finance') || lower.includes('banking')) {
      return { path: '/finance', label: 'Finance & Banking' };
    }
    if (lower.includes('open purchases') || lower.includes('suppliers')) {
      return { path: '/purchases', label: 'Suppliers & Purchases' };
    }
    if (lower.includes('attendance') || lower.includes('clock in')) {
      return { path: '/attendance', label: 'Staff Attendance' };
    }
    return null;
  }

  // --- Helpers: Fast POS Matcher ---
  _matchPOSCommand(lower, bizId) {
    if (lower.includes('start a new sale') || lower.includes('new sale') || lower.includes('clear cart')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('karobaar_pos_new_sale'));
      }
      return {
        text: "Started a fresh sale register at the POS counter.",
        actionTaken: 'POS_NEW_SALE',
        state: 'success'
      };
    }

    // Apply Discount Regex: "apply 10% discount" or "give 5 percent discount"
    const discountMatch = lower.match(/apply\s+(\d+(\.\d+)?)\s*%\s*discount|give\s+(\d+(\.\d+)?)\s*percent\s*discount/);
    if (discountMatch) {
      const percent = parseFloat(discountMatch[1] || discountMatch[3]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('karobaar_pos_apply_discount', { detail: { percent } }));
      }
      return {
        text: `Applied ${percent}% discount to the current order.`,
        actionTaken: 'POS_APPLY_DISCOUNT',
        payload: { percent },
        state: 'success'
      };
    }

    // Quick Payment Method: "pay with upi", "pay with cash", "pay with card"
    if (lower.includes('pay with upi') || lower.includes('pay via qr') || lower.includes('gpay')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('karobaar_pos_set_payment_method', { detail: { method: 'upi' } }));
      }
      return {
        text: "Set checkout payment method to UPI / QR Code.",
        actionTaken: 'POS_SET_PAYMENT',
        state: 'success'
      };
    }
    if (lower.includes('pay with cash')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('karobaar_pos_set_payment_method', { detail: { method: 'cash' } }));
      }
      return {
        text: "Set checkout payment method to Cash.",
        actionTaken: 'POS_SET_PAYMENT',
        state: 'success'
      };
    }

    return null;
  }

  // --- Helpers: Mode Toggle ---
  _handleThemeToggle(lower, currentTheme, toggleTheme) {
    const isDark = currentTheme === 'dark';

    if (lower.includes('switch to dark') || lower.includes('turn on dark')) {
      if (isDark) {
        return { text: "Dark mode is already active.", state: 'idle' };
      }
      if (toggleTheme) toggleTheme();
      return { text: "Switched to Dark mode.", state: 'success', actionTaken: 'TOGGLE_THEME' };
    }

    if (lower.includes('switch to light') || lower.includes('turn on light')) {
      if (!isDark) {
        return { text: "Light mode is already active.", state: 'idle' };
      }
      if (toggleTheme) toggleTheme();
      return { text: "Switched to Light mode.", state: 'success', actionTaken: 'TOGGLE_THEME' };
    }

    // Default toggle
    if (toggleTheme) toggleTheme();
    const target = isDark ? 'Light' : 'Dark';
    return {
      text: `Switched display mode to ${target}.`,
      state: 'success',
      actionTaken: 'TOGGLE_THEME'
    };
  }

  // --- Helpers: Help Capabilities Matrix ---
  _handleHelpCommand(userRole) {
    const isStaff = userRole === 'Staff' || userRole === 'Cashier';
    const lines = [
      "Here are the live commands and functions you can execute right now:",
      "• **Navigation:** 'Open POS', 'Go to inventory', 'Show reports', 'Open settings', 'Team management'",
      "• **POS Counter:** 'Start a new sale', 'Apply 10% discount', 'Pay with UPI', 'Pay with Cash'",
      "• **Inventory:** 'Which products are running low?', 'Search products [name]', 'Stock audit'",
      "• **Customer Khata:** 'Who owes me money?', 'Customer balances', 'Search customer [name]'"
    ];

    if (!isStaff) {
      lines.push("• **Financial Intelligence:** 'Today's sales', 'This month's expenses', 'Calculate gross profit', 'Store health audit'");
      lines.push("• **Executive Strategy:** 'Give me business recommendations', 'Compare sales trends'");
    }

    lines.push("• **Voice & Controls:** 'Switch to dark/light mode', 'Stop', 'What can Jarvis do?'");

    return {
      text: lines.join('\n'),
      state: 'idle'
    };
  }
}

export const jarvisCommandRouter = new JarvisCommandRouter();
