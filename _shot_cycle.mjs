import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

const stage = await page.locator('.hero-flow').boundingBox();
const clip = { x: stage.x, y: stage.y - 10, width: stage.width, height: stage.height + 20 };

// Capture every ~600ms to see the merge phases
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `/tmp/v10-cycle-${i}.png`, clip });
}

await browser.close();
console.log('done');
