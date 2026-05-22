import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1300);
await page.screenshot({ path: '/tmp/c-hero.png', clip: { x: 0, y: 0, width: 1440, height: 750 } });

await page.locator('#how').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/c-why.png', clip: { x: 0, y: 0, width: 1440, height: 650 } });

await page.locator('#contact').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/c-contact.png', clip: { x: 0, y: 0, width: 1440, height: 650 } });

await browser.close();
console.log('done');
