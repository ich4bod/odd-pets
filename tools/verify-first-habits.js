const { chromium } = require('playwright-core');

(async () => {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node verify-first-habits.js <url>');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const creatureTypes = [
      { name: 'Moth', habit: 'Moth has begun cataloguing lamps by mood.' },
      { name: 'Frog', habit: 'Frog now insists every puddle has an accent.' },
      { name: 'Blob', habit: 'Blob has learned to look bean-shaped on purpose.' }
    ];

    for (const { name, habit } of creatureTypes) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url);

      const petName = `${name} Test`;
      const petOwner = `Owner ${name}`;
      
      await page.click(`button[data-creature="${name}"]`);
      await page.fill('#pet-name', petName);
      await page.fill('#pet-owner', petOwner);
      await page.click('#submit-btn');

      const tile = page.locator('.pet-tile').filter({ hasText: petName }).first();
      await tile.waitFor({ state: 'visible' });

      const localStorageData = await page.evaluate(() => localStorage.getItem('odd-pets-v1'));
      if (!localStorageData) {
        throw new Error('No localStorage found');
      }
      const pets = JSON.parse(localStorageData);
      const pet = pets.find(p => p.name === petName);
      if (!pet) {
        throw new Error(`Could not find pet ${petName} in localStorage`);
      }
      pet.snacks = 3;
      
      await page.evaluate((data) => {
        localStorage.setItem('odd-pets-v1', JSON.stringify(data));
      }, pets);

      await page.reload();
      await tile.waitFor({ state: 'visible' });

      const habitSection = tile.locator('section.pet-habit');
      await habitSection.waitFor({ state: 'visible' });

      const eyebrow = habitSection.locator('.pet-habit-eyebrow');
      const eyebrowText = await eyebrow.textContent();
      if (eyebrowText?.trim() !== 'A SMALL HABIT') {
        throw new Error(`Expected eyebrow "A SMALL HABIT", got "${eyebrowText}"`);
      }

      const sentence = habitSection.locator('.pet-habit-sentence');
      const sentenceText = await sentence.textContent();
      if (sentenceText?.trim() !== habit) {
        throw new Error(`Expected habit "${habit}", got "${sentenceText}"`);
      }

      await context.close();
    }

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(url);

    const frogName = 'Frog Two';
    const frogOwner = 'Owner Two';
    await page2.click('button[data-creature="Frog"]');
    await page2.fill('#pet-name', frogName);
    await page2.fill('#pet-owner', frogOwner);
    await page2.click('#submit-btn');

    const tile2 = page2.locator('.pet-tile').filter({ hasText: frogName }).first();
    await tile2.waitFor({ state: 'visible' });

    const localStorageData2 = await page2.evaluate(() => localStorage.getItem('odd-pets-v1'));
    const pets2 = JSON.parse(localStorageData2);
    const pet2 = pets2.find(p => p.name === frogName);
    pet2.snacks = 2;
    await page2.evaluate((data) => {
      localStorage.setItem('odd-pets-v1', JSON.stringify(data));
    }, pets2);

    await page2.reload();
    await tile2.waitFor({ state: 'visible' });

    const habitSection2 = tile2.locator('section.pet-habit');
    if (await habitSection2.count() > 0) {
      throw new Error('Found .pet-habit for a pet with only 2 snacks');
    }

    await page2.setViewportSize({ width: 360, height: 800 });
    
    const isNotScrolling = await page2.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    if (!isNotScrolling) {
      throw new Error('Page is horizontally scrolling at 360px width');
    }

    await context2.close();
    console.log('odd pets first habits verified');
    await browser.close();
  } catch (e) {
    console.error(e.message);
    await browser.close();
    process.exit(1);
  }
})();
