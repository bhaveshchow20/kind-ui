import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
async function evaluate(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const page = await readFile(join(app, "app/page.tsx"), "utf8");
const basic = await evaluate(
  page.slice(page.indexOf("const recipes ="), page.indexOf("function ChartCard(")) +
    "\nexport { recipes, snippet };",
);
const advanced = await evaluate(await readFile(join(app, "lib/advanced-chart-recipes.ts"), "utf8"));
const recent = await evaluate(await readFile(join(app, "lib/new-chart-recipes.ts"), "utf8"));
const activity = await evaluate(await readFile(join(app, "lib/activity-recipe.ts"), "utf8"));
const temporary = await mkdtemp(join(app, ".snippet-check-"));
try {
  const files = [];
  for (const [recipes, generate] of [
    [basic.recipes, basic.snippet],
    [advanced.advancedRecipes, advanced.advancedCode],
    [recent.newRecipes, recent.newCode],
  ]) {
    for (const recipe of recipes) {
      for (const finish of ["plain", "paper", "clay", "glow"]) {
        for (const animate of [false, true]) {
          const file = join(temporary, `${recipe.id}-${finish}-${animate}.tsx`);
          await writeFile(
            file,
            generate(recipe, finish, ["#733bff", "#119548", "#f22e79"], animate),
          );
          files.push(file);
        }
      }
    }
  }
  assert.equal(files.length, 256, "Every recipe, finish and motion setting must be checked");
  const changedOptions = {
    strokeWidth: 4,
    showGrid: false,
    showLegend: false,
    showLabels: false,
    rotation: 240,
    outerRadius: 80,
    exercise: 45,
    stand: 11,
    linkOpacity: 0.7,
    curve: "stepAfter",
    dots: true,
    fillOpacity: 0.4,
    radius: 12,
    width: 40,
    stacked: true,
    innerRadius: 60,
    gridType: "circle",
    progress: 480,
    gap: 8,
    pointShape: "square",
    showValues: false,
    connectors: false,
    nodeWidth: 20,
    nodePadding: 40,
    outlierRadius: 6,
    density: true,
    binBorders: false,
  };
  for (const [recipes, generate] of [
    [basic.recipes, basic.snippet],
    [advanced.advancedRecipes, advanced.advancedCode],
    [recent.newRecipes, recent.newCode],
  ]) {
    for (const recipe of recipes) {
      const file = join(temporary, `${recipe.id}-controls.tsx`);
      await writeFile(
        file,
        generate(recipe, "plain", ["#733bff", "#119548", "#f22e79"], true, changedOptions),
      );
      files.push(file);
    }
  }
  for (const animate of [false, true]) {
    const file = join(temporary, `activity-${animate}.tsx`);
    await writeFile(file, activity.activityCode({ progress: 480, gap: 8 }, animate));
    files.push(file);
  }
  const config = ts.readConfigFile(join(app, "tsconfig.json"), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, app);
  const program = ts.createProgram(files, { ...parsed.options, incremental: false });
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  if (config.error) diagnostics.push(config.error);
  if (diagnostics.length) {
    process.stderr.write(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (file) => file,
        getCurrentDirectory: () => app,
        getNewLine: () => "\n",
      }),
    );
    process.exitCode = 1;
  } else console.log(`${files.length} showcase snippets passed strict TypeScript checks.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
