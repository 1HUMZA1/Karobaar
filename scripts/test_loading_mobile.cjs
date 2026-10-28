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
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.resourceType() === 'script' && req.url().includes('main.jsx')) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 650));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_loading_mobile_light.png') });
  console.log('Captured verify_loading_mobile_light.png');

  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_loading_mobile_dark.png') });
  console.log('Captured verify_loading_mobile_dark.png');

  await browser.close();
})();
