import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  esbuild: { jsx: "automatic" },
  build: { outDir: "../../../artifacts/ai-agent-work/browser", emptyOutDir: true },
});
