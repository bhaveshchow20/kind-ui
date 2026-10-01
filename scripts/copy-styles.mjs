import { copyFile } from "node:fs/promises";

await copyFile("packages/charts/src/styles.css", "packages/charts/dist/styles.css");
