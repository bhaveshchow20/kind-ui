import { defineConfig } from "@playwright/test";
import { basePath } from "./lib/routing.mjs";

const port = Number(process.env.KIND_DOCS_PORT ?? 6373);
export default defineConfig({
  testDir: "./tests",
  outputDir: "./artifacts/accessibility",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}${basePath}/`,
    viewport: { width: 1440, height: 1080 },
    trace: "retain-on-failure",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command: "node scripts/serve.mjs",
    url: `http://127.0.0.1:${port}${basePath}/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
