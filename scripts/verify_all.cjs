const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd';

(async () => {
  console.log('Starting full end-to-end verification of Karobaar improvements with contrast...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Load Dashboard
    await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_overhaul.png') });
    console.log('Captured verify_dash_overhaul.png');

    // 2. Navigate to Inventory
    await page.goto('http://localhost:5173/#/inventory', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_inventory_levels.png') });
    console.log('Captured verify_inventory_levels.png');

    // Switch to Stock Reconciliation tab
    let invButtons = await page.$$('button');
    for (const b of invButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Reconciliation Audit')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_inventory_reconciliation.png') });
    console.log('Captured verify_inventory_reconciliation.png');

    // 3. Navigate to Reports
    await page.goto('http://localhost:5173/#/reports', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_reports_pnl.png') });
    console.log('Captured verify_reports_pnl.png');

    // 4. Navigate to Payments
    await page.goto('http://localhost:5173/#/payments', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));
    const payButtons = await page.$$('button');
    for (const b of payButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Supplier Khata')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_payments_supplier_khata.png') });
    console.log('Captured verify_payments_supplier_khata.png');

    console.log('Verification finished successfully!');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
})();
