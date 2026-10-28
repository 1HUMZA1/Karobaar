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

  console.log('Navigating to http://localhost:5173/#/pos...');
  await page.goto('http://localhost:5173/#/pos', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2600));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_pos_desktop.png') });
  console.log('Captured current_pos_desktop.png');

  // Also switch to touch grid view to see what grid looks like
  await page.evaluate(() => {
    const gridBtn = document.querySelector('.pos-view-btn:last-child');
    if (gridBtn) gridBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_pos_grid.png') });
  console.log('Captured current_pos_grid.png');

  await browser.close();
  console.log('Done.');
})();
