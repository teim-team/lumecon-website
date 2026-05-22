import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const flow = await page.locator('.hero-flow').boundingBox();
// Capture each animation phase, focusing on the impact icon detail
const phases = [
  { delay: 0,    name: 'phase-0' },
  { delay: 1000, name: 'phase-1' },
  { delay: 2000, name: 'phase-2' },
  { delay: 3000, name: 'phase-3' },
  { delay: 4000, name: 'phase-4' },
  { delay: 5000, name: 'phase-5' },
];
for (const p of phases) {
  await page.waitForTimeout(p.delay);
  await page.screenshot({ path: `/tmp/v11-${p.name}.png`, clip: { x: flow.x, y: flow.y - 10, width: flow.width, height: flow.height + 20 } });
}

// Also a focused close-up on the impact (right station)
await page.screenshot({ path: '/tmp/v11-impact-zoom.png', clip: { x: flow.x + flow.width * 0.7, y: flow.y, width: flow.width * 0.3, height: flow.height } });

await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/v11-hero.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

await browser.close();
console.log('done');
