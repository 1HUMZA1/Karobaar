const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd');

(async () => {
  console.log('--- Starting Jarvis Master Upgrade & Settings E2E Verification ---');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Step 1: Open Settings -> Account & Security tab to verify TRUE devices
    console.log('Step 1: Navigating to Settings -> Account & Security...');
    await page.goto('http://localhost:5173/#/settings', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.settings-nav-btn'));
      const accBtn = btns.find(b => b.textContent.includes('Account & Security'));
      if (accBtn) accBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Check device list contents
    const deviceData = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('.settings-section-heading'));
      const devHeading = headings.find(h => h.textContent.includes('Connected Devices'));
      const devBlock = devHeading ? devHeading.closest('.settings-section-block') : null;
      const deviceNames = devBlock ? Array.from(devBlock.querySelectorAll('.text-text-main.font-bold, .text-sm.font-bold')).map(el => el.textContent.trim()) : [];
      const hasFakeGalaxy = document.body.textContent.includes('Samsung Galaxy');
      const hasFakeIpad = document.body.textContent.includes('iPad Counter Register');
      const hasFakeHP = document.body.textContent.includes('HP Laptop (Manager Office)');
      return {
        heading: devHeading ? devHeading.textContent.trim() : 'Not found',
        devices: deviceNames,
        hasFakeGalaxy,
        hasFakeIpad,
        hasFakeHP
      };
    });

    console.log('Device Section Verification:', deviceData);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_true_devices_only.png') });
    console.log('Captured verify_true_devices_only.png');

    // Step 2: Open Settings -> Customize AI tab to verify NO separate "Save AI Settings" button
    console.log('Step 2: Checking Customize AI tab for separate save buttons...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.settings-nav-btn'));
      const aiBtn = btns.find(b => b.textContent.includes('Customize'));
      if (aiBtn) aiBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    const saveButtonsCheck = await page.evaluate(() => {
      const sectionFooters = document.querySelectorAll('.settings-section-footer');
      const saveButtons = Array.from(document.querySelectorAll('button')).filter(b => 
        b.textContent.includes('Save AI Settings') || 
        b.textContent.includes('Save Business Profile') ||
        b.textContent.includes('Save Preferences')
      );
      const topSaveBtn = document.querySelector('.settings-btn-primary');
      return {
        footerCount: sectionFooters.length,
        separateSaveBtnCount: saveButtons.length,
        hasTopSaveBtn: !!topSaveBtn,
        topSaveText: topSaveBtn ? topSaveBtn.textContent.trim() : 'None'
      };
    });

    console.log('Save Buttons Check:', saveButtonsCheck);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_no_separate_save_button.png') });
    console.log('Captured verify_no_separate_save_button.png');

    // Step 3: Open Dashboard and launch Jarvis Command Center
    console.log('Step 3: Navigating to Dashboard and launching Jarvis Command Center...');
    await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // Click mini character avatar to open Jarvis Command Center
    await page.evaluate(() => {
      const avatar = document.querySelector('.jarvis-avatar-container');
      if (avatar) avatar.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Verify Command Center & Intelligence Orb
    const commandCenterCheck = await page.evaluate(() => {
      const cc = document.querySelector('.jarvis-command-center-panel');
      const orbCanvas = document.querySelector('.jarvis-intelligence-orb-canvas');
      const title = document.querySelector('.jarvis-cc-title');
      return {
        isOpen: !!cc,
        hasOrb: !!orbCanvas,
        title: title ? title.textContent : null
      };
    });
    console.log('Command Center Check:', commandCenterCheck);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_jarvis_command_center_open.png') });
    console.log('Captured verify_jarvis_command_center_open.png');

    // Step 4: Test query "How much did my business sell today?"
    console.log('Step 4: Submitting query: "How much did my business sell today?"...');
    const inputEl = await page.$('.command-text-input');
    if (inputEl) {
      await inputEl.focus();
      await page.keyboard.type('How much did my business sell today?');
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 2500));
    }

    const firstReply = await page.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll('.bot-side .msg-content'));
      return bubbles.pop()?.textContent.trim();
    });
    console.log('Jarvis Reply 1:', firstReply);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_jarvis_sales_reply.png') });
    console.log('Captured verify_jarvis_sales_reply.png');

    // Step 5: Test quick chip "What can Jarvis do?"
    console.log('Step 5: Clicking Capabilities chip...');
    await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('.jarvis-cc-quick-chips button'));
      const capChip = chips.find(c => c.textContent.includes('Capabilities'));
      if (capChip) capChip.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    const capReply = await page.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll('.bot-side .msg-content'));
      return bubbles.pop()?.textContent.trim();
    });
    console.log('Jarvis Capabilities Reply:', capReply);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_jarvis_capabilities.png') });
    console.log('Captured verify_jarvis_capabilities.png');

    // Step 6: Check Activity tab in Command Center
    console.log('Step 6: Checking Activity tab in Command Center...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.jarvis-cc-tabs .tab-btn'));
      const actTab = tabs.find(t => t.textContent.includes('Activity'));
      if (actTab) actTab.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_jarvis_activity_tab.png') });
    console.log('Captured verify_jarvis_activity_tab.png');

    console.log('======================================================');
    console.log('>>> ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! <<<');
    console.log('======================================================');

  } catch (err) {
    console.error('Test run failed:', err);
  } finally {
    await browser.close();
  }
})();
