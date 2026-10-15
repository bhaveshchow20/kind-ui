import { defineConfig } from "@playwright/test";
import { compatibilityMatrix } from "./scripts/compatibility-matrix.mjs";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
export default defineConfig({
  testDir: "tests",
  testMatch: "line-integrations.spec.ts",
  workers: 1,
  outputDir: "artifacts/line-integration-tests",
  use: {
    viewport: { width: 1000, height: 1000 },
    reducedMotion: "reduce",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  projects: compatibilityMatrix.map((row) => ({
    name: row.id,
    use: { baseURL: `http://127.0.0.1:${row.vitePort + offset}` },
    metadata: { nextURL: `http://127.0.0.1:${row.nextPort + offset}` },
  })),
  webServer: compatibilityMatrix.flatMap((row) =>
    [
      { output: row.viteOutput, port: row.vitePort + offset },
      { output: row.nextOutput, port: row.nextPort + offset },
    ].map(({ output, port }) => ({
      command: `npm exec vite preview -- --outDir ${output} --host 127.0.0.1 --port ${port} --strictPort`,
      url: `http://127.0.0.1:${port}`,
    })),
  ),
});
