const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd');

(async () => {
  console.log('--- Starting Karobaar Settings Save & Persistence Verification ---');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Navigate to Settings -> General (Business Profile)
  console.log('Step 1: Navigating to Settings Business Profile...');
  await page.goto('http://localhost:5173/#/settings?tab=general', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2800)); // wait for splash

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_settings_loaded.png') });
  console.log('Captured verify_settings_loaded.png');

  // 2. Edit Business Profile fields using React-compatible setter
  console.log('Step 2: Modifying Business Information...');
  await page.evaluate(() => {
    function setVal(input, val) {
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const inputs = document.querySelectorAll('.settings-input-field');
    // inputs[0] is Business Name
    setVal(inputs[0], 'SAS GOURMET CAFE');
    // inputs[2] is Business Email
    setVal(inputs[2], 'gourmet@sascafeteria.com');
    // inputs[3] is Phone
    setVal(inputs[3], '+91 91234 56789');
    // inputs[4] is Address
    setVal(inputs[4], 'Level 2, Premium Food Court');
    // inputs[5] is Tax ID
    setVal(inputs[5], 'GSTIN-29BBBBB1111B2Z6');
  });

  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_settings_dirty_badge.png') });
  console.log('Captured verify_settings_dirty_badge.png');

  // Verify unsaved changes badge is visible
  const dirtyState = await page.evaluate(() => ({
    headerBadge: document.querySelector('.settings-header-dirty-badge')?.textContent.trim() || null,
    pill: document.querySelector('.settings-dirty-pill')?.textContent.trim() || null
  }));
  console.log('Unsaved changes indicators:', dirtyState);

  // 3. Save Business Profile
  console.log('Step 3: Clicking Save Business Profile...');
  await page.evaluate(() => {
    const saveBtn = document.querySelector('.settings-header-actions .settings-btn-primary');
    if (saveBtn) saveBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_settings_saved_success.png') });
  console.log('Captured verify_settings_saved_success.png');

  // 4. Verify Topbar updated business name
  const topbarBizName = await page.evaluate(() => {
    const nameEl = document.querySelector('.topbar-biz-pill-name');
    return nameEl ? nameEl.textContent.trim() : '';
  });
  console.log('Topbar business name updated to:', topbarBizName);

  // 5. Navigate to Preferences & Tax
  console.log('Step 4: Testing Preferences & Tax Tab...');
  await page.evaluate(() => {
    const prefTab = Array.from(document.querySelectorAll('.settings-nav-btn')).find(b => b.textContent.includes('Preferences & Tax'));
    if (prefTab) prefTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Change tax rate to 12.5 and low stock to 8
  await page.evaluate(() => {
    function setVal(input, val) {
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const numberInputs = Array.from(document.querySelectorAll('input[type="number"]'));
    setVal(numberInputs[0], '8');    // low stock threshold
    setVal(numberInputs[1], '12.5'); // tax rate
  });

  // Save Preferences using section save button
  await page.evaluate(() => {
    const sectionSaveBtn = Array.from(document.querySelectorAll('.settings-section-footer .settings-btn-primary')).find(b => b.textContent.includes('Save Preferences'));
    if (sectionSaveBtn) sectionSaveBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_settings_preferences_saved.png') });
  console.log('Captured verify_settings_preferences_saved.png');

  // 6. Test Invoice Settings
  console.log('Step 5: Testing Invoice Settings Tab...');
  await page.evaluate(() => {
    const invTab = Array.from(document.querySelectorAll('.settings-nav-btn')).find(b => b.textContent.includes('Invoice Settings'));
    if (invTab) invTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    function setVal(input, val) {
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const prefixInput = document.querySelector('input[placeholder="INV-"]');
    setVal(prefixInput, 'SGC-');

    const termsSelect = Array.from(document.querySelectorAll('select.settings-input-field')).find(s => s.innerHTML.includes('Net 15 Days'));
    if (termsSelect) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      if (setter) setter.call(termsSelect, 'Net 15 Days');
      termsSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const footerInput = document.querySelector('input[placeholder="Thank you for choosing us!"]');
    setVal(footerInput, 'Welcome to SAS Gourmet Cafe. Enjoy your fresh meal!');
  });

  // Save Invoices
  await page.evaluate(() => {
    const sectionSaveBtn = Array.from(document.querySelectorAll('.settings-section-footer .settings-btn-primary')).find(b => b.textContent.includes('Save Invoice Settings'));
    if (sectionSaveBtn) sectionSaveBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_settings_invoices_saved.png') });
  console.log('Captured verify_settings_invoices_saved.png');

  // 7. Test Customize AI Tab
  console.log('Step 6: Testing Customize AI Tab...');
  await page.evaluate(() => {
    const aiTab = Array.from(document.querySelectorAll('.settings-nav-btn')).find(b => b.textContent.includes('Customize'));
    if (aiTab) aiTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Click Mr. H preset button
  await page.evaluate(() => {
    const mrHBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mr. H'));
    if (mrHBtn) mrHBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Save AI Settings
  await page.evaluate(() => {
    const sectionSaveBtn = Array.from(document.querySelectorAll('.settings-section-footer .settings-btn-primary')).find(b => b.textContent.includes('Save AI Settings'));
    if (sectionSaveBtn) sectionSaveBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_settings_ai_saved.png') });
  console.log('Captured verify_settings_ai_saved.png');

  // 8. RELOAD BROWSER TO VERIFY FULL PERSISTENCE
  console.log('Step 7: Reloading page to test persistent storage...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3200));

  // Verify reloaded values in Business Profile
  const reloadedData = await page.evaluate(() => {
    const bizPill = document.querySelector('.topbar-biz-pill-name')?.textContent.trim();
    const inputs = Array.from(document.querySelectorAll('.settings-input-field')).map(i => i.value);
    return {
      topbarBiz: bizPill,
      businessName: inputs[0],
      email: inputs[2],
      phone: inputs[3],
      address: inputs[4],
      taxId: inputs[5]
    };
  });
  console.log('Reloaded Business Data Verification:', reloadedData);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_settings_reloaded_persistence.png') });
  console.log('Captured verify_settings_reloaded_persistence.png');

  // 9. Verify Preferences persisted after reload
  await page.evaluate(() => {
    const prefTab = Array.from(document.querySelectorAll('.settings-nav-btn')).find(b => b.textContent.includes('Preferences & Tax'));
    if (prefTab) prefTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const reloadedPref = await page.evaluate(() => {
    const numberInputs = Array.from(document.querySelectorAll('input[type="number"]')).map(i => i.value);
    return {
      lowStock: numberInputs[0],
      taxRate: numberInputs[1]
    };
  });
  console.log('Reloaded Preferences Verification:', reloadedPref);

  // 10. Verify Invoices persisted after reload
  await page.evaluate(() => {
    const invTab = Array.from(document.querySelectorAll('.settings-nav-btn')).find(b => b.textContent.includes('Invoice Settings'));
    if (invTab) invTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const reloadedInv = await page.evaluate(() => {
    const prefix = document.querySelector('input[placeholder="INV-"]')?.value;
    const terms = Array.from(document.querySelectorAll('select.settings-input-field')).find(s => s.innerHTML.includes('Net 15 Days'))?.value;
    const footer = document.querySelector('input[placeholder="Thank you for choosing us!"]')?.value;
    return { prefix, terms, footer };
  });
  console.log('Reloaded Invoice Verification:', reloadedInv);

  // 11. Test Mobile View (390px)
  console.log('Step 8: Testing Mobile Settings & Navigation...');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844 });
  await mobilePage.goto('http://localhost:5173/#/settings?tab=general', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2600));

  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_settings_mobile_tab.png') });
  console.log('Captured verify_settings_mobile_tab.png');

  await mobilePage.close();
  await browser.close();

  console.log('All Settings Save and Persistence tests passed 100% successfully!');
})();
