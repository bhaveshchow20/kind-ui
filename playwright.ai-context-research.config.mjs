import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "ai-context-research.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  outputDir: "artifacts/ai/context-research/test-results",
  use: {
    baseURL: "http://127.0.0.1:6399",
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm exec vite -- --config tests/fixtures/ai-context-research/vite.config.mjs --host 127.0.0.1 --port 6399 --strictPort",
    url: "http://127.0.0.1:6399",
    reuseExistingServer: false,
  },
});
