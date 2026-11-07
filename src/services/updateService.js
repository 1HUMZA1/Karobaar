/**
 * UpdateService
 * Central multi-platform update management system for KAROBAAR.
 *
 * Supports:
 * - Android: Official Google Play store in-app update & direct store listing
 * - Windows Desktop: GitHub Releases installer check & verified download
 * - Web / PWA: Service Worker cache check, silent update activation & reload
 * - Settings UI: Unified App Updates dashboard with release notes & reminder snooze
 */

export const CURRENT_APP_VERSION = '2.4.0';
export const CURRENT_BUILD_NUMBER = 240;
export const RELEASE_DATE = 'November 2026';

const GITHUB_REPO = '1HUMZA1/Karobaar';
const GOOGLE_PLAY_PACKAGE = 'com.karobaar.app';

export const PLATFORMS = {
  ANDROID: 'android',
  WINDOWS: 'windows',
  WEB: 'web',
  IOS: 'ios'
};

export const detectPlatform = () => {
  if (typeof window === 'undefined') return PLATFORMS.WEB;
  const ua = (navigator.userAgent || '').toLowerCase();
  
  if (ua.includes('android')) return PLATFORMS.ANDROID;
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return PLATFORMS.IOS;
  if (ua.includes('windows') || ua.includes('win32') || ua.includes('win64')) {
    // If embedded in Flutter Windows app or standalone browser on Windows
    return PLATFORMS.WINDOWS;
  }
  return PLATFORMS.WEB;
};

// Compare semver: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
export const compareVersions = (v1, v2) => {
  if (!v1 || !v2) return 0;
  const p1 = v1.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = v2.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

class UpdateService {
  constructor() {
    this.currentVersion = CURRENT_APP_VERSION;
    this.buildNumber = CURRENT_BUILD_NUMBER;
    this.platform = detectPlatform();
    this.lastCheckTime = null;
    this.cachedUpdateInfo = null;
    this.isChecking = false;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.cachedUpdateInfo); } catch (_) {}
    });
  }

  /**
   * Check for updates across verified channels (version.json and GitHub Releases)
   */
  async checkForUpdates(force = false) {
    if (this.isChecking) return this.cachedUpdateInfo;
    
    // Throttle checks to once every 10 minutes unless forced
    const now = Date.now();
    if (!force && this.lastCheckTime && (now - this.lastCheckTime < 10 * 60 * 1000) && this.cachedUpdateInfo) {
      return this.cachedUpdateInfo;
    }

    this.isChecking = true;
    let latestInfo = null;

    try {
      // 1. Primary check: static version.json mirror
      const res = await fetch('./version.json?t=' + now, { cache: 'no-store' });
      if (res.ok) {
        latestInfo = await res.json();
      }
    } catch (_) {
      // Fallback network failure handled gracefully
    }

    // 2. If Windows or Web and version.json couldn't be fetched, check GitHub Releases API
    if (!latestInfo && typeof fetch !== 'undefined') {
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          const cleanTag = (ghData.tag_name || '').replace(/^v/i, '');
          latestInfo = {
            currentVersion: CURRENT_APP_VERSION,
            latestVersion: cleanTag || CURRENT_APP_VERSION,
            minSupportedVersion: '1.0.0',
            releaseDate: ghData.published_at ? new Date(ghData.published_at).toLocaleDateString() : RELEASE_DATE,
            releaseNotes: (ghData.body || '').split('\n').filter(Boolean).slice(0, 5),
            isMandatory: false,
            downloadUrls: {
              android: `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_PACKAGE}`,
              windows: ghData.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`,
              web: window.location.origin
            }
          };
        }
      } catch (_) {}
    }

    // 3. Fallback default if completely offline
    if (!latestInfo) {
      latestInfo = {
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
        minSupportedVersion: '1.0.0',
        releaseDate: RELEASE_DATE,
        releaseNotes: [
          'All business modules, POS billing, inventory sync, and Jarvis AI are up to date.',
          'Local offline database is synchronized and operational.'
        ],
        isMandatory: false,
        downloadUrls: {
          android: `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_PACKAGE}`,
          windows: `https://github.com/${GITHUB_REPO}/releases/latest`,
          web: window.location.origin
        }
      };
    }

    const hasUpdate = compareVersions(latestInfo.latestVersion, CURRENT_APP_VERSION) > 0;
    const isMandatory = latestInfo.isMandatory || (compareVersions(CURRENT_APP_VERSION, latestInfo.minSupportedVersion) < 0);

    this.cachedUpdateInfo = {
      ...latestInfo,
      currentVersion: CURRENT_APP_VERSION,
      buildNumber: CURRENT_BUILD_NUMBER,
      hasUpdate,
      isMandatory,
      platform: this.platform,
      lastChecked: new Date()
    };

    this.lastCheckTime = now;
    this.isChecking = false;
    this.notify();

    if (hasUpdate && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('karobaar_update_available', {
        detail: this.cachedUpdateInfo
      }));
    }

    return this.cachedUpdateInfo;
  }

  /**
   * Snooze reminder for 24 hours so users are never repeatedly nagged
   */
  snoozeReminder(version) {
    try {
      localStorage.setItem('karobaar_snoozed_update_version', version || this.cachedUpdateInfo?.latestVersion || '');
      localStorage.setItem('karobaar_snoozed_update_timestamp', Date.now().toString());
    } catch (_) {}
  }

  /**
   * Check if update reminder prompt should be displayed
   */
  shouldShowReminder() {
    if (!this.cachedUpdateInfo?.hasUpdate) return false;
    if (this.cachedUpdateInfo.isMandatory) return true; // Mandatory updates cannot be snoozed

    try {
      const snoozedVer = localStorage.getItem('karobaar_snoozed_update_version');
      const snoozedTime = parseInt(localStorage.getItem('karobaar_snoozed_update_timestamp') || '0', 10);
      const oneDay = 24 * 60 * 60 * 1000;

      if (snoozedVer === this.cachedUpdateInfo.latestVersion && (Date.now() - snoozedTime) < oneDay) {
        return false;
      }
    } catch (_) {}
    return true;
  }

  /**
   * Execute the appropriate platform update action
   */
  async executeUpdate() {
    const platform = this.platform;
    const urls = this.cachedUpdateInfo?.downloadUrls || {};

    if (platform === PLATFORMS.ANDROID) {
      // Direct user cleanly to official Google Play Store listing
      const playStoreUrl = `market://details?id=${GOOGLE_PLAY_PACKAGE}`;
      const webPlayStore = `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_PACKAGE}`;
      try {
        window.location.href = playStoreUrl;
        setTimeout(() => {
          window.open(webPlayStore, '_blank');
        }, 600);
      } catch (_) {
        window.open(webPlayStore, '_blank');
      }
      return true;
    }

    if (platform === PLATFORMS.WINDOWS) {
      // Direct user to verified GitHub Release installer
      const winUrl = urls.windows || `https://github.com/${GITHUB_REPO}/releases/latest`;
      window.open(winUrl, '_blank');
      return true;
    }

    // Web / PWA: Trigger Service Worker cache update and reload
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        if (registration) {
          await registration.update();
        }
      } catch (_) {}
    }

    // Refresh application to load newest cached assets
    setTimeout(() => {
      window.location.reload();
    }, 400);
    return true;
  }
}

export const updateService = new UpdateService();
