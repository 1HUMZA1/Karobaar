const fs = require('fs');

let content = fs.readFileSync('src/styles/global.css', 'utf8');

const marker = content.indexOf('/* ==========================================================================') !== -1 ?
  content.indexOf('/* ==========================================================================\r\n   Generic Modal Styles') !== -1 ?
  content.indexOf('/* ==========================================================================\r\n   Generic Modal Styles') :
  content.indexOf('/* ==========================================================================\n   Generic Modal Styles') : -1;

if (marker === -1) {
  console.error('Marker not found');
  process.exit(1);
}

const before = content.substring(0, marker);
const afterMatch = content.indexOf('/* Splash Screen Dual-Tone Theme */');
const after = content.substring(afterMatch);

const replacement = `/* ==========================================================================
   Universal Modal & Dialog System (Clean, Modern, Apple / Linear Precision)
   ========================================================================== */
.biz-modal-overlay,
.modal-overlay,
.modal-backdrop,
.k-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(9, 9, 11, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.25rem;
  box-sizing: border-box;
  animation: modalBackdropFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalBackdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.biz-modal-content,
.modal-content,
.emp-modal-content {
  background-color: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e4e4e7);
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  position: relative;
  animation: modalCardScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

[data-theme="dark"] .biz-modal-content,
[data-theme="dark"] .modal-content,
[data-theme="dark"] .emp-modal-content,
.dark .biz-modal-content,
.dark .modal-content,
.dark .emp-modal-content {
  background-color: var(--bg-card, #141416);
  border-color: var(--border-color, #27272a);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
}

@keyframes modalCardScaleIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.biz-modal-header,
.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #e4e4e7);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-card, #ffffff);
}

[data-theme="dark"] .biz-modal-header,
[data-theme="dark"] .modal-header,
.dark .biz-modal-header,
.dark .modal-header {
  background-color: var(--bg-card, #141416);
  border-bottom-color: var(--border-color, #27272a);
}

.biz-modal-header h2,
.biz-modal-header h3,
.modal-header h2,
.modal-header h3,
.modal-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-main, #09090b);
}

[data-theme="dark"] .biz-modal-header h2,
[data-theme="dark"] .biz-modal-header h3,
[data-theme="dark"] .modal-header h2,
[data-theme="dark"] .modal-header h3,
[data-theme="dark"] .modal-title,
.dark .biz-modal-header h2,
.dark .biz-modal-header h3,
.dark .modal-header h2,
.dark .modal-header h3,
.dark .modal-title {
  color: var(--text-main, #fafafa);
}

.modal-close,
.biz-modal-close-btn,
.icon-button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted, #71717a);
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-close:hover,
.biz-modal-close-btn:hover,
.icon-button:hover {
  background-color: var(--bg-hover, #f4f4f5);
  color: var(--text-main, #09090b);
  border-color: var(--border-color, #e4e4e7);
}

[data-theme="dark"] .modal-close:hover,
[data-theme="dark"] .biz-modal-close-btn:hover,
[data-theme="dark"] .icon-button:hover,
.dark .modal-close:hover,
.dark .biz-modal-close-btn:hover,
.dark .icon-button:hover {
  background-color: var(--bg-hover, #27272a);
  color: var(--text-main, #fafafa);
  border-color: var(--border-color, #27272a);
}

.biz-modal-body,
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.biz-modal-footer,
.modal-footer,
.modal-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color, #e4e4e7);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--bg-card, #ffffff);
}

[data-theme="dark"] .biz-modal-footer,
[data-theme="dark"] .modal-footer,
[data-theme="dark"] .modal-actions,
.dark .biz-modal-footer,
.dark .modal-footer,
.dark .modal-actions {
  background-color: var(--bg-card, #141416);
  border-top-color: var(--border-color, #27272a);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

`;

fs.writeFileSync('src/styles/global.css', before + replacement + after, 'utf8');
console.log('Successfully updated src/styles/global.css');
