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

  // 1. Capture Light Mode Loading Screen (block script execution temporarily to see static splash)
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.resourceType() === 'script' && req.url().includes('main.jsx')) {
      // delay or abort main.jsx so we see the pristine splash
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_loading_screen_light.png') });
  console.log('Captured verify_loading_screen_light.png');

  // 2. Capture Dark Mode Loading Screen
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_loading_screen_dark.png') });
  console.log('Captured verify_loading_screen_dark.png');

  await browser.close();
})();
