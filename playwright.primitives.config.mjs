import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "primitives.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  outputDir: "artifacts/primitives/test-results",
  use: {
    baseURL: "http://127.0.0.1:6397",
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm exec vite -- --config tests/fixtures/primitives/vite.config.mjs --host 127.0.0.1 --port 6397 --strictPort",
    url: "http://127.0.0.1:6397",
    reuseExistingServer: false,
  },
});
