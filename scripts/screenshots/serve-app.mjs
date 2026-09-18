/* Minimal static server with SPA fallback, for driving the built app under
   Playwright. The app is a client-side router, so any /app/* path has to
   return index.html rather than 404. */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, relative, isAbsolute } from 'node:path';

const ROOT = resolve(process.argv[2]);
const PORT = Number(process.argv[3] || 4399);
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

/* Whether a resolved path is still inside ROOT. `join` normalizes `..`
   away, so a request carrying percent-encoded parent segments
   (`/%2e%2e/%2e%2e/etc/passwd`) decoded to a path outside the served
   directory and this server answered 200 with that host file. Compared on
   the resolved paths with `relative`, not with `startsWith`, so a sibling
   directory named like ROOT plus a suffix cannot pass either. */
function insideRoot(candidate) {
  const rel = relative(ROOT, candidate);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

createServer((req, res) => {
  let url;
  try {
    url = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    // A malformed percent-escape is not a path worth guessing at.
    res.writeHead(400);
    res.end('bad request');
    return;
  }
  let file = resolve(join(ROOT, url));
  if (!insideRoot(file)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');
  try {
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} on ${PORT}`));
