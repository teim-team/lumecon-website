import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// 1. Hero
await page.screenshot({ path: '/tmp/m-1-hero.png' });

// 2. Workspace + map
await page.evaluate(() => {
  const ws = document.getElementById('workspace');
  if (ws) ws.scrollIntoView({ behavior: 'instant', block: 'start' });
});
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/m-2-workspace-top.png' });

// 3. Cedar section
await page.evaluate(() => {
  const c = document.getElementById('cedar');
  if (c) c.scrollIntoView({ behavior: 'instant', block: 'start' });
});
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/m-3-cedar.png' });

// 4. Cedar chat lower (input + chips)
await page.evaluate(() => window.scrollBy(0, 400));
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/m-4-cedar-chat.png' });

// 5. Products section
await page.evaluate(() => {
  const p = document.getElementById('products');
  if (p) p.scrollIntoView({ behavior: 'instant', block: 'start' });
});
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/m-5-products.png' });

// 6. Contact section
await page.evaluate(() => {
  const c = document.getElementById('contact');
  if (c) c.scrollIntoView({ behavior: 'instant', block: 'start' });
});
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/m-6-contact.png' });

// 7. Open hamburger menu
await page.evaluate(() => { window.scrollTo(0, 0); });
await page.waitForTimeout(400);
await page.locator('#hamburger').click();
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/m-7-menu.png' });

await browser.close();
console.log('done');
