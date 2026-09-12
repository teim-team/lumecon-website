import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

const preview = spawn(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', '4321'],
  {
    stdio: 'inherit',
    env: { ...process.env, SMOKE_TLS_KEY: key, SMOKE_TLS_CERT: cert },
  },
);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => preview.kill(signal));
}
preview.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
preview.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
