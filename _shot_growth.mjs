import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const flow = await page.locator('.hero-flow').boundingBox();
const impClip = { x: flow.x + flow.width * 0.66, y: flow.y - 10, width: flow.width * 0.36, height: flow.height + 30 };
// 14 frames at 500ms each = 7s, covering one full cycle
for (let i = 0; i < 14; i++) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `/tmp/growth-${String(i).padStart(2,'0')}.png`, clip: impClip });
}
const cedarClip = { x: flow.x + flow.width * 0.34, y: flow.y - 10, width: flow.width * 0.34, height: flow.height + 30 };
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `/tmp/growth-cedar-${String(i).padStart(2,'0')}.png`, clip: cedarClip });
}
await page.screenshot({ path: '/tmp/growth-full.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await browser.close();
console.log('done');
