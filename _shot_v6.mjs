import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();

page.on('console', msg => {
  const text = msg.text();
  if (text.includes('error') || text.includes('Error')) console.log('PAGE ERR:', text);
});

await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.locator('#workspace').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

// Search "travis" — expect Travis County, TX
await page.locator('#workspaceSearchInput').click();
await page.locator('#workspaceSearchInput').fill('travis');
await page.waitForTimeout(800);
const items1 = await page.locator('.workspace-search__item').all();
console.log('travis matches:', items1.length);
for (let i = 0; i < Math.min(items1.length, 6); i++) {
  const n = await items1[i].locator('.workspace-search__name').textContent();
  const s = await items1[i].locator('.workspace-search__sub').textContent();
  console.log(`  ${i}. ${n} — ${s}`);
}
await page.locator('#workspace').screenshot({ path: '/tmp/v6-search-travis.png' });
await items1[0].click();
await page.waitForTimeout(7500);
const region = await page.locator('#workspaceRegion').textContent();
console.log('travis fired region:', region);
await page.locator('#workspace').screenshot({ path: '/tmp/v6-travis-fired.png' });

// Open Indirect info on this county study to verify the level note
const figInfo = await page.locator('.hero-fig[data-k="indirect"] .hero-fig__info');
await figInfo.click();
await page.waitForTimeout(500);
await page.locator('#workspace').screenshot({ path: '/tmp/v6-county-figinfo.png' });

// Test "washington" — should show Washington state + Washington County (multiple)
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.locator('#workspace').scrollIntoViewIfNeeded();
await page.locator('#workspaceSearchInput').click();
await page.locator('#workspaceSearchInput').fill('washington');
await page.waitForTimeout(800);
const items2 = await page.locator('.workspace-search__item').all();
console.log('washington matches:', items2.length);
for (let i = 0; i < Math.min(items2.length, 6); i++) {
  const n = await items2[i].locator('.workspace-search__name').textContent();
  const s = await items2[i].locator('.workspace-search__sub').textContent();
  console.log(`  ${i}. ${n} — ${s}`);
}
await page.locator('#workspace').screenshot({ path: '/tmp/v6-search-washington.png' });

await browser.close();
