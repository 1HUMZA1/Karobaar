const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  // Set viewport to mobile to trigger MobileDashboard
  await page.setViewport({ width: 375, height: 667 });

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
