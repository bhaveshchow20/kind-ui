import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: "configured-line.spec.ts",
  workers: 1,
  outputDir: "artifacts/configured-line-tests",
  use: {
    baseURL: "http://127.0.0.1:6898",
    viewport: { width: 1000, height: 1000 },
    reducedMotion: "reduce",
  },
  webServer: {
    command:
      "npm exec vite preview -- --outDir artifacts/packed-configured-line --host 127.0.0.1 --port 6898 --strictPort",
    url: "http://127.0.0.1:6898",
  },
});
