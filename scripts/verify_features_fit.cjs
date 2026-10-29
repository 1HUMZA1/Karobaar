const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
  
  await page.goto('http://localhost:5173/#/home', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  const artifactDir = 'C:/Users/humza/.gemini/antigravity/brain/a5fd0cc2-dcc4-4651-968a-bdad886efad8';

  // Scroll to features exactly as user did
  await page.evaluate(() => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: 'scratch/verify_features_clean_fit.png' });
  fs.copyFileSync('scratch/verify_features_clean_fit.png', path.join(artifactDir, 'verify_features_clean_fit.png'));
  console.log('Saved scratch/verify_features_clean_fit.png');

  await browser.close();
  console.log('Features fit verification complete!');
})();
