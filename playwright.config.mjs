import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.ts",
  outputDir: "artifacts/chart-tests",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1000, height: 900 },
    reducedMotion: "reduce",
  },
  webServer: {
    command: "npm exec vite preview -- examples/chart --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
  },
});
