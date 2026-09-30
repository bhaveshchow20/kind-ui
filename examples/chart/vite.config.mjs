import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        example: fileURLToPath(new URL("./index.html", import.meta.url)),
        contracts: fileURLToPath(new URL("./contracts.html", import.meta.url)),
      },
    },
  },
});
