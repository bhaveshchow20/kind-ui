import { defineConfig } from "@playwright/test";

const portOffset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const port = (value) => value + portOffset;
export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.ts",
  testIgnore: ["composition.spec.ts", "configured-line.spec.ts", "line-integrations.spec.ts"],
  outputDir: process.env.KIND_UI_ARTIFACT_DIR ?? "artifacts/chart-tests",
  use: {
    baseURL: `http://127.0.0.1:${port(4173)}`,
    viewport: { width: 1000, height: 900 },
    reducedMotion: "reduce",
    ...(process.env.KIND_UI_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
      : {}),
  },
  webServer: [
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-stylesheet-development --host 127.0.0.1 --port ${port(4200)} --strictPort`,
      url: `http://127.0.0.1:${port(4200)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-stylesheet-production --host 127.0.0.1 --port ${port(4201)} --strictPort`,
      url: `http://127.0.0.1:${port(4201)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-loading --host 127.0.0.1 --port ${port(4202)} --strictPort`,
      url: `http://127.0.0.1:${port(4202)}/loading.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-identity-colors --host 127.0.0.1 --port ${port(4198)} --strictPort`,
      url: `http://127.0.0.1:${port(4198)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-activity-rings --host 127.0.0.1 --port ${port(4199)} --strictPort`,
      url: `http://127.0.0.1:${port(4199)}/activity-rings.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-bar-entrance --host 127.0.0.1 --port ${port(4196)} --strictPort`,
      url: `http://127.0.0.1:${port(4196)}/entrance.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-number-shuffle --host 127.0.0.1 --port ${port(4195)} --strictPort`,
      url: `http://127.0.0.1:${port(4195)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-scatter-legend --host 127.0.0.1 --port ${port(4194)} --strictPort`,
      url: `http://127.0.0.1:${port(4194)}/legend.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-emphasis --host 127.0.0.1 --port ${port(4193)} --strictPort`,
      url: `http://127.0.0.1:${port(4193)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-histogram --host 127.0.0.1 --port ${port(4192)} --strictPort`,
      url: `http://127.0.0.1:${port(4192)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-box-plot --host 127.0.0.1 --port ${port(4191)} --strictPort`,
      url: `http://127.0.0.1:${port(4191)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-heatmap --host 127.0.0.1 --port ${port(4190)} --strictPort`,
      url: `http://127.0.0.1:${port(4190)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-sankey --host 127.0.0.1 --port ${port(4189)} --strictPort`,
      url: `http://127.0.0.1:${port(4189)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-waterfall --host 127.0.0.1 --port ${port(4188)} --strictPort`,
      url: `http://127.0.0.1:${port(4188)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-presentation --host 127.0.0.1 --port ${port(4187)} --strictPort`,
      url: `http://127.0.0.1:${port(4187)}/presentation.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-scatter --host 127.0.0.1 --port ${port(4185)} --strictPort`,
      url: `http://127.0.0.1:${port(4185)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-combo --host 127.0.0.1 --port ${port(4186)} --strictPort`,
      url: `http://127.0.0.1:${port(4186)}/combo.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-pie --host 127.0.0.1 --port ${port(4180)} --strictPort`,
      url: `http://127.0.0.1:${port(4180)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-polar-gallery --host 127.0.0.1 --port ${port(4179)} --strictPort`,
      url: `http://127.0.0.1:${port(4179)}/gallery.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-polar-development --host 127.0.0.1 --port ${port(4178)} --strictPort`,
      url: `http://127.0.0.1:${port(4178)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-polar --host 127.0.0.1 --port ${port(4177)} --strictPort`,
      url: `http://127.0.0.1:${port(4177)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-combined --host 127.0.0.1 --port ${port(4184)} --strictPort`,
      url: `http://127.0.0.1:${port(4184)}/combined.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-area-static --host 127.0.0.1 --port ${port(4181)} --strictPort`,
      url: `http://127.0.0.1:${port(4181)}/static.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-area-motion --host 127.0.0.1 --port ${port(4182)} --strictPort`,
      url: `http://127.0.0.1:${port(4182)}/motion.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-bar --host 127.0.0.1 --port ${port(4183)} --strictPort`,
      url: `http://127.0.0.1:${port(4183)}`,
    },
    {
      command: `npm exec vite preview -- --outDir examples/chart/dist --host 127.0.0.1 --port ${port(4173)} --strictPort`,
      url: `http://127.0.0.1:${port(4173)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-chart --host 127.0.0.1 --port ${port(4174)} --strictPort`,
      url: `http://127.0.0.1:${port(4174)}`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-line-static --host 127.0.0.1 --port ${port(4175)} --strictPort`,
      url: `http://127.0.0.1:${port(4175)}/static.html`,
    },
    {
      command: `npm exec vite preview -- --outDir artifacts/packed-line-motion --host 127.0.0.1 --port ${port(4176)} --strictPort`,
      url: `http://127.0.0.1:${port(4176)}/motion.html`,
    },
  ],
});
