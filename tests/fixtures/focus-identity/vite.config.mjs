import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  cacheDir: fileURLToPath(new URL("../../../node_modules/.vite-focus-identity", import.meta.url)),
  resolve: {
    dedupe: ["react", "react-dom", "react-is", "recharts", "motion"],
    alias: [
      {
        find: /^@kind-ui\/charts$/,
        replacement: fileURLToPath(
          new URL("../../../packages/charts/dist/index.js", import.meta.url),
        ),
      },
    ],
  },
});
