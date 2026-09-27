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

  try {
    await page.goto(url);

    // Assert exact empty headline
    const headline = await page.textContent('.headline');
    if (headline !== 'No pets yet. This is suspiciously quiet.') {
      throw new Error(`Expected headline "No pets yet. This is suspiciously quiet.", got "${headline}"`);
    }

    // Choose Blob
    await page.click('button[data-creature="Blob"]');

    // Submit Nori and Maya
    await page.fill('#pet-name', 'Nori');
    await page.fill('#pet-owner', 'Maya');
    await page.click('#submit-btn');

    // Assert visible saved tile
    const tile = page.locator('.pet-tile').first();
    await tile.waitFor();
    
    const tileText = await tile.innerText();
    if (!tileText.includes('Blob · Maya') || !tileText.includes('a very small weather system')) {
      throw new Error(`Tile text incorrect: ${tileText}`);
    }

    // Reload
    await page.reload();

    // Assert tile still exists
    const tileAfterReload = page.locator('.pet-tile').first();
    if (await tileAfterReload.count() !== 1) {
      throw new Error('Pet tile did not persist after reload');
    }

    console.log('odd pets launch verified');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
