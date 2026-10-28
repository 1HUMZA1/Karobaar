/**
 * Karobaar AI Settings Service
 * Manages configurable AI preferences, model choices, response styles, and confirmation policies.
 * Persists reliably to localStorage and synced business database.
 */

import { localDb } from '../localDb.js';
import { db } from '../databaseService.js';

const SETTINGS_KEY = 'karobaar_ai_settings_v2';

const memoryStore = new Map();
const safeStorage = {
  getItem: (key) => typeof localStorage !== 'undefined' ? localStorage.getItem(key) : (memoryStore.get(key) || null),
  setItem: (key, val) => typeof localStorage !== 'undefined' ? localStorage.setItem(key, String(val)) : memoryStore.set(key, String(val)),
  removeItem: (key) => typeof localStorage !== 'undefined' ? localStorage.removeItem(key) : memoryStore.delete(key)
};

export const DEFAULT_AI_SETTINGS = {
  aiEnabled: true,
  model: 'gemini-2.5-flash',
  provider: 'gemini',
  responseStyle: 'balanced', // 'concise' | 'balanced' | 'detailed'
  autoExecuteSafe: true,
  confirmSensitive: true,
  enableStockoutAlerts: true,
  enableSalesComparisons: true,
  enableExpenseAnomalyAlerts: true,
  customApiKey: '',
  telemetryEnabled: true
};

class AiSettingsService {
  /**
   * Load AI settings with fallbacks
   */
  getSettings(businessId = 'demo-business-1') {
    try {
      const local = safeStorage.getItem(SETTINGS_KEY);
      const parsedLocal = local ? JSON.parse(local) : {};

      // Also check business settings from database
      const businesses = localDb.getAll('businesses') || [];
      const currentBiz = businesses.find(b => b.id === businessId);
      const dbSettings = currentBiz?.settings?.aiSettings || {};

      return {
        ...DEFAULT_AI_SETTINGS,
        ...dbSettings,
        ...parsedLocal
      };
    } catch (e) {
      console.warn('Error reading AI settings:', e);
      return { ...DEFAULT_AI_SETTINGS };
    }
  }

  /**
   * Save AI settings to localStorage and business database
   */
  async saveSettings(businessId = 'demo-business-1', newSettings = {}) {
    const current = this.getSettings(businessId);
    const merged = { ...current, ...newSettings };

    // 1. Save to storage
    try {
      safeStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn('Failed to write AI settings to storage:', e);
    }

    // 2. Persist to business database
    try {
      const businesses = localDb.getAll('businesses') || [];
      const currentBiz = businesses.find(b => b.id === businessId);
      if (currentBiz) {
        const updatedBiz = {
          ...currentBiz,
          settings: {
            ...(currentBiz.settings || {}),
            aiSettings: merged
          }
        };
        localDb.save('businesses', updatedBiz);
        db.update('businesses', businessId, {
          settings: updatedBiz.settings
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to sync AI settings to database:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('karobaar_ai_settings_changed', { detail: merged }));
    }

    return merged;
  }
}

export const aiSettingsService = new AiSettingsService();
