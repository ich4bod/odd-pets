const { chromium } = require('playwright-core');

(async () => {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node verify-launch.js <url>');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages from the browser
  page.on('console', msg => console.error(`BROWSER: ${msg.text()}`));
  page.on('pageerror', exception => console.error(`BROWSER_ERROR: ${exception.message}`));
  page.on('requestfailed', request => console.error(`BROWSER_REQUEST_FAILED: ${request.url()} ${request.failure()?.errorText}`));

  try {
    // Use a cache buster to ensure we aren't seeing a cached version of the site
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now();
    await page.goto(cacheBustedUrl);

    // Assert exact empty headline
    const headline = await page.textContent('.headline');
    if (headline !== 'No pets yet. This is suspiciously quiet.') {
      throw new Error(`Expected headline "No pets yet. This is suspiciously quiet.", got "${headline}"`);
    }

    // Choose Blob
    const blobBtn = page.locator('button[data-creature="Blob"]');
    await blobBtn.waitFor();
    await blobBtn.click();

    // Submit Nori and Maya
    await page.fill('#pet-name', 'Nori');
    await page.fill('#pet-owner', 'Maya');
    await page.click('#submit-btn');

    // Assert visible saved tile
    const tile = page.locator('.pet-tile').first();
    await tile.waitFor({ state: 'visible', timeout: 10000 });
    
    const tileText = await tile.innerText();
    if (!tileText.includes('Blob · Maya') || !tileText.includes('a very small weather system')) {
      throw new Error(`Tile text incorrect: ${tileText}`);
    }

    // Reload
    await page.reload();

    // Assert tile still exists
    const tileAfterReload = page.locator('.pet-tile').first();
    await tileAfterReload.waitFor({ state: 'visible', timeout: 10000 });
    
    if (await tileAfterReload.count() !== 1) {
      throw new Error('Pet tile did not persist after reload');
    }

    console.log('odd pets launch verified');
  } catch (e) {
    console.error(`FAILURE: ${e.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
