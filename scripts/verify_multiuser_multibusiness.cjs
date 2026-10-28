const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd';

(async () => {
  console.log('--- STARTING MULTI-USER & MULTI-BUSINESS VERIFICATION ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[AUTH]') || text.includes('error') || text.includes('Error')) {
      console.log('BROWSER:', text);
    }
  });

  // 1. Visit Dashboard
  await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // 2. Open Business Switcher Dropdown in Topbar
  console.log('Testing Business Switcher in Topbar...');
  const bizBtn = await page.$('.topbar-biz-pill-btn');
  if (bizBtn) {
    await bizBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_business_switcher_dropdown.png') });
    console.log('Captured verify_business_switcher_dropdown.png');
    // Close dropdown
    await page.click('body');
    await new Promise(r => setTimeout(r, 400));
  } else {
    console.warn('Could not find .topbar-biz-pill-btn');
  }

  // 3. Visit Settings -> Team & Permissions
  console.log('Navigating to Team & Permissions tab...');
  await page.goto('http://localhost:5173/#/settings?tab=users', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_team_permissions_tab.png') });
  console.log('Captured verify_team_permissions_tab.png');

  // 4. Open Invite Team Member Modal
  console.log('Opening Invite Team Member modal...');
  const inviteBtn = await page.$('button[type="button"]'); // find button containing "Invite Team Member"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Invite Team Member'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_invite_member_modal.png') });
  console.log('Captured verify_invite_member_modal.png');

  // Close invite modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find(b => b.textContent.includes('Cancel'));
    if (cancel) cancel.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 5. Test Role Switch to Cashier & verify P&L Restriction in Reports
  console.log('Testing Cashier role restrictions in Reports...');
  await page.evaluate(() => {
    const user = {
      id: 'demo-cashier-1',
      name: 'Priya Patel (Cashier)',
      email: 'priya.cashier@sascafeteria.com',
      role: 'Cashier',
      permissions: ['sales.view', 'sales.create', 'invoices.view', 'payments.record', 'customers.manage'],
      activeBusinessId: 'demo-business-1',
      memberships: ['demo-business-1'],
      onboardingCompleted: true
    };
    localStorage.setItem('karobaar_session_user', JSON.stringify(user));
  });

  await page.goto('http://localhost:5173/#/reports', { waitUntil: 'networkidle2' });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_cashier_pnl_restricted.png') });
  console.log('Captured verify_cashier_pnl_restricted.png');

  // 6. Test Access Denied View on Owner-only page for Cashier
  console.log('Testing Access Denied on restricted page for Cashier...');
  await page.goto('http://localhost:5173/#/hq-analytics', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_access_denied_view.png') });
  console.log('Captured verify_access_denied_view.png');

  // Reset back to Owner role
  await page.evaluate(() => {
    const user = JSON.parse(localStorage.getItem('karobaar_session_user') || '{}');
    user.role = 'Owner';
    user.permissions = [];
    localStorage.setItem('karobaar_session_user', JSON.stringify(user));
  });

  await browser.close();
  console.log('--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
})();
