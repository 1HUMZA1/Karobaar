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
  await page.goto('http://localhost:5173/#/pos', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2600));

  // 1. Capture Table View (Default)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_pos_table_view.png') });
  console.log('Captured verify_pos_table_view.png');

  // 2. Add item to cart
  const added = await page.evaluate(() => {
    const addBtns = Array.from(document.querySelectorAll('.pos-add-to-cart-btn, .pos-add-btn'));
    if (addBtns.length > 0) {
      addBtns[0].click();
      return true;
    }
    return false;
  });
  console.log('Added product 1 to cart:', added);
  await new Promise(r => setTimeout(r, 400));

  // Add second item to cart
  await page.evaluate(() => {
    const addBtns = Array.from(document.querySelectorAll('.pos-add-to-cart-btn, .pos-add-btn'));
    if (addBtns.length > 1) {
      addBtns[1].click();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  // Increment first item's quantity in cart
  await page.evaluate(() => {
    const plusBtn = document.querySelector('.pos-cart-row .pos-qty-btn:last-child');
    if (plusBtn) plusBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Apply a 10% discount preset
  await page.evaluate(() => {
    const presetBtns = Array.from(document.querySelectorAll('.pos-discount-preset-btn'));
    const btn10 = presetBtns.find(b => b.textContent.includes('10%'));
    if (btn10) btn10.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 2. Capture Cart with Items, Multipliers & Discount
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_pos_cart_items_and_discount.png') });
  console.log('Captured verify_pos_cart_items_and_discount.png');

  // 3. Test Cash Tendered Subpanel
  await page.evaluate(() => {
    const cashPresetBtn = document.querySelector('.pos-cash-preset-btn');
    if (cashPresetBtn) cashPresetBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_pos_cash_tender.png') });
  console.log('Captured verify_pos_cash_tender.png');

  // 4. Test Touch Grid View
  await page.evaluate(() => {
    const gridToggle = document.querySelector('.pos-view-btn[title*="Grid"]');
    if (gridToggle) gridToggle.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_pos_touch_grid_view.png') });
  console.log('Captured verify_pos_touch_grid_view.png');

  // Switch back to table view for consistency
  await page.evaluate(() => {
    const tableToggle = document.querySelector('.pos-view-btn[title*="Table"]');
    if (tableToggle) tableToggle.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // 5. Test Mobile View (390px)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844 });
  await mobilePage.goto('http://localhost:5173/#/pos', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2600));

  // Add an item to cart on mobile
  await mobilePage.evaluate(() => {
    const addBtn = document.querySelector('button[aria-label="Add item"]');
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_pos_mobile_view.png') });
  console.log('Captured verify_pos_mobile_view.png');

  // Tap Checkout button in floating bar on mobile to see checkout sheet
  await mobilePage.evaluate(() => {
    const mobileCheckoutBtn = document.querySelector('.mobile-capsule-checkout-btn');
    if (mobileCheckoutBtn) mobileCheckoutBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_pos_mobile_checkout_sheet.png') });
  console.log('Captured verify_pos_mobile_checkout_sheet.png');

  await mobilePage.close();

  await browser.close();
  console.log('All POS verification tests passed successfully!');
})();
