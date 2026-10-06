import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: "series-colors.spec.ts",
  workers: 1,
  projects: [{ name: "series-colors-focused" }],
  outputDir: "artifacts/series-colors-tests",
  use: {
    baseURL: "http://127.0.0.1:6898/",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command:
      "npm exec vite tests/fixtures/identity-colors -- --host 127.0.0.1 --port 6898 --strictPort",
    url: "http://127.0.0.1:6898",
  },
});
