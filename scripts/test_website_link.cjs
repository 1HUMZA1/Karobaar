const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/#/home', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Current URL before click:', page.url());
  // Click on Features link
  await page.click('a[href="#features"]');
  await new Promise(r => setTimeout(r, 1000));
  console.log('Current URL after clicking Features:', page.url());
  
  await browser.close();
})();
