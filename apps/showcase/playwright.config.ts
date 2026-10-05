import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:4875", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 4875",
    url: "http://127.0.0.1:4875",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
