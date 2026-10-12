import { defineConfig } from "@playwright/test";

// One focused server; no inherited full-suite server fleet.
const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const port = 6897 + offset;
export default defineConfig({
  testDir: "tests",
  testMatch: "composition.spec.ts",
  workers: 1,
  outputDir: "artifacts/composition-tests",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1000, height: 1200 },
    reducedMotion: "reduce",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command: `npm exec vite preview -- --outDir artifacts/packed-composition --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
  },
});
