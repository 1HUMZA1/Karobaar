const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd');

(async () => {
  console.log('--- Starting Jarvis Switch to Opposite Mode Verification ---');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Step 1: Establish initial Dark Mode state
    console.log('Step 1: Setting up initial Dark Mode...');
    await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    await page.evaluate(() => {
      localStorage.setItem('karobaar-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    // Open Jarvis conversation bubble
    await page.evaluate(() => {
      const avatar = document.querySelector('.jarvis-avatar-container');
      if (avatar) avatar.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const initialStatus = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      hasDarkClass: document.documentElement.classList.contains('dark')
    }));
    console.log('Initial Status:', initialStatus);
    if (initialStatus.theme !== 'dark') throw new Error('Failed to set initial dark mode');

    // Step 2: Command "switch" while in Dark Mode -> MUST switch to Light Mode (opposite)
    console.log('Step 2: Typing "switch" into Jarvis while in Dark Mode...');
    let inputEl = await page.$('.bubble-text-input');
    await inputEl.focus();
    await page.keyboard.type('switch');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1200));

    const switchedToLightStatus = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      hasDarkClass: document.documentElement.classList.contains('dark'),
      lastBotMsg: Array.from(document.querySelectorAll('.bubble-msg-row.bot-side .bubble-text')).pop()?.textContent.trim()
    }));
    console.log('After "switch" (expected light):', switchedToLightStatus);
    if (switchedToLightStatus.theme !== 'light' || switchedToLightStatus.hasDarkClass) {
      throw new Error(`Expected light mode after "switch", but got ${switchedToLightStatus.theme}`);
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_switch_to_light.png') });
    console.log('Captured verify_switch_to_light.png');

    // Step 3: Command "switch" while in Light Mode -> MUST switch to Dark Mode (opposite)
    console.log('Step 3: Typing "switch" into Jarvis while in Light Mode...');
    inputEl = await page.$('.bubble-text-input');
    await inputEl.focus();
    await page.keyboard.type('switch');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1200));

    const switchedToDarkStatus = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      hasDarkClass: document.documentElement.classList.contains('dark'),
      lastBotMsg: Array.from(document.querySelectorAll('.bubble-msg-row.bot-side .bubble-text')).pop()?.textContent.trim()
    }));
    console.log('After second "switch" (expected dark):', switchedToDarkStatus);
    if (switchedToDarkStatus.theme !== 'dark' || !switchedToDarkStatus.hasDarkClass) {
      throw new Error(`Expected dark mode after second "switch", but got ${switchedToDarkStatus.theme}`);
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_switch_to_dark.png') });
    console.log('Captured verify_switch_to_dark.png');

    // Step 4: Command "switch change it to the oppsite mode" (User's prompt verbatim)
    console.log('Step 4: Typing "switch change it to the oppsite mode" while in Dark Mode...');
    inputEl = await page.$('.bubble-text-input');
    await inputEl.focus();
    await page.keyboard.type('switch change it to the oppsite mode');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1200));

    const switchedVerbatimStatus = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      hasDarkClass: document.documentElement.classList.contains('dark'),
      lastBotMsg: Array.from(document.querySelectorAll('.bubble-msg-row.bot-side .bubble-text')).pop()?.textContent.trim()
    }));
    console.log('After verbatim user prompt "switch change it to the oppsite mode":', switchedVerbatimStatus);
    if (switchedVerbatimStatus.theme !== 'light') {
      throw new Error(`Expected light mode after verbatim prompt, but got ${switchedVerbatimStatus.theme}`);
    }

    // Step 5: Command "switch to opposite mode" while in Light Mode -> MUST switch to Dark Mode
    console.log('Step 5: Typing "switch to opposite mode" while in Light Mode...');
    inputEl = await page.$('.bubble-text-input');
    await inputEl.focus();
    await page.keyboard.type('switch to opposite mode');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1200));

    const switchedOppositeStatus = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      hasDarkClass: document.documentElement.classList.contains('dark'),
      lastBotMsg: Array.from(document.querySelectorAll('.bubble-msg-row.bot-side .bubble-text')).pop()?.textContent.trim()
    }));
    console.log('After "switch to opposite mode":', switchedOppositeStatus);
    if (switchedOppositeStatus.theme !== 'dark') {
      throw new Error(`Expected dark mode after "switch to opposite mode", but got ${switchedOppositeStatus.theme}`);
    }

    // Step 6: Command "dark mode hey Jarvis dark mode" while already in Dark Mode (User's screenshot scenario)
    console.log('Step 6: Typing "dark mode hey Jarvis dark mode" while already in Dark Mode...');
    inputEl = await page.$('.bubble-text-input');
    await inputEl.focus();
    await page.keyboard.type('dark mode hey Jarvis dark mode');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1200));

    const alreadyDarkStatus = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      hasDarkClass: document.documentElement.classList.contains('dark'),
      lastBotMsg: Array.from(document.querySelectorAll('.bubble-msg-row.bot-side .bubble-text')).pop()?.textContent.trim()
    }));
    console.log('After "dark mode hey Jarvis dark mode" in dark mode:', alreadyDarkStatus);
    console.log('Bot message explains state:', alreadyDarkStatus.lastBotMsg);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_already_dark_explanation.png') });
    console.log('Captured verify_already_dark_explanation.png');

    // Step 7: Verify reload persistence
    console.log('Step 7: Testing reload persistence...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    const reloadedStatus = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      hasDarkClass: document.documentElement.classList.contains('dark'),
      localStorageTheme: localStorage.getItem('karobaar-theme')
    }));
    console.log('Reloaded Persistence Status:', reloadedStatus);
    if (reloadedStatus.theme !== 'dark' || reloadedStatus.localStorageTheme !== 'dark') {
      throw new Error('Persistence check failed');
    }

    console.log('\n======================================================');
    console.log('>>> ALL JARVIS SWITCH / OPPOSITE MODE TESTS PASSED 100%! <<<');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
})();
