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

  console.log('Navigating to http://localhost:5173/#/dashboard...');
  await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'networkidle2' });
  // Wait for loading screen to complete and dashboard to mount
  await new Promise(r => setTimeout(r, 2600));

  // 1. Capture Desktop View (1440px)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_header_alignment.png') });
  console.log('Captured verify_dash_header_alignment.png');

  // 2. Capture Intermediate Laptop View (1200px)
  await page.setViewport({ width: 1200, height: 800 });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_1200px_alignment.png') });
  console.log('Captured verify_dash_1200px_alignment.png');

  // 2b. Capture Mobile Phone View (390px)
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_mobile_390px.png') });
  console.log('Captured verify_dash_mobile_390px.png');

  // Return to 1440px for modal testing
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 300));

  // 3. Test Custom Date Range Pill
  const customPill = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Custom Range'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (customPill) {
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_custom_date_range.png') });
    console.log('Captured verify_dash_custom_date_range.png');
  }

  // 4. Test Payment Tender Click (Cash/UPI modal)
  const clickedTender = await page.evaluate(() => {
    const tenderBtns = Array.from(document.querySelectorAll('button'));
    const upiBtn = tenderBtns.find(b => b.textContent.includes('UPI'));
    if (upiBtn) {
      upiBtn.click();
      return 'UPI';
    }
    const cashBtn = tenderBtns.find(b => b.textContent.includes('Cash'));
    if (cashBtn) {
      cashBtn.click();
      return 'Cash';
    }
    return null;
  });
  if (clickedTender) {
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_payment_modal.png') });
    console.log('Captured verify_dash_payment_modal.png');

    // Close modal
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const closeBtn = closeBtns.find(b => b.textContent.trim() === 'Close');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // 5. Test Business Health Dock Click
  const clickedHealth = await page.evaluate(() => {
    const healthDock = document.querySelector('.executive-health-dock > div:first-child');
    if (healthDock) {
      healthDock.click();
      return true;
    }
    return false;
  });
  if (clickedHealth) {
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_health_modal.png') });
    console.log('Captured verify_dash_health_modal.png');

    // Close modal
    await page.evaluate(() => {
      const dismissBtns = Array.from(document.querySelectorAll('button'));
      const dismissBtn = dismissBtns.find(b => b.textContent.trim() === 'Dismiss');
      if (dismissBtn) dismissBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // 6. Test Legacy Mode ⚡ Confirmation Dialog
  const clickedLegacy = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const legacyBtn = buttons.find(b => b.textContent.includes('Legacy Mode'));
    if (legacyBtn) {
      legacyBtn.click();
      return true;
    }
    return false;
  });
  if (clickedLegacy) {
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_legacy_confirm_modal.png') });
    console.log('Captured verify_dash_legacy_confirm_modal.png');

    // Dismiss modal (stay in premium)
    await page.evaluate(() => {
      const stayBtns = Array.from(document.querySelectorAll('button'));
      const stayBtn = stayBtns.find(b => b.textContent.includes('Stay in Premium'));
      if (stayBtn) stayBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // 7. Test Customer Udhaar (Khata) Drilldown
  const clickedUdhaar = await page.evaluate(() => {
    const udhaarCard = document.querySelector('[data-test="udhaar-card"]');
    if (udhaarCard) {
      udhaarCard.click();
      return true;
    }
    return false;
  });
  if (clickedUdhaar) {
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_udhaar_modal.png') });
    console.log('Captured verify_dash_udhaar_modal.png');

    // Close modal
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const closeBtn = closeBtns.find(b => b.textContent.trim() === 'Close');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // 8. Test Stock Health Drilldown
  const clickedStock = await page.evaluate(() => {
    const stockCard = document.querySelector('[data-test="stock-card"]');
    if (stockCard) {
      stockCard.click();
      return true;
    }
    return false;
  });
  if (clickedStock) {
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_dash_stock_health_modal.png') });
    console.log('Captured verify_dash_stock_health_modal.png');
  }

  await browser.close();
  console.log('All dashboard verification tests completed successfully!');
})();
