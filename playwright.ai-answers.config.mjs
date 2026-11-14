import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "ai-answers.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 15000,
  outputDir: "artifacts/ai/answers-interactions",
  use: {
    baseURL: "http://127.0.0.1:6398",
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm exec vite -- --config tests/fixtures/ai-answers/vite.config.mjs --host 127.0.0.1 --port 6398 --strictPort",
    url: "http://127.0.0.1:6398",
    reuseExistingServer: false,
  },
});
