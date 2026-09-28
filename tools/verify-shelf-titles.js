const { chromium } = require('playwright-core');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node verify-shelf-titles.js <url>');
  process.exit(1);
}

const creatures = [
  { name: 'Moth', title: 'LAMP LIBRARIAN', habit: 'Moth has begun cataloguing lamps by mood.' },
  { name: 'Frog', title: 'PUDDLE DIALECTICIAN', habit: 'Frog now insists every puddle has an accent.' },
  { name: 'Blob', title: 'BEAN APPRENTICE', habit: 'Blob has learned to look bean-shaped on purpose.' }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const creature of creatures) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url);

      const petName = `${creature.name} Shelf Test`;
      await page.click(`button[data-creature="${creature.name}"]`);
      await page.fill('#pet-name', petName);
      await page.fill('#pet-owner', `Owner ${creature.name}`);
      await page.click('#submit-btn');

      const tile = page.locator('.pet-tile').filter({ hasText: petName }).first();
      await tile.waitFor({ state: 'visible' });
      const pets = JSON.parse(await page.evaluate(() => localStorage.getItem('odd-pets-v1')));
      const pet = pets.find(candidate => candidate.name === petName);
      if (!pet) throw new Error(`Could not find ${petName} in localStorage`);
      pet.snacks = 6;
      await page.evaluate(data => localStorage.setItem('odd-pets-v1', JSON.stringify(data)), pets);
      await page.reload();
      await tile.waitFor({ state: 'visible' });

      const title = tile.locator('.pet-title');
      if ((await title.textContent()).trim() !== creature.title) {
        throw new Error(`Expected ${creature.title} for ${creature.name}`);
      }
      const habit = tile.locator('.pet-habit-sentence');
      if ((await habit.textContent()).trim() !== creature.habit) {
        throw new Error(`Expected existing habit for ${creature.name}`);
      }
      await context.close();
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    const petName = 'Blob Not Yet';
    await page.click('button[data-creature="Blob"]');
    await page.fill('#pet-name', petName);
    await page.fill('#pet-owner', 'Owner Blob');
    await page.click('#submit-btn');
    const tile = page.locator('.pet-tile').filter({ hasText: petName }).first();
    await tile.waitFor({ state: 'visible' });
    const pets = JSON.parse(await page.evaluate(() => localStorage.getItem('odd-pets-v1')));
    pets.find(pet => pet.name === petName).snacks = 5;
    await page.evaluate(data => localStorage.setItem('odd-pets-v1', JSON.stringify(data)), pets);
    await page.reload();
    await tile.waitFor({ state: 'visible' });
    if (await tile.locator('.pet-title').count() !== 0) {
      throw new Error('Found .pet-title for a pet with only 5 snacks');
    }
    for (const creature of creatures) {
      if ((await tile.textContent()).includes(creature.title)) {
        throw new Error(`Found title string ${creature.title} below the threshold`);
      }
    }

    await page.setViewportSize({ width: 360, height: 800 });
    const isNotScrolling = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    if (!isNotScrolling) throw new Error('Page is horizontally scrolling at 360px width');
    await context.close();

    console.log('odd pets shelf titles verified');
    await browser.close();
  } catch (error) {
    console.error(error.message);
    await browser.close();
    process.exit(1);
  }
})();
