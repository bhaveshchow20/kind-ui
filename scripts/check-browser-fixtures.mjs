import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { build } from "vite";
import { browserDirectives } from "./browser-directives.mjs";
import { writeFixtureEntry } from "./fixture-entry.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixtures = join(root, "tests/fixtures/browser");
const cases = {
  index: "main",
  recipes: "recipes",
  areas: "areas",
  bars: "bars",
  combos: "combos",
  waterfalls: "waterfalls",
  "box-plots": "box-plots",
  histograms: "histograms",
  polar: "polar",
  sankeys: "sankeys",
  loading: "loading",
  presentation: "presentation-main",
  pies: "pies",
  heatmaps: "heatmaps",
  scatters: "scatters",
  contracts: "contracts",
};
const temporary = await mkdtemp(join(fixtures, ".browser-input-"));
try {
  const input = {};
  for (const [name, module] of Object.entries(cases)) {
    await writeFixtureEntry(temporary, name, `../${module}.js`);
    input[name] = join(temporary, `${name}.html`);
  }
  const diagnostics = browserDirectives(root);
  await build({
    root: temporary,
    configFile: false,
    publicDir: join(fixtures, "public"),
    plugins: [tailwindcss(), diagnostics.plugin],
    build: {
      outDir: join(root, "artifacts/browser-fixtures"),
      emptyOutDir: true,
      rolldownOptions: { input, onwarn: diagnostics.onwarn },
    },
  });
  console.log(`Built ${Object.keys(cases).length} regression cases from generated fixture entries`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
