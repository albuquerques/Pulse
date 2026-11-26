import { defineConfig } from "@playwright/test";

const API_URL = "http://localhost:8787";
const WEB_URL = "http://localhost:4173";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: { baseURL: WEB_URL, trace: "retain-on-failure" },
  webServer: [
    {
      // node and vite directly, with cwd — never "pnpm --filter". pnpm does not
      // forward SIGTERM, so Playwright would never exit (lesson from T0).
      command: "node dist/index.js",
      cwd: "../apps/api",
      url: `${API_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 30_000,
    },
    {
      // The preview server serves the real build and proxies /api, so the test
      // exercises the same-origin arrangement production will use.
      command: "node_modules/.bin/vite preview --port 4173 --strictPort",
      cwd: "../apps/web",
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
