import { defineConfig } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const port = 6379 + offset;
export default defineConfig({
  testDir: "tests",
  workers: 1,
  testMatch: "cartesian-visibility.spec.ts",
  outputDir: "artifacts/cartesian-visibility",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    reducedMotion: "no-preference",
    channel: process.env.KIND_UI_TEST_CHROME ? "chrome" : undefined,
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command: `npm exec vite -- tests/fixtures/cartesian-visibility --config tests/fixtures/cartesian-visibility/vite.config.mjs --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: offset === 0,
  },
});
