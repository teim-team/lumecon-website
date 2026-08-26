import { existsSync } from 'node:fs';
import { defineConfig, devices, chromium, webkit } from '@playwright/test';

/**
 * Smoke-test config. Builds the static site, serves it on a local port,
 * runs the test suite against it. Run locally with `npm run test:smoke`
 * or via the smoke.yml workflow in CI.
 */

/* Sandboxed/CI-adjacent environments often provide a system Chromium
 * instead of the exact build this Playwright version pins (the managed
 * containers ship /opt/pw-browsers/chromium while Playwright asks for a
 * newer revision that was never installed — that mismatch used to fail
 * every test before a single assertion ran). Resolution order:
 *   1. PW_CHROMIUM_EXECUTABLE, when set, always wins.
 *   2. Playwright's own pinned browser, when it is actually installed —
 *      the normal case, including GitHub CI which installs it.
 *   3. The container's /opt/pw-browsers/chromium symlink, as a fallback
 *      so the suite runs in sandboxes without any setup.
 * WebKit has no such fallback; its project simply requires a real
 * install (CI does one; the smoke workflow marks WebKit informational).
 */
function chromiumExecutablePath(): string | undefined {
  if (process.env.PW_CHROMIUM_EXECUTABLE) return process.env.PW_CHROMIUM_EXECUTABLE;
  try {
    const pinned = chromium.executablePath();
    if (pinned && existsSync(pinned)) return undefined; // use Playwright's own
  } catch {
    /* fall through to the container fallback */
  }
  const fallback = '/opt/pw-browsers/chromium';
  return existsSync(fallback) ? fallback : undefined;
}
const chromiumExecutable = chromiumExecutablePath();

/* WebKit has no system fallback, so where its pinned build is not
 * installed (the sandboxes above), its project is dropped instead of
 * failing all of its tests before an assertion runs. CI installs both
 * browsers and keeps full WebKit coverage. */
function webkitInstalled(): boolean {
  try {
    const pinned = webkit.executablePath();
    return Boolean(pinned && existsSync(pinned));
  } catch {
    return false;
  }
}
const includeWebkit = webkitInstalled();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // The executable override belongs to the Chromium project only: at
        // the top level the WebKit project inherited it and tried to launch
        // the Chromium binary as Safari.
        ...(chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}),
      },
    },
    // WebKit (Safari engine) coverage. The site is QA'd heavily on
    // iOS Safari by hand; running the smoke suite on WebKit catches
    // engine-specific regressions in the d3-geo map, the Cedar chat,
    // and the scroll/reveal scripts before they reach a phone. CI
    // installs both browsers (see .github/workflows/smoke.yml).
    ...(includeWebkit ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }] : []),
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
