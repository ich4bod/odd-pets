const { chromium } = require('playwright-core');

(async () => {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node verify-daily-care.js <url>');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.error(`BROWSER: ${msg.text()}`));
  page.on('pageerror', exception => console.error(`BROWSER_ERROR: ${exception.message}`));
  page.on('requestfailed', request => console.error(`BROWSER_REQUEST_FAILED: ${request.url()} ${request.failure()?.errorText}`));

  try {
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now();
    await page.goto(cacheBustedUrl);

    // 1. Create a Frog named Pip owned by Maya
    const frogBtn = page.locator('button[data-creature="Frog"]');
    await frogBtn.waitFor();
    await frogBtn.click();

    await page.fill('#pet-name', 'Pip');
    await page.fill('#pet-owner', 'Maya');
    await page.click('#submit-btn');

    // Assert tile exists
    const tile = page.locator('.pet-tile').filter({ hasText: 'Pip' }).first();
    await tile.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found tile for Pip');

    const allTiles = await page.locator('.pet-tile').all();
    console.log(`Found ${allTiles.length} pet tiles`);
    for (const t of allTiles) {
      console.log(`Tile text: ${await t.innerText()}`);
    }

    // 2. Click 'Give a snack'
    const snackBtn = tile.locator('button.pet-care-btn');
    console.log('Looking for snack button...');
    await snackBtn.waitFor({ state: 'visible', timeout: 5000 });
    await snackBtn.click();

    // 3. Assert Frog says this snack has excellent bounce.
    const resultText = await tile.locator('.pet-care-result').innerText();
    if (resultText !== 'Frog says this snack has excellent bounce.') {
      throw new Error(`Expected snack result "Frog says this snack has excellent bounce.", got "${resultText}"`);
    }

    // 4. Assert 1 snack remembered.
    const countText = await tile.locator('.pet-care-count').innerText();
    if (countText !== '1 snack remembered.') {
      throw new Error(`Expected count "1 snack remembered.", got "${countText}"`);
    }

    // 5. Reload and assert both remain
    await page.reload();
    const tileAfterReload = page.locator('.pet-tile').filter({ hasText: 'Pip' }).first();
    await tileAfterReload.waitFor({ state: 'visible', timeout: 10000 });

    const resultTextAfter = await tileAfterReload.locator('.pet-care-result').innerText();
    if (resultTextAfter !== 'Frog says this snack has excellent bounce.') {
      throw new Error(`Expected snack result to persist: "${resultTextAfter}"`);
    }

    const countTextAfter = await tileAfterReload.locator('.pet-care-count').innerText();
    if (countTextAfter !== '1 snack remembered.') {
      throw new Error(`Expected count to persist: "${countTextAfter}"`);
    }

    // 6. Ensure no 'Give a snack' button exists for Pip
    const snackBtnAfter = tileAfterReload.locator('button.pet-care-btn');
    if (await snackBtnAfter.count() > 0) {
      throw new Error('Snack button still exists after snacking.');
    }

    console.log('odd pets daily care verified');
  } catch (e) {
    console.error(`FAILURE: ${e.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
