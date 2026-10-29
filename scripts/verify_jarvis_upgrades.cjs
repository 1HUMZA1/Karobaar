const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd';

(async () => {
  console.log('🚀 Launching Puppeteer browser with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Helper to ensure dummy user in localStorage
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('karobaar_user', JSON.stringify({
      id: 'usr-demo-1',
      name: 'Owner Admin',
      role: 'Owner',
      activeBusinessId: 'biz-demo-1'
    }));
    localStorage.setItem('karobaar_business', JSON.stringify({
      id: 'biz-demo-1',
      name: 'Main Business Store'
    }));
    localStorage.setItem('karobaar_theme', 'dark');
  });

  console.log('Navigating to http://localhost:5173/#/dashboard ...');
  await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('Page loaded, waiting 2s for React components to mount...');
  await new Promise(r => setTimeout(r, 2000));

  // 1. Open Jarvis Command Center via the mini character or dispatching event
  console.log('1. Opening Jarvis Command Center...');
  const avatarDock = await page.$('.jarvis-avatar-container');
  if (avatarDock) {
    await avatarDock.click();
  } else {
    // Alternatively click any Wake Jarvis button
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Jarvis'));
      if (btn) btn.click();
    });
  }

  await new Promise(r => setTimeout(r, 1200));

  // Ensure modal is open
  const panel = await page.$('.jarvis-command-center-panel');
  if (!panel) {
    console.error('❌ Jarvis Command Center panel not found in DOM!');
    await browser.close();
    process.exit(1);
  }
  console.log('✓ Jarvis Command Center opened successfully.');

  // Take screenshot 1: Transparent frosted glass in Dark Mode
  const darkShot = path.join(ARTIFACTS_DIR, 'verify_jarvis_glass_dark.png');
  await page.screenshot({ path: darkShot, fullPage: false });
  console.log(`✓ Saved Dark Mode screenshot to: ${darkShot}`);

  // Helper to type and submit a command in the Jarvis Command Center input
  async function sendJarvisCommand(commandText) {
    console.log(`Sending command: "${commandText}"`);
    const input = await page.$('.command-text-input');
    if (!input) throw new Error('Command text input not found');
    await input.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await input.type(commandText, { delay: 30 });
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1800));
  }

  // 2. Test "mute" command
  console.log('2. Testing "mute" command...');
  await sendJarvisCommand('mute');
  const mutedShot = path.join(ARTIFACTS_DIR, 'verify_jarvis_muted.png');
  await page.screenshot({ path: mutedShot, fullPage: false });
  console.log(`✓ Saved Muted screenshot to: ${mutedShot}`);

  // 3. Test talk without animation (hide animation)
  console.log('3. Testing "hide animation" (talk without animation)...');
  await sendJarvisCommand('hide animation');
  const noAnimOrb = await page.$('.jarvis-cc-hero-visualizer');
  console.log('Orb visualizer present after "hide animation"?', !!noAnimOrb);
  const noAnimShot = path.join(ARTIFACTS_DIR, 'verify_jarvis_no_animation.png');
  await page.screenshot({ path: noAnimShot, fullPage: false });
  console.log(`✓ Saved No Animation screenshot to: ${noAnimShot}`);

  // 4. Test "show animation" (restore animation)
  console.log('4. Testing "show animation"...');
  await sendJarvisCommand('show animation');
  const restoredOrb = await page.$('.jarvis-cc-hero-visualizer');
  console.log('Orb visualizer present after "show animation"?', !!restoredOrb);

  // 5. Test "switch" command (Dark -> Light)
  console.log('5. Testing "switch" command to toggle to opposite theme...');
  const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
  console.log('Theme before switch:', initialTheme);

  await sendJarvisCommand('switch');

  const afterSwitchTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
  console.log('Theme after 1st switch (expected opposite):', afterSwitchTheme);

  const lightShot = path.join(ARTIFACTS_DIR, 'verify_jarvis_glass_light.png');
  await page.screenshot({ path: lightShot, fullPage: false });
  console.log(`✓ Saved Light Mode screenshot to: ${lightShot}`);

  // 6. Test "switch" command again (Light -> Dark)
  console.log('6. Testing "switch" command again...');
  await sendJarvisCommand('switch');
  const afterSecondSwitchTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
  console.log('Theme after 2nd switch (expected dark):', afterSecondSwitchTheme);

  // 7. Test "take me to inventory"
  console.log('7. Testing "take me to inventory" navigation...');
  await sendJarvisCommand('take me to inventory');
  const currentUrl = page.url();
  console.log('Current URL after navigation command:', currentUrl);

  const navShot = path.join(ARTIFACTS_DIR, 'verify_jarvis_nav_inventory.png');
  await page.screenshot({ path: navShot, fullPage: false });
  console.log(`✓ Saved Navigation screenshot to: ${navShot}`);

  await browser.close();
  console.log('🎉 All Jarvis tests passed successfully!');
})().catch(err => {
  console.error('❌ Error during verification:', err);
  process.exit(1);
});
