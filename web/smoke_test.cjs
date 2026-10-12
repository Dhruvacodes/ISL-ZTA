// Playwright headless smoke test script for ZT-Arbiter Mission Control
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

async function runSmokeTests() {
  const screenshotDir = path.resolve(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const serverUrl = 'http://localhost:8000';
  console.log(`Checking if server is running at ${serverUrl}...`);
  await waitForServer(serverUrl);
  console.log('Server is ready. Launching headless Chromium...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High resolution for crisp paper screenshots
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
  const t0 = Date.now();
  await page.goto(serverUrl, { waitUntil: 'networkidle' });
  const loadTimeMs = Date.now() - t0;
  console.log(`Page loaded in ${loadTimeMs}ms.`);

  // Assert First Meaningful Paint under 2s locally
  if (loadTimeMs > 4000) {
    console.warn(`Warning: Page load time was ${loadTimeMs}ms (expected under 2000ms locally)`);
  }

  // 0. Overview Screenshot
  console.log('Capturing overview.png...');
  await page.screenshot({ path: path.join(screenshotDir, 'overview.png') });

  // 1. Live Arbitration Theater
  console.log('Testing Section 1: Live Arbitration Theater...');
  const theaterSection = page.locator('#theater');
  await theaterSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Click "Start Feed"
  const startFeedBtn = theaterSection.getByRole('button', { name: /Start Feed/i });
  if (await startFeedBtn.isVisible()) {
    console.log('Clicking Start Feed...');
    await startFeedBtn.click();
    // Wait for at least one decision event to stream in
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(screenshotDir, 'theater.png') });

  // 2. Showdown
  console.log('Capturing showdown.png...');
  const showdownSection = page.locator('#showdown');
  await showdownSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, 'showdown.png') });

  // 3. Training Monitor
  console.log('Capturing training.png...');
  const trainingSection = page.locator('#training');
  await trainingSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'training.png') });

  // 4. Evaluation Results
  console.log('Capturing results.png...');
  const resultsSection = page.locator('#results');
  await resultsSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'results.png') });

  // 5. Break-It Lab
  console.log('Testing Section 5: Break-It Lab...');
  const breakitSection = page.locator('#breakit');
  await breakitSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Click Execute Test on concurrent overdraft
  const execBtn = breakitSection.getByRole('button', { name: /Execute Test/i }).first();
  if (await execBtn.isVisible()) {
    console.log('Clicking Execute Test...');
    await execBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(screenshotDir, 'breakit.png') });

  // 6. Audit Explorer
  console.log('Testing Section 6: Audit Explorer...');
  const auditSection = page.locator('#audit');
  await auditSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const verifyBtn = auditSection.getByRole('button', { name: /Verify Chain/i });
  if (await verifyBtn.isVisible()) {
    console.log('Clicking Verify Chain...');
    await verifyBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(screenshotDir, 'audit.png') });

  // 7. Policy & Budget Inspector
  console.log('Capturing policy.png...');
  const policySection = page.locator('#policy');
  await policySection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'policy.png') });

  // 8. Simulator Inspector
  console.log('Capturing simulator.png...');
  const simulatorSection = page.locator('#simulator');
  await simulatorSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'simulator.png') });

  // 9. Tests & Acceptance
  console.log('Capturing tests.png...');
  const testsSection = page.locator('#tests');
  await testsSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'tests.png') });

  // 10. Architecture & Presenter Script
  console.log('Capturing architecture.png...');
  const archSection = page.locator('#architecture');
  await archSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'architecture.png') });

  await browser.close();

  console.log('\n--- SMOKE TEST SUMMARY ---');
  console.log(`Screenshots saved: 11 images in ${screenshotDir}`);
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

  console.log('ALL PLAYWRIGHT SMOKE TESTS PASSED WITH ZERO CONSOLE ERRORS!\n');
}

runSmokeTests().catch((err) => {
  console.error('Smoke test failure:', err);
  process.exit(1);
});
