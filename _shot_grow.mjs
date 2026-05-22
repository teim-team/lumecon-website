import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const flow = await page.locator('.hero-flow').boundingBox();
const impactClip = { x: flow.x + flow.width * 0.68, y: flow.y - 5, width: flow.width * 0.32, height: flow.height + 10 };

// Capture impact at several points across the cycle to see build → grow
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `/tmp/grow-${String(i).padStart(2,'0')}.png`, clip: impactClip });
}

await browser.close();
console.log('done');
