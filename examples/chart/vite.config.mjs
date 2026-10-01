import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rolldownOptions: {
      input: {
        example: fileURLToPath(new URL("./index.html", import.meta.url)),
        recipes: fileURLToPath(new URL("./recipes.html", import.meta.url)),
        pies: fileURLToPath(new URL("./pies.html", import.meta.url)),
        bars: fileURLToPath(new URL("./bars.html", import.meta.url)),
        areas: fileURLToPath(new URL("./areas.html", import.meta.url)),
        showcase: fileURLToPath(new URL("./showcase.html", import.meta.url)),
        polar: fileURLToPath(new URL("./polar.html", import.meta.url)),
        contracts: fileURLToPath(new URL("./contracts.html", import.meta.url)),
      },
    },
  },
});
