import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop-edge', use: { browserName: 'chromium', channel: 'msedge', viewport: { width: 1440, height: 900 } } },
    { name: 'portrait-edge', use: { ...devices['Pixel 7'], browserName: 'chromium', channel: 'msedge' } },
  ],
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 30_000 },
});
