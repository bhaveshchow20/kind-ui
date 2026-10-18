import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "ai-reasoning-*.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 15000,
  outputDir: "artifacts/ai/reasoning-interactions",
  use: {
    baseURL: "http://127.0.0.1:6402",
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm exec vite -- --config tests/fixtures/ai-reasoning/vite.config.mjs --host 127.0.0.1 --port 6402 --strictPort",
    url: "http://127.0.0.1:6402",
    reuseExistingServer: false,
  },
});
