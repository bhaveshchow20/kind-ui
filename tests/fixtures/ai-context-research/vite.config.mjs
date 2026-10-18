import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: fileURLToPath(
    new URL("../../../node_modules/.vite-ai-context-research", import.meta.url),
  ),
  plugins: [tailwindcss()],
  esbuild: { jsx: "automatic" },
  build: { outDir: "../../../artifacts/ai/context-research/browser", emptyOutDir: true },
  server: { fs: { allow: [fileURLToPath(new URL("../../../", import.meta.url))] } },
});
