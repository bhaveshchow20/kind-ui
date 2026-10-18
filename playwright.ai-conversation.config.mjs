import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "ai-conversation-review.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  outputDir: "artifacts/ai/conversation-review",
  use: {
    baseURL: "http://127.0.0.1:6405",
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm exec vite -- --config tests/fixtures/ai-conversation/vite.config.mjs --host 127.0.0.1 --port 6405 --strictPort",
    url: "http://127.0.0.1:6405",
    reuseExistingServer: false,
  },
});
