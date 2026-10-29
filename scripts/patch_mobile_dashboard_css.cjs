const fs = require('fs');

let css = fs.readFileSync('src/pages/Dashboard/MobileDashboard.css', 'utf8');

const targetStr = `/* 8. Modern Modals & Slide-up Sheets */`;
const idx = css.indexOf(targetStr);
if (idx === -1) {
  console.error('Target not found in MobileDashboard.css');
  process.exit(1);
}

const before = css.substring(0, idx);
const replacement = `/* 8. Modern Modals & Slide-up Sheets */
.k-sheet-overlay,
.k-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(9, 9, 11, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

.k-sheet-content,
.k-modal-sheet {
  width: 100%;
  max-width: 520px;
  background: var(--bg-card, #ffffff);
  border-radius: 24px 24px 0 0;
  border-top: 1px solid var(--border-color, #e4e4e7);
  padding: 1.25rem 1.25rem 2.25rem 1.25rem;
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-sizing: border-box;
}

[data-theme='dark'] .k-sheet-content,
[data-theme='dark'] .k-modal-sheet {
  background: #141416;
  border-top-color: #27272a;
}

.k-modal-drag-pill {
  width: 36px;
  height: 4px;
  border-radius: 9999px;
  background: var(--border-strong, #cbd5e1);
  margin: 0 auto 12px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.k-sheet-header,
.k-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e4e4e7);
  margin-bottom: 1.25rem;
}

.k-sheet-title,
.k-modal-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-main, #09090b);
  letter-spacing: -0.02em;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

[data-theme='dark'] .k-sheet-title,
[data-theme='dark'] .k-modal-title {
  color: #fafafa;
}

.k-sheet-close-btn,
.k-modal-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-hover, #f4f4f5);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted, #71717a);
  cursor: pointer;
  transition: transform 0.15s ease;
}

[data-theme='dark'] .k-sheet-close-btn,
[data-theme='dark'] .k-modal-close-btn {
  background: #27272a;
  color: #a1a1aa;
}

.k-sheet-btn-primary {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  background: #09090b;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.15s ease, opacity 0.15s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

[data-theme='dark'] .k-sheet-btn-primary {
  background: #27272a;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

.k-sheet-btn-primary:active {
  transform: scale(0.98);
}
`;

fs.writeFileSync('src/pages/Dashboard/MobileDashboard.css', before + replacement, 'utf8');
console.log('Successfully updated MobileDashboard.css');
