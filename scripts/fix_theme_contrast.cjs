const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace tab border and text
  content = content.replace(/border-white text-white/g, 'border-[var(--text-main)] text-[var(--text-main)]');
  content = content.replace(/hover:text-white/g, 'hover:text-[var(--text-main)]');
  content = content.replace(/text-white font-bold/g, 'text-[var(--text-main)] font-bold');
  content = content.replace(/font-bold text-white/g, 'font-bold text-[var(--text-main)]');
  content = content.replace(/font-semibold text-white/g, 'font-semibold text-[var(--text-main)]');
  content = content.replace(/text-lg text-white/g, 'text-lg text-[var(--text-main)]');
  content = content.replace(/text-sm text-white/g, 'text-sm text-[var(--text-main)]');
  content = content.replace(/text-base text-white/g, 'text-base text-[var(--text-main)]');
  content = content.replace(/text-white text-sm/g, 'text-[var(--text-main)] text-sm');
  content = content.replace(/text-white text-base/g, 'text-[var(--text-main)] text-base');
  content = content.replace(/text-white text-xs/g, 'text-[var(--text-main)] text-xs');
  content = content.replace(/text-white mt-1/g, 'text-[var(--text-main)] mt-1');
  content = content.replace(/text-white mt-0.5/g, 'text-[var(--text-main)] mt-0.5');

  // Fix stat numbers
  content = content.replace(/h3 className="text-2xl font-bold mt-0.5">/g, 'h3 className="text-2xl font-bold text-[var(--text-main)] mt-0.5">');

  // Fix dark-only background classes in light mode
  content = content.replace(/bg-zinc-950\/40/g, 'bg-[var(--bg-elevated)]');
  content = content.replace(/bg-zinc-900\/60/g, 'bg-[var(--bg-hover)]');
  content = content.replace(/bg-zinc-950/g, 'bg-[var(--bg-elevated)]');
  content = content.replace(/bg-zinc-900/g, 'bg-[var(--bg-elevated)]');
  content = content.replace(/border-zinc-800/g, 'border-[var(--border-color)]');
  content = content.replace(/border-zinc-700/g, 'border-[var(--border-color)]');
  content = content.replace(/text-zinc-300/g, 'text-[var(--text-secondary)]');
  content = content.replace(/text-zinc-400/g, 'text-[var(--text-muted)]');
  content = content.replace(/bg-zinc-800 text-zinc-300/g, 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated theme contrast for: ${filePath}`);
}

fixFile('src/pages/Inventory/Inventory.jsx');
fixFile('src/pages/Reports/Reports.jsx');
fixFile('src/pages/Payments/Payments.jsx');
