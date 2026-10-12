import { defineConfig } from "@playwright/test";
import { compatibilityMatrix } from "./scripts/compatibility-matrix.mjs";
export default defineConfig({
  testDir: "tests",
  testMatch: ["line-integrations.spec.ts", "funnel-integrations.spec.ts"],
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
    use: { baseURL: `http://127.0.0.1:${row.vitePort}` },
    metadata: { nextURL: `http://127.0.0.1:${row.nextPort}` },
  })),
  webServer: compatibilityMatrix.flatMap((row) =>
    [
      { output: row.viteOutput, port: row.vitePort },
      { output: row.nextOutput, port: row.nextPort },
    ].map(({ output, port }) => ({
      command: `npm exec vite preview -- --outDir ${output} --host 127.0.0.1 --port ${port} --strictPort`,
      url: `http://127.0.0.1:${port}`,
    })),
  ),
});
