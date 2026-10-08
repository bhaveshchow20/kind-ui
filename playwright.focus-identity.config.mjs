import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  workers: 1,
  testMatch: [
    "focus-identity.spec.ts",
    "polar-hide.spec.ts",
    "pie-hide.spec.ts",
    "standalone-focus.spec.ts",
  ],
  outputDir: "artifacts/focus-identity",
  use: {
    baseURL: "http://127.0.0.1:6378",
    viewport: { width: 1200, height: 900 },
    reducedMotion: "no-preference",
    channel: process.env.KIND_UI_TEST_CHROME ? "chrome" : undefined,
  },
  webServer: {
    command:
      "npm exec vite -- tests/fixtures/focus-identity --config tests/fixtures/focus-identity/vite.config.mjs --host 127.0.0.1 --port 6378 --strictPort",
    url: "http://127.0.0.1:6378",
    reuseExistingServer: true,
  },
});
