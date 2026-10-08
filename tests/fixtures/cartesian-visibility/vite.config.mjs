import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  cacheDir: fileURLToPath(
    new URL("../../../node_modules/.vite-cartesian-visibility", import.meta.url),
  ),
  resolve: {
    dedupe: ["react", "react-dom", "react-is", "recharts", "motion"],
    alias: [
      {
        find: "@kind-ui/charts/styles.css",
        replacement: fileURLToPath(
          new URL("../../../packages/charts/dist/styles.css", import.meta.url),
        ),
      },
      {
        find: /^@kind-ui\/charts$/,
        replacement: fileURLToPath(
          new URL("../../../packages/charts/dist/index.js", import.meta.url),
        ),
      },
    ],
  },
});
