import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke-test config. Builds the static site, serves it on a local port,
 * runs the test suite against it. Run locally with `npm run test:smoke`
 * or via the smoke.yml workflow in CI.
 */
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // WebKit (Safari engine) coverage. The site is QA'd heavily on
    // iOS Safari by hand; running the smoke suite on WebKit catches
    // engine-specific regressions in the d3-geo map, the Cedar chat,
    // and the scroll/reveal scripts before they reach a phone. CI
    // installs both browsers (see .github/workflows/smoke.yml).
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
