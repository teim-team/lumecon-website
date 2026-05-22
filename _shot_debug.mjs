import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
// Poll for loading visibility
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(250);
  const data = await page.evaluate(() => {
    const el = document.querySelector('.hf-loading');
    if (!el) return { exists: false };
    const cs = getComputedStyle(el);
    return {
      exists: true,
      opacity: cs.opacity,
      bbox: el.getBoundingClientRect(),
    };
  });
  console.log(`i=${i}`, JSON.stringify(data));
}
await browser.close();
