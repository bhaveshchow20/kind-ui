import { defineConfig } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const port = 6378 + offset;
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
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1200, height: 900 },
    reducedMotion: "no-preference",
    channel: process.env.KIND_UI_TEST_CHROME ? "chrome" : undefined,
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command: `npm exec vite -- tests/fixtures/focus-identity --config tests/fixtures/focus-identity/vite.config.mjs --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: offset === 0,
  },
});
