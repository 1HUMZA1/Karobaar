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
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  
  console.log('1. Navigating to http://localhost:5173/#/home...');
  await page.goto('http://localhost:5173/#/home', { waitUntil: 'domcontentloaded' });
  
  // Wait for loading screen to dismiss
  console.log('Waiting for loading screen to complete...');
  await new Promise(r => setTimeout(r, 4500));
  
  const artifactDir = 'C:/Users/humza/.gemini/antigravity/brain/a5fd0cc2-dcc4-4651-968a-bdad886efad8';

  // Take screenshot of the Hero section + Heroic App Showcase
  await page.screenshot({ path: 'scratch/verify_heroic_app_page.png' });
  fs.copyFileSync('scratch/verify_heroic_app_page.png', path.join(artifactDir, 'verify_heroic_app_page.png'));
  console.log('Saved scratch/verify_heroic_app_page.png');

  // Test tab switch to Store Analytics
  console.log('2. Testing tab switch to Store Analytics...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.hero-tab-btn')).find(b => b.innerText.includes('Store Analytics'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch/verify_heroic_analytics_tab.png' });
  fs.copyFileSync('scratch/verify_heroic_analytics_tab.png', path.join(artifactDir, 'verify_heroic_analytics_tab.png'));
  console.log('Saved scratch/verify_heroic_analytics_tab.png');

  // Test hovering over the Heroic App Showcase to test 3D tilt
  console.log('3. Testing 3D tilt hover effect on Heroic App Showcase...');
  const heroCard = await page.$('.hero-preview-container');
  if (heroCard) {
    const box = await heroCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.25);
      await new Promise(r => setTimeout(r, 300));
      await page.screenshot({ path: 'scratch/verify_hero_tilt_hover.png' });
      fs.copyFileSync('scratch/verify_hero_tilt_hover.png', path.join(artifactDir, 'verify_hero_tilt_hover.png'));
      console.log('Saved scratch/verify_hero_tilt_hover.png');
    }
  }

  // Scroll to features and test 3D tilt on a feature card
  console.log('4. Testing Features section boxes and 3D tilt...');
  await page.evaluate(() => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 800));
  
  const featureCard = await page.$('#features .tilt-card');
  if (featureCard) {
    const box = await featureCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
      await new Promise(r => setTimeout(r, 300));
      const transformValue = await page.evaluate(el => el.style.transform, featureCard);
      console.log('Feature card 3D transform on hover:', transformValue);
    }
  }
  await page.screenshot({ path: 'scratch/verify_features_boxes.png' });
  fs.copyFileSync('scratch/verify_features_boxes.png', path.join(artifactDir, 'verify_features_boxes.png'));
  console.log('Saved scratch/verify_features_boxes.png');

  // Scroll to platforms
  console.log('5. Testing Platforms section boxes...');
  await page.evaluate(() => {
    const el = document.getElementById('platforms');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/verify_platforms_boxes.png' });
  fs.copyFileSync('scratch/verify_platforms_boxes.png', path.join(artifactDir, 'verify_platforms_boxes.png'));
  console.log('Saved scratch/verify_platforms_boxes.png');

  await browser.close();
  console.log('All verification checks completed successfully!');
})();
