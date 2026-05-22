import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const flow = await page.locator('.hero-flow').boundingBox();
const clip = { x: flow.x + flow.width * 0.66, y: flow.y - 5, width: flow.width * 0.36, height: flow.height + 10 };
for (let i = 0; i < 14; i++) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `/tmp/casino-${String(i).padStart(2,'0')}.png`, clip });
}
// Full hero shot too
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/casino-hero.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await browser.close();
console.log('done');
