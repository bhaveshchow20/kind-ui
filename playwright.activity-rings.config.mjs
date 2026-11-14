import { defineConfig } from "@playwright/test";

process.env.KIND_UI_ACTIVITY_RINGS_URL ??= "http://127.0.0.1:7073/activity-rings.html";
export default defineConfig({
  testDir: "tests",
  testMatch: "activity-rings.spec.ts",
  workers: 1,
  outputDir: "artifacts/activity-rings-tests",
  use: {
    viewport: { width: 1000, height: 1000 },
    reducedMotion: "reduce",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command:
      "npm exec vite preview -- --outDir artifacts/packed-activity-rings --host 127.0.0.1 --port 7073 --strictPort",
    url: "http://127.0.0.1:7073/activity-rings.html",
  },
});
