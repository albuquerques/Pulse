import { defineConfig } from "@playwright/test";

const API_URL = "http://localhost:8787";
const WEB_URL = "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  // The suite shares one fixed user and one database, so it runs serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: { baseURL: WEB_URL, trace: "retain-on-failure" },
  webServer: [
    {
      // Direct commands, not "pnpm --filter": pnpm does not forward SIGTERM to the
      // child, so Playwright would hang waiting for the servers to die.
      command: "node src/index.ts",
      cwd: "server",
      url: `${API_URL}/health`,
      // Test-only reset endpoint: the user_id is fixed, so each test needs a clean slate.
      env: { PROTO_ALLOW_RESET: "1" },
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 30_000,
    },
    {
      command: "node_modules/.bin/vite",
      cwd: "web",
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
