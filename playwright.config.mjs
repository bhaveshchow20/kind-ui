import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.ts",
  outputDir: process.env.KIND_UI_ARTIFACT_DIR ?? "artifacts/chart-tests",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1000, height: 900 },
    reducedMotion: "reduce",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: [
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-pie --host 127.0.0.1 --port 4177 --strictPort",
      url: "http://127.0.0.1:4177",
    },
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-combined --host 127.0.0.1 --port 4184 --strictPort",
      url: "http://127.0.0.1:4184/combined.html",
    },
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-area-static --host 127.0.0.1 --port 4181 --strictPort",
      url: "http://127.0.0.1:4181/static.html",
    },
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-area-motion --host 127.0.0.1 --port 4182 --strictPort",
      url: "http://127.0.0.1:4182/motion.html",
    },
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-bar --host 127.0.0.1 --port 4183 --strictPort",
      url: "http://127.0.0.1:4183",
    },
    {
      command: "npm exec vite preview -- examples/chart --host 127.0.0.1 --port 4173 --strictPort",
      url: "http://127.0.0.1:4173",
    },
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-chart --host 127.0.0.1 --port 4174 --strictPort",
      url: "http://127.0.0.1:4174",
    },
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-line-static --host 127.0.0.1 --port 4175 --strictPort",
      url: "http://127.0.0.1:4175/static.html",
    },
    {
      command:
        "npm exec vite preview -- --outDir artifacts/packed-line-motion --host 127.0.0.1 --port 4176 --strictPort",
      url: "http://127.0.0.1:4176/motion.html",
    },
  ],
});
