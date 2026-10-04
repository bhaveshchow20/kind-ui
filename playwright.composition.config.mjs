import { defineConfig } from "@playwright/test";

// One focused server; no inherited full-suite server fleet.
export default defineConfig({
  testDir: "tests",
  testMatch: "composition.spec.ts",
  workers: 1,
  outputDir: "artifacts/composition-tests",
  use: {
    baseURL: "http://127.0.0.1:6897",
    viewport: { width: 1000, height: 1200 },
    reducedMotion: "reduce",
  },
  webServer: {
    command:
      "npm exec vite preview -- --outDir artifacts/packed-composition --host 127.0.0.1 --port 6897 --strictPort",
    url: "http://127.0.0.1:6897",
  },
});
