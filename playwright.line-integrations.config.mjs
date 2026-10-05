import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: "line-integrations.spec.ts",
  workers: 1,
  outputDir: "artifacts/line-integration-tests",
  use: {
    baseURL: "http://127.0.0.1:6900",
    viewport: { width: 1000, height: 1000 },
    reducedMotion: "reduce",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: [
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-line-integrations --host 127.0.0.1 --port 6900 --strictPort",
      url: "http://127.0.0.1:6900",
    },
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-line-next --host 127.0.0.1 --port 6901 --strictPort",
      url: "http://127.0.0.1:6901",
    },
  ],
});
