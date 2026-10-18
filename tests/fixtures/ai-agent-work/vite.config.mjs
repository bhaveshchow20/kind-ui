import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: fileURLToPath(new URL("../../../node_modules/.vite-ai-agent-work", import.meta.url)),
  esbuild: { jsx: "automatic" },
  build: { outDir: "../../../artifacts/ai-agent-work/browser", emptyOutDir: true },
});
