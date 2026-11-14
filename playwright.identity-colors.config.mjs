import { defineConfig } from "@playwright/test";

const port = Number(process.env.KIND_UI_IDENTITY_PORT ?? 6973);
export default defineConfig({
  name: "identity-colors-focused",
  testDir: "tests",
  testMatch: "identity-colors.spec.ts",
  workers: 1,
  outputDir: "artifacts/identity-colors-tests",
  use: { baseURL: `http://127.0.0.1:${port}`, reducedMotion: "reduce" },
  webServer: {
    command: `npm exec vite preview -- --outDir artifacts/packed-identity-colors --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
  },
});
