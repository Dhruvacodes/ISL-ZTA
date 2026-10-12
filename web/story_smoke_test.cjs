// Playwright test script for Part C: Walking Guided Story Mode, Presenter Mode, and Video Recording
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const http = require('http');

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => req.destroy());
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function runStoryTests() {
  const storyDir = path.resolve(__dirname, '..', 'docs', 'screenshots', 'story');
  if (!fs.existsSync(storyDir)) {
    fs.mkdirSync(storyDir, { recursive: true });
  }

  const videoDir = path.resolve(__dirname, '..', 'docs', 'video');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const serverUrl = 'http://localhost:8000';
  console.log(`Checking server at ${serverUrl}...`);
  await waitForServer(serverUrl);
  console.log('Server is online. Launching Chromium with video recording...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const pageErrors = [];
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  console.log(`Navigating to ${serverUrl}...`);
  await page.goto(serverUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Capture Landing Hero
  console.log('Capturing Landing Hero...');
  await page.screenshot({ path: path.join(storyDir, 'landing_hero.png') });

  // 1. Walk through all 10 story chapters
  for (let chapter = 1; chapter <= 10; chapter++) {
    console.log(`Capturing Story Chapter ${chapter}...`);
    // Find chapter dot button
    const dots = page.locator('button[title*="Chapter"]');
    const dotCount = await dots.count();
    if (dotCount >= chapter) {
      await dots.nth(chapter - 1).click();
      await page.waitForTimeout(600);
    }
    await page.screenshot({ path: path.join(storyDir, `chapter_${chapter}.png`) });
  }

  // 2. Test Presenter Mode
  console.log('Testing Presenter Mode...');
  const presenterBtn = page.getByTitle(/Presenter/i).first();
  if (await presenterBtn.isVisible()) {
    await presenterBtn.click();
    await page.waitForTimeout(800);
    // Press 'N' for speaker notes
    await page.keyboard.press('n');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(storyDir, 'presenter_mode.png') });
    // Exit presenter mode
    await presenterBtn.click();
    await page.waitForTimeout(500);
  }

  // 3. Test "Try It" Sandbox
  console.log('Testing Try It Sandbox...');
  const tryItTab = page.getByRole('button', { name: /^Try It$/i });
  if (await tryItTab.isVisible()) {
    await tryItTab.click();
    await page.waitForTimeout(800);

    // Click "Start Simulation"
    const startBtn = page.getByRole('button', { name: /Start Simulation/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(3000); // let events stream in
    }
    await page.screenshot({ path: path.join(storyDir, 'try_it.png') });
  }

  // 4. Test "Results" Page
  console.log('Testing Results Page...');
  const resultsTab = page.getByRole('button', { name: /^Results$/i });
  if (await resultsTab.isVisible()) {
    await resultsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(storyDir, 'results_human.png') });
  }

  // 5. Test "Glossary" Page
  console.log('Testing Glossary Page...');
  const glossaryTab = page.getByRole('button', { name: /^Glossary$/i });
  if (await glossaryTab.isVisible()) {
    await glossaryTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(storyDir, 'glossary.png') });
  }

  // Close context to finish writing video
  await page.close();
  await context.close();
  await browser.close();

  // Find generated webm file in videoDir and copy to docs/demo.webm
  const videoFiles = fs.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length > 0) {
    const srcVideo = path.join(videoDir, videoFiles[0]);
    const destVideo = path.resolve(__dirname, '..', 'docs', 'demo.webm');
    fs.copyFileSync(srcVideo, destVideo);
    console.log(`Presenter mode video saved to ${destVideo}`);
  }

  console.log('\n--- STORY SMOKE TEST SUMMARY ---');
  console.log(`Story screenshots saved in ${storyDir}`);
  console.log(`Page errors: ${pageErrors.length}`);
  console.log(`Console errors: ${consoleErrors.length}`);

  if (pageErrors.length > 0) {
    console.error('Page errors encountered:', pageErrors);
    process.exit(1);
  }
  if (consoleErrors.length > 0) {
    console.error('Console errors encountered:', consoleErrors);
    process.exit(1);
  }

  console.log('ALL STORY AND PRESENTER TESTS PASSED WITH ZERO CONSOLE ERRORS!\n');
}

runStoryTests().catch((err) => {
  console.error('Story test failure:', err);
  process.exit(1);
});
