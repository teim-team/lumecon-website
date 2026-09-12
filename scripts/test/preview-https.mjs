import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preview } from 'astro';

// Ephemeral loopback-only TLS lets both browsers exercise the production CSP.
// The certificate and private key are deleted when this preview exits.
const directory = mkdtempSync(join(tmpdir(), 'lumecon-smoke-tls-'));
const key = join(directory, 'key.pem');
const cert = join(directory, 'cert.pem');
process.on('exit', () => rmSync(directory, { recursive: true, force: true }));

execFileSync(
  'openssl',
  [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-days',
    '1',
    '-subj',
    '/CN=localhost',
    '-addext',
    'subjectAltName=DNS:localhost,IP:127.0.0.1',
    '-keyout',
    key,
    '-out',
    cert,
  ],
  { stdio: 'pipe' },
);

process.env.SMOKE_TLS_KEY = key;
process.env.SMOKE_TLS_CERT = cert;

// Astro 7.3's `astro preview` command daemonizes itself when it decides an
// AI agent launched it, then exits, which Playwright reads as the web server
// dying before it served a request. The programmatic API runs the same server
// in this process, in the foreground and without a lock file, so the wrapper
// behaves identically in a terminal, in CI and under an agent.
const server = await preview({
  root: process.cwd(),
  server: { host: '127.0.0.1', port: 4321 },
});

const stop = () => {
  server.stop().finally(() => process.exit(0));
};
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, stop);
}
await server.closed();
