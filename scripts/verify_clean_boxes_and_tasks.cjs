const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/humza/.gemini/antigravity/brain/0e0c8d6e-aa77-4d11-89ee-26bcd9e37ddd';

(async () => {
  console.log('--- Starting Clean Boxes & Tasks Modal Verification ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. Open Tasks page
    console.log('Navigating to Tasks page (#/tasks)...');
    await page.goto('http://localhost:5173/#/tasks', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // Open modal
    console.log('Opening modal...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('Create Task') || b.innerText.includes('New Task')
      );
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Fill title
    await page.evaluate(() => {
      const chip = document.querySelector('.task-chip-btn');
      if (chip) chip.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Click modal submit button
    console.log('Clicking Add Task button inside modal...');
    await page.evaluate(() => {
      const submitBtn = document.querySelector('.biz-modal-content button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await new Promise(r => setTimeout(r, 1200));

    // Capture board screenshot with new task
    const boardPath = path.join(ARTIFACT_DIR, 'verify_clean_tasks_board_full.png');
    await page.screenshot({ path: boardPath, fullPage: false });
    console.log('Saved board screenshot to:', boardPath);

    // Test status progression: click Start
    console.log('Clicking Start on first task...');
    await page.evaluate(() => {
      const startBtn = document.querySelector('.task-action-pill-btn');
      if (startBtn) startBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const boardMovedPath = path.join(ARTIFACT_DIR, 'verify_clean_tasks_board_moved.png');
    await page.screenshot({ path: boardMovedPath, fullPage: false });
    console.log('Saved moved task screenshot to:', boardMovedPath);

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
})();
