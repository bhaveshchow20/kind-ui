import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function moduleUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
// Recipes use the maintained data/palette guard. Extract that exported function
// from its actual source so evaluation need not import unrelated CSS utilities.
const utilities = ts.createSourceFile(
  "utils.ts",
  await readFile(join(app, "lib/utils.ts"), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);
const helpers = utilities.statements.filter(
  (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === "demoEntry",
);
assert.equal(
  helpers.length,
  1,
  "Snippet evaluation requires one maintained demoEntry in lib/utils.ts",
);
const helper = helpers[0];
assert.ok(
  helper.body &&
    helper.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
  "Snippet evaluation requires lib/utils.ts to export the demoEntry function implementation",
);
const helperUrl = moduleUrl(helper.getText(utilities));
const candleSourceUrl = moduleUrl(
  await readFile(join(app, "lib/market-candlestick-source.ts"), "utf8"),
);
async function evaluate(source) {
  const linked = source.replace(
    /from\s*(["'])@\/lib\/utils\1/g,
    `from ${JSON.stringify(helperUrl)}`,
  );
  return import(
    moduleUrl(
      linked.replace(
        /from\s*(["'])\.\/market-candlestick-source\1/g,
        `from ${JSON.stringify(candleSourceUrl)}`,
      ),
    )
  );
}
const page = await readFile(join(app, "app/page.tsx"), "utf8");
const basic = await evaluate(
  'import { demoEntry } from "@/lib/utils";\n' +
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
      for (const finish of ["plain", "clay", "glow"]) {
        for (const animate of [false, true]) {
          const file = join(temporary, `${recipe.id}-${finish}-${animate}.tsx`);
          const source = generate(recipe, finish, ["#733bff", "#119548", "#f22e79"], animate);
          assert.doesNotMatch(source, /@kind-ui\/charts\/styles\.css/);
          assert.doesNotMatch(source, /Chart\.Root|rootProps=|xDataKey=|xAxisProps=|yAxisProps=/);
          assert.doesNotMatch(
            source,
            /visibleSeries=|onVisibleSeriesChange=|data\.filter\(/,
            `${recipe.id} copied focus must preserve the complete data`,
          );
          if (recipe.family === "Candlestick") {
            assert.match(source, /<CandlestickVolume seriesKey="volume"/);
            assert.match(source, /<CandlestickCurrentPrice/);
            assert.match(source, /<CandlestickControls/);
            assert.match(source, /<CandlestickHistoryNavigator/);
            assert.match(source, /data-kind-ui="candlestick-data-alternative"/);
            assert.match(source, /feed\.rows\.map/);
            assert.match(source, /selection=\{selection\} onSelectionChange=/);
            assert.doesNotMatch(source, /<CandlestickDataTable/);
            assert.match(source, /var\(--chart-grid, #e5e7eb\)/);
            assert.match(source, /var\(--chart-axis, #64748b\)/);
            assert.match(source, /timeMode="epoch-ms"/);
            assert.match(source, /SIMULATED/);
            assert.match(source, /setInterval\(step, 700\)/);
            assert.doesNotMatch(source, /responsive|\.Root|\.Plot|synthetic executions/i);
          }
          if (recipe.family === "Pie") {
            assert.match(source, /<PieChart\.Series/);
            assert.doesNotMatch(source, /interactionBinding=/);
            assert.match(source, /categoryKey="id"/);
            assert.match(source, /kind:\s*"category"/);
          }
          await writeFile(file, source);
          files.push(file);
        }
      }
    }
  }
  assert.equal(files.length, 198, "Every recipe, finish and motion setting must be checked");
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
      const source = generate(
        recipe,
        "plain",
        ["#733bff", "#119548", "#f22e79"],
        true,
        changedOptions,
      );
      assert.doesNotMatch(source, /<\w+Chart\.Legend\b/, `${recipe.id} hides the explicit legend`);
      if (recipe.family !== "Heatmap")
        assert.doesNotMatch(source, /<\w+Chart\.Grid\b/, `${recipe.id} omits the explicit grid`);
      if (recipe.family === "Candlestick") {
        assert.match(source, /"width":40/);
        assert.match(source, /maxBarSize=\{options.width \?\? 12\}/);
        assert.match(source, /"strokeWidth":4/);
        assert.match(source, /strokeWidth: options.strokeWidth \?\? 1.5/);
        assert.match(source, /"showLabels":false/);
        assert.match(source, /options.showLabels === false \? false/);
      }
      await writeFile(file, source);
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
  const program = ts.createProgram(files, {
    ...parsed.options,
    incremental: false,
  });
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
