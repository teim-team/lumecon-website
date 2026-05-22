import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.screenshot({ path: '/tmp/v10-hero.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

// Cedar section
await page.locator('#cedar').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/v10-cedar.png', clip: { x: 0, y: 0, width: 1440, height: 800 } });

await browser.close();
console.log('done');
