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
        bars: fileURLToPath(new URL("./bars.html", import.meta.url)),
        contracts: fileURLToPath(new URL("./contracts.html", import.meta.url)),
        themes: fileURLToPath(new URL("./themes.html", import.meta.url)),
      },
    },
  },
});
