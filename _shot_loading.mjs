import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const flow = await page.locator('.hero-flow').boundingBox();
const cedarClip = { x: flow.x + flow.width * 0.34, y: flow.y - 10, width: flow.width * 0.34, height: flow.height + 30 };
// 30 frames at 250ms = 7.5s (more than one full cycle)
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `/tmp/load-${String(i).padStart(2,'0')}.png`, clip: cedarClip });
}
await browser.close();
console.log('done');
