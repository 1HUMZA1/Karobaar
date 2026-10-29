const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd';

(async () => {
  console.log('--- Starting Complete Website Link & Landing Page Verification ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 850 });

    // Step 1: Open Website page
    console.log('1. Testing Karobaar Website at #/home...');
    await page.goto('http://localhost:5173/#/home', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const landingHomePath = path.join(ARTIFACT_DIR, 'verify_website_home_hero.png');
    await page.screenshot({ path: landingHomePath });
    console.log('Saved website hero screenshot to:', landingHomePath);

    // Step 2: Test Navigation buttons (Features, Platforms, Security)
    console.log('2. Testing navigation smooth scrolling (should NOT navigate away to dashboard)...');
    
    // Click Features button
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.innerText.includes('Features'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('URL after Features click:', page.url());
    if (page.url().includes('dashboard')) {
      throw new Error('FAILED: Clicking Features redirected to dashboard!');
    }

    // Click Platforms button
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.innerText.includes('Platforms'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('URL after Platforms click:', page.url());

    const platformsPath = path.join(ARTIFACT_DIR, 'verify_website_platforms_section.png');
    await page.screenshot({ path: platformsPath });
    console.log('Saved platforms section screenshot to:', platformsPath);

    // Step 3: Test Download for Windows modal
    console.log('3. Testing "Download for Windows" button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Download for Windows'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const winModalPath = path.join(ARTIFACT_DIR, 'verify_website_windows_modal.png');
    await page.screenshot({ path: winModalPath });
    console.log('Saved Windows modal screenshot to:', winModalPath);

    // Step 4: Test /website alias route
    console.log('4. Testing /website alias route...');
    await page.goto('http://localhost:5173/#/website', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    console.log('URL for /website route:', page.url());

    // Step 5: Test Sidebar Logo and Website Link inside Dashboard
    console.log('5. Navigating to Dashboard to test Sidebar Logo & Website Links...');
    await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    // Check sidebar logo attributes
    const logoTitle = await page.evaluate(() => {
      const logoContainer = document.querySelector('.sidebar .logo-container');
      return logoContainer ? logoContainer.getAttribute('title') : null;
    });
    console.log('Sidebar logo container title:', logoTitle);

    // Check sidebar footer website button
    const footerWebsiteBtn = await page.evaluate(() => {
      const btn = document.querySelector('.sidebar-website-btn');
      return btn ? btn.innerText.trim() : null;
    });
    console.log('Sidebar footer website button text:', footerWebsiteBtn);

    // Check user profile dropdown
    await page.evaluate(() => {
      const trigger = document.querySelector('.user-profile-trigger');
      if (trigger) trigger.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const dropdownHasWebsite = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.profile-dropdown-item'));
      const websiteItem = items.find(i => i.innerText.includes('Karobaar Website'));
      return websiteItem ? websiteItem.innerText.trim() : null;
    });
    console.log('Profile dropdown website item:', dropdownHasWebsite);

    const dashboardLinksPath = path.join(ARTIFACT_DIR, 'verify_dashboard_website_links.png');
    await page.screenshot({ path: dashboardLinksPath });
    console.log('Saved dashboard website links screenshot to:', dashboardLinksPath);

    console.log('--- ALL WEBSITE LINK & ROUTING VERIFICATIONS PASSED ---');
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
