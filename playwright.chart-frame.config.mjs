import { defineConfig } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const port = 6898 + offset;
export default defineConfig({
  testDir: "tests",
  testMatch: "chart-frame.spec.ts",
  workers: 1,
  outputDir: "artifacts/chart-frame-tests",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1000, height: 1000 },
    reducedMotion: "reduce",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command: `npm exec vite preview -- --outDir artifacts/packed-chart-frame --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
  },
});
