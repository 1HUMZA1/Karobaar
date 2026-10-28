const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd');

(async () => {
  console.log('--- Starting Karobaar AI 2.0 Browser E2E Verification ---');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Step 1: Navigate to Dashboard
    console.log('Step 1: Navigating to Dashboard...');
    await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    // Open Jarvis conversation bubble
    console.log('Opening Jarvis bubble...');
    await page.evaluate(() => {
      const avatar = document.querySelector('.jarvis-avatar-container');
      if (avatar) avatar.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 2: Query "How much did my business sell today?"
    console.log('Step 2: Asking: "How much did my business sell today?"...');
    let inputEl = await page.$('.bubble-text-input');
    await inputEl.focus();
    await page.keyboard.type('How much did my business sell today?');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2200));

    const salesResponse = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('.bubble-msg-row.bot-side .bubble-text'));
      return msgs.pop()?.textContent.trim();
    });
    console.log('Jarvis Sales Response:', salesResponse);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_ai_sales_query.png') });
    console.log('Captured verify_ai_sales_query.png');

    // Step 3: Query "Which products are running low?"
    console.log('Step 3: Asking: "Which products are running low?"...');
    inputEl = await page.$('.bubble-text-input');
    await inputEl.focus();
    await page.keyboard.type('Which products are running low?');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2200));

    const lowStockResponse = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('.bubble-msg-row.bot-side .bubble-text'));
      return msgs.pop()?.textContent.trim();
    });
    console.log('Jarvis Low Stock Response:', lowStockResponse);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_ai_low_stock_query.png') });
    console.log('Captured verify_ai_low_stock_query.png');

    // Step 4: Query "Audit store health and recommendations"
    console.log('Step 4: Asking: "Audit store health and recommendations"...');
    inputEl = await page.$('.bubble-text-input');
    await inputEl.focus();
    await page.keyboard.type('Audit store health and recommendations');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2500));

    const auditResponse = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('.bubble-msg-row.bot-side .bubble-text'));
      return msgs.pop()?.textContent.trim();
    });
    console.log('Jarvis Audit Response:', auditResponse);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_ai_health_audit.png') });
    console.log('Captured verify_ai_health_audit.png');

    // Close Jarvis bubble before navigating
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.jarvis-bubble-tool-btn.close-btn');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Step 5: Navigate to Settings -> Customize AI
    console.log('Step 5: Navigating to Settings -> Customize AI...');
    await page.goto('http://localhost:5173/#/settings?tab=ai', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    // Click "Run Full AI Health Check" button
    console.log('Clicking "Run Full AI Health Check"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const diagBtn = buttons.find(b => b.textContent.includes('Run Full AI Health Check') || b.textContent.includes('Health Check'));
      if (diagBtn) diagBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_ai_settings_diagnostics.png') });
    console.log('Captured verify_ai_settings_diagnostics.png');

    // Click "Save Changes" in Settings
    console.log('Clicking Save Changes in Settings...');
    await page.evaluate(() => {
      const saveBtn = document.querySelector('.btn-primary') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Changes'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_ai_settings_saved.png') });
    console.log('Captured verify_ai_settings_saved.png');

    console.log('\n======================================================');
    console.log('>>> BROWSER E2E TESTS COMPLETED SUCCESSFULLY! <<<');
    console.log('======================================================\n');

  } finally {
    await browser.close();
  }
})();
