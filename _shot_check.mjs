import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.locator('#workspace').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.keyboard.press('s');
await page.waitForTimeout(7000);
const stage = await page.locator('.hero-stage').boundingBox();
await page.screenshot({ path: '/tmp/check-map.png', clip: { x: stage.x, y: stage.y, width: stage.width, height: stage.height } });

await page.locator('#cedar').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/check-cedar.png', clip: { x: 0, y: 0, width: 1440, height: 700 } });

await browser.close();
