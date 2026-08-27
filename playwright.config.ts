import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
  },
  webServer: {
    command:
      'source ~/.nvm/nvm.sh && nvm use && PORT=3001 NEXT_PUBLIC_DEMO_MODE=true NEXT_PUBLIC_SHOW_DEV_PANEL=true pnpm dev',
    port: 3001,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
