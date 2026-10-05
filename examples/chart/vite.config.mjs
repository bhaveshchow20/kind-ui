import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { browserDirectives } from "../../scripts/browser-directives.mjs";

const diagnostics = browserDirectives(fileURLToPath(new URL("../../", import.meta.url)));
export default defineConfig({
  plugins: [tailwindcss(), diagnostics.plugin],
  build: {
    rolldownOptions: {
      onwarn: diagnostics.onwarn,
      input: {
        presentation: fileURLToPath(new URL("./presentation.html", import.meta.url)),
        example: fileURLToPath(new URL("./index.html", import.meta.url)),
        recipes: fileURLToPath(new URL("./recipes.html", import.meta.url)),
        pies: fileURLToPath(new URL("./pies.html", import.meta.url)),
        waterfalls: fileURLToPath(new URL("./waterfalls.html", import.meta.url)),
        bars: fileURLToPath(new URL("./bars.html", import.meta.url)),
        areas: fileURLToPath(new URL("./areas.html", import.meta.url)),
        showcase: fileURLToPath(new URL("./showcase.html", import.meta.url)),
        scatters: fileURLToPath(new URL("./scatters.html", import.meta.url)),
        combos: fileURLToPath(new URL("./combos.html", import.meta.url)),
        boxPlots: fileURLToPath(new URL("./box-plots.html", import.meta.url)),
        polar: fileURLToPath(new URL("./polar.html", import.meta.url)),
        histograms: fileURLToPath(new URL("./histograms.html", import.meta.url)),
        heatmaps: fileURLToPath(new URL("./heatmaps.html", import.meta.url)),
        sankeys: fileURLToPath(new URL("./sankeys.html", import.meta.url)),
        contracts: fileURLToPath(new URL("./contracts.html", import.meta.url)),
      },
    },
  },
});
