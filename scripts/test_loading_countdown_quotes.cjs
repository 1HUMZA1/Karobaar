const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Test 1: Static Splash Screen with Countdown & Quotes
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.resourceType() === 'script' && req.url().includes('main.jsx')) {
      // delay or abort main.jsx so we see the pristine splash counting to 100%
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  
  // Wait ~600ms so the countdown progress reaches around 50-70%
  await new Promise(r => setTimeout(r, 650));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_loading_100_countdown_light.png') });
  console.log('Captured verify_loading_100_countdown_light.png');

  // Switch to Dark mode and capture
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_loading_100_countdown_dark.png') });
  console.log('Captured verify_loading_100_countdown_dark.png');

  // Test quote rotation with fade out and fade in
  // Quote rotates every 2100ms. Wait for next quote:
  await new Promise(r => setTimeout(r, 1600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_loading_quote_fade.png') });
  console.log('Captured verify_loading_quote_fade.png');

  await browser.close();

  // Test 2: Verify normal app loading completes cleanly into Dashboard
  const browser2 = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page2 = await browser2.newPage();
  await page2.setViewport({ width: 1440, height: 900 });

  await page2.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  // Wait for loading screen to complete and dashboard to mount
  await new Promise(r => setTimeout(r, 2600));
  await page2.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_app_dashboard_after_loading.png') });
  console.log('Captured verify_app_dashboard_after_loading.png');

  await browser2.close();
  console.log('All verification screenshots captured successfully!');
})();
