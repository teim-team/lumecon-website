import { chromium } from '@playwright/test';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
const DIST = '/home/user/lumecon-website/dist';
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };
const srv = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = join(DIST, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) f = join(DIST, p, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); res.end('nope'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise(r => srv.listen(4351, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const OUT = process.env.OUT;
const PAGES = ['/', '/cedar', '/pricing', '/methodology', '/glossary', '/signup', '/login', '/checkout', '/accessibility', '/terms', '/privacy', '/film', '/404.html'];
const W = [[1440, 2400], [768, 2000], [375, 1600]];
for (const path of PAGES) {
  for (const [w, h] of W) {
    const ctx = await browser.newContext({ viewport: { width: w, height: Math.min(h, 4000) }, colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:4351' + path, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await page.waitForTimeout(350);
    const slug = path === '/' ? 'home' : path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    await page.screenshot({ path: `${OUT}/${slug}-${w}.png`, fullPage: true });
    await ctx.close();
  }
}
// Docked Cedar chat open: desktop + mobile.
for (const [w, h, name] of [[1440, 900, 'fab-open-1440'], [375, 750, 'fab-open-375']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4351/pricing', { waitUntil: 'networkidle' });
  await page.locator('#cedarFab').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
}
await browser.close(); srv.close(); console.log('done');
