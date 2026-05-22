import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

// Desktop
const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctxD.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1300);
await page.screenshot({ path: '/tmp/flow-hero.png', clip: { x: 0, y: 0, width: 1440, height: 850 } });
await ctxD.close();

// Mobile
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const mob = await ctxM.newPage();
await mob.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await mob.waitForTimeout(1500);
await mob.screenshot({ path: '/tmp/flow-mobile.png' });

await browser.close();
console.log('done');
