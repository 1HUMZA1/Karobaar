const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd');

(async () => {
  console.log('--- Starting Jarvis Light Mode Switching Verification ---');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Establish initial Dark Mode state
  console.log('Step 1: Establishing initial Dark Mode state...');
  await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2800));

  await page.evaluate(() => {
    localStorage.setItem('karobaar-theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2800));

  // Open Jarvis conversation bubble by clicking the avatar dock
  console.log('Clicking Jarvis avatar to open bubble...');
  await page.evaluate(() => {
    const avatar = document.querySelector('.jarvis-avatar-container');
    if (avatar) avatar.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_jarvis_before_dark.png') });
  console.log('Captured verify_jarvis_before_dark.png');

  const darkStatus = await page.evaluate(() => ({
    themeAttr: document.documentElement.getAttribute('data-theme'),
    hasDarkClass: document.documentElement.classList.contains('dark'),
    bodyDark: document.body.classList.contains('dark'),
    isBubbleOpen: !!document.querySelector('.jarvis-conv-bubble-panel'),
    topbarIconSun: !!document.querySelector('[data-tour="theme-toggle"] svg.lucide-sun')
  }));
  console.log('Dark Mode Status before Jarvis command:', darkStatus);

  // 2. Type "light mode light mode" into Jarvis using real keyboard
  console.log('Step 2: Typing "light mode light mode" using real keyboard...');
  const inputEl = await page.$('.bubble-text-input');
  if (inputEl) {
    await inputEl.focus();
    await page.keyboard.type('light mode light mode');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('Enter');
  } else {
    console.error('Could not find .bubble-text-input');
  }

  await new Promise(r => setTimeout(r, 1500));

  const lightStatus1 = await page.evaluate(() => ({
    themeAttr: document.documentElement.getAttribute('data-theme'),
    hasDarkClass: document.documentElement.classList.contains('dark'),
    bodyDark: document.body.classList.contains('dark'),
    localTheme: localStorage.getItem('karobaar-theme'),
    lastBotMsg: Array.from(document.querySelectorAll('.bubble-msg-row.bot-side .bubble-text')).pop()?.textContent.trim(),
    chipText: Array.from(document.querySelectorAll('.bubble-chip')).pop()?.textContent.trim(),
    topbarIconMoon: !!document.querySelector('[data-tour="theme-toggle"] svg.lucide-moon'),
    topbarIconSun: !!document.querySelector('[data-tour="theme-toggle"] svg.lucide-sun')
  }));
  console.log('Status after typing "light mode light mode":', lightStatus1);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_jarvis_switched_light.png') });
  console.log('Captured verify_jarvis_switched_light.png');

  // 3. Test reloading the page to verify Light mode persistence
  console.log('Step 3: Reloading page to test persistence of Light Mode...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2800));

  const reloadedStatus = await page.evaluate(() => ({
    themeAttr: document.documentElement.getAttribute('data-theme'),
    hasDarkClass: document.documentElement.classList.contains('dark'),
    bodyDark: document.body.classList.contains('dark'),
    localTheme: localStorage.getItem('karobaar-theme'),
    topbarIconMoon: !!document.querySelector('[data-tour="theme-toggle"] svg.lucide-moon'),
    topbarIconSun: !!document.querySelector('[data-tour="theme-toggle"] svg.lucide-sun')
  }));
  console.log('Reloaded Status (must be light):', reloadedStatus);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_jarvis_reloaded_light.png') });
  console.log('Captured verify_jarvis_reloaded_light.png');

  // 4. Test switching back to Dark Mode via Jarvis
  console.log('Step 4: Testing Jarvis switch to dark mode...');
  await page.evaluate(() => {
    const avatar = document.querySelector('.jarvis-avatar-container');
    if (avatar) avatar.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const inputElDark = await page.$('.bubble-text-input');
  if (inputElDark) {
    await inputElDark.focus();
    await page.keyboard.type('switch to dark mode');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('Enter');
  }
  await new Promise(r => setTimeout(r, 1200));

  const darkStatusAfter = await page.evaluate(() => ({
    themeAttr: document.documentElement.getAttribute('data-theme'),
    hasDarkClass: document.documentElement.classList.contains('dark'),
    localTheme: localStorage.getItem('karobaar-theme'),
    topbarIconSun: !!document.querySelector('[data-tour="theme-toggle"] svg.lucide-sun')
  }));
  console.log('Status after "switch to dark mode":', darkStatusAfter);

  // 5. Test switching back to Light Mode via quick chip
  console.log('Step 5: Testing Jarvis quick chip to switch to light mode...');
  await page.evaluate(() => {
    const chip = Array.from(document.querySelectorAll('.bubble-chip')).pop();
    if (chip) chip.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const finalStatus = await page.evaluate(() => ({
    themeAttr: document.documentElement.getAttribute('data-theme'),
    hasDarkClass: document.documentElement.classList.contains('dark'),
    bodyDark: document.body.classList.contains('dark'),
    localTheme: localStorage.getItem('karobaar-theme'),
    topbarIconMoon: !!document.querySelector('[data-tour="theme-toggle"] svg.lucide-moon')
  }));
  console.log('Final Status after chip click:', finalStatus);

  await browser.close();

  // Validate all assertions
  const success = 
    lightStatus1.themeAttr === 'light' &&
    !lightStatus1.hasDarkClass &&
    reloadedStatus.themeAttr === 'light' &&
    !reloadedStatus.hasDarkClass &&
    reloadedStatus.topbarIconMoon &&
    darkStatusAfter.themeAttr === 'dark' &&
    finalStatus.themeAttr === 'light';

  if (!success) {
    console.error('VERIFICATION FAILED!');
    process.exit(1);
  } else {
    console.log('ALL JARVIS THEME SWITCHING TESTS PASSED 100%!');
  }
})();
