import { defineConfig } from "@playwright/test";

const port = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 6473);
export default defineConfig({
  testDir: "tests",
  testMatch: "bar-return-diagnostic.spec.ts",
  outputDir: "artifacts/bar-return-diagnostic",
  workers: 2,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1000, height: 900 },
    reducedMotion: "reduce",
    trace: "on",
    screenshot: "only-on-failure",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command: `npm exec vite preview -- --outDir examples/chart/dist --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
  },
});
