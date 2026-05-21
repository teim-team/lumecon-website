import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

// Desktop pass
const ctxDesk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctxDesk.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1300);
await page.screenshot({ path: '/tmp/v7-nav.png', clip: { x: 0, y: 0, width: 1440, height: 100 } });

await page.locator('#cedar').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const cedarBox = await page.locator('#cedar').boundingBox();
await page.screenshot({ path: '/tmp/v7-cedar-section.png', clip: { x: cedarBox.x, y: cedarBox.y - 20, width: cedarBox.width, height: 720 } });

await page.locator('.cedar-chip').first().hover();
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/v7-cedar-chip-hover.png', clip: { x: cedarBox.x, y: cedarBox.y - 20, width: cedarBox.width, height: 720 } });

await page.locator('#products').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const productsBox = await page.locator('#products').boundingBox();
await page.screenshot({ path: '/tmp/v7-products.png', clip: { x: productsBox.x, y: productsBox.y - 20, width: productsBox.width, height: 800 } });

await page.locator('#contact').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const contactBox = await page.locator('#contact').boundingBox();
await page.screenshot({ path: '/tmp/v7-contact.png', clip: { x: contactBox.x, y: contactBox.y - 20, width: contactBox.width, height: 500 } });
await ctxDesk.close();

// Mobile pass
const ctxMob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const mob = await ctxMob.newPage();
await mob.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await mob.waitForTimeout(1500);
await mob.screenshot({ path: '/tmp/v7-mobile-hero.png', fullPage: false });
await mob.evaluate(() => window.scrollTo(0, 1200));
await mob.waitForTimeout(400);
await mob.screenshot({ path: '/tmp/v7-mobile-mid.png', fullPage: false });
await mob.evaluate(() => window.scrollTo(0, 3200));
await mob.waitForTimeout(400);
await mob.screenshot({ path: '/tmp/v7-mobile-cedar.png', fullPage: false });
await mob.evaluate(() => window.scrollTo(0, 4400));
await mob.waitForTimeout(400);
await mob.screenshot({ path: '/tmp/v7-mobile-contact.png', fullPage: false });

await browser.close();
console.log('done');
