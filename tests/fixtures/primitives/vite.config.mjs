import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: fileURLToPath(new URL("../../../artifacts/primitives/vite-cache/", import.meta.url)),
  plugins: [tailwindcss()],
  esbuild: { jsx: "automatic" },
  build: { outDir: "../../../artifacts/primitives/browser", emptyOutDir: true },
  server: { fs: { allow: [fileURLToPath(new URL("../../../", import.meta.url))] } },
});
