import { defineConfig } from "@playwright/test";

process.env.KIND_UI_TEST_PORT_BASE ??= "6893";
const offset = Number(process.env.KIND_UI_TEST_PORT_BASE) - 4173;
export default defineConfig({
  testDir: "tests",
  testMatch: "packed-lines.spec.ts",
  workers: 1,
  outputDir: "artifacts/line-legacy-tests",
  use: { viewport: { width: 1000, height: 900 }, reducedMotion: "reduce" },
  webServer: [
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-line-static --host 127.0.0.1 --port ${4175 + offset} --strictPort`,
      url: `http://127.0.0.1:${4175 + offset}/static.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-line-motion --host 127.0.0.1 --port ${4176 + offset} --strictPort`,
      url: `http://127.0.0.1:${4176 + offset}/motion.html`,
    },
  ],
});
