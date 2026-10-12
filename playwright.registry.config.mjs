import { defineConfig } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const vitePort = 7480 + offset;
const nextPort = 7481 + offset;
export default defineConfig({
  testDir: "tests",
  testMatch: "registry.spec.ts",
  workers: 1,
  outputDir: "artifacts/registry-browser-tests",
  use: {
    viewport: { width: 960, height: 800 },
    reducedMotion: "reduce",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  projects: [
    { name: "registry-vite", use: { baseURL: `http://127.0.0.1:${vitePort}` } },
    { name: "registry-next", use: { baseURL: `http://127.0.0.1:${nextPort}` } },
  ],
  webServer: [
    { output: "artifacts/packed-registry-vite", port: vitePort },
    { output: "artifacts/packed-registry-next", port: nextPort },
  ].map(({ output, port }) => ({
    command: `npm exec vite preview -- --outDir ${output} --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
  })),
});
