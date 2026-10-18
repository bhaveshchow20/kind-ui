import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: fileURLToPath(new URL("../../../artifacts/ai/reasoning-vite-cache/", import.meta.url)),
  plugins: [tailwindcss()],
  esbuild: { jsx: "automatic" },
});
