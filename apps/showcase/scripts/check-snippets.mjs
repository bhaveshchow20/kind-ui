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
async function evaluate(source) {
  const linked = source.replace(
    /from\s*(["'])@\/lib\/utils\1/g,
    `from ${JSON.stringify(helperUrl)}`,
  );
  return import(moduleUrl(linked));
}
const page = await readFile(join(app, "app/page.tsx"), "utf8");
const basic = await evaluate(
  'import { demoEntry } from "@/lib/utils";\n' +
    page.slice(page.indexOf("const recipes ="), page.indexOf("function ChartCard(")) +
    "\nexport { recipes, snippet };",
);
const advanced = await evaluate(await readFile(join(app, "lib/advanced-chart-recipes.ts"), "utf8"));
const recent = await evaluate(await readFile(join(app, "lib/new-chart-recipes.ts"), "utf8"));
const treemap = await evaluate(await readFile(join(app, "lib/treemap-recipes.ts"), "utf8"));
assert.deepEqual(
  treemap.treemapRecipes.map((recipe) => recipe.id),
  ["treemap-market", "treemap-exposure"],
);
assert.equal(
  treemap
    .treemapRows(treemap.treemapData("treemap-market"))
    .reduce((sum, row) => sum + row.value, 0),
  76300,
);
assert.equal(
  treemap
    .treemapRows(treemap.treemapData("treemap-exposure"))
    .reduce((sum, row) => sum + row.value, 0),
  197000,
);
// Use the actual gallery defaults and evaluate the copied encoding declarations
// so swapped palette endpoints cannot pass through preview/source parity checks.
const pageSource = ts.createSourceFile(
  "page.tsx",
  page,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const paletteDeclaration = pageSource.statements
  .flatMap((statement) =>
    ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : [],
  )
  .find(
    (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === "exampleColors",
  );
assert.ok(
  paletteDeclaration?.initializer && ts.isObjectLiteralExpression(paletteDeclaration.initializer),
);
for (const recipe of treemap.treemapRecipes) {
  const property = paletteDeclaration.initializer.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) &&
      (ts.isStringLiteral(property.name) || ts.isIdentifier(property.name)) &&
      property.name.text === recipe.id,
  );
  assert.ok(
    property && ts.isPropertyAssignment(property),
    `${recipe.id} needs an explicit gallery palette`,
  );
  const defaultColors = (
    await evaluate(`export const colors = ${property.initializer.getText(pageSource)};`)
  ).colors;
  for (const colors of [defaultColors, ["#123456", "#abcdef", "#fedcba", "#654321"], []]) {
    const preview = treemap.treemapConfig(treemap.treemapData(recipe.id), colors);
    const generated = treemap.treemapCode(recipe, "plain", colors, false);
    const generatedSource = ts.createSourceFile(
      "example.tsx",
      generated,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const declarations = generatedSource.statements.filter(
      (statement) =>
        ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.some(
          (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === "config",
        ),
    );
    const copied = (
      await evaluate(
        declarations.map((statement) => statement.getText(generatedSource)).join("\n") +
          "\nexport { config };",
      )
    ).config;
    assert.deepEqual(
      copied,
      preview,
      `${recipe.id} copied category config matches the preview and legend`,
    );
  }
}
const activity = await evaluate(await readFile(join(app, "lib/activity-recipe.ts"), "utf8"));
const temporary = await mkdtemp(join(app, ".snippet-check-"));
try {
  const files = [];
  for (const [recipes, generate] of [
    [basic.recipes, basic.snippet],
    [advanced.advancedRecipes, advanced.advancedCode],
    [recent.newRecipes, recent.newCode],
    [treemap.treemapRecipes, treemap.treemapCode],
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
          if (recipe.family === "Treemap") {
            assert.match(source, /readonly TreemapDatum\[\]/);
            assert.doesNotMatch(source, /accessors=|encoding=|View data|signedPosition/);
            assert.doesNotMatch(source, /candidate|validated archive|does not include it/);
            assert.match(source, /TreemapChart\.Legend/);
            if (animate) assert.match(source, /valueAnimation="shuffle"/);
            else assert.doesNotMatch(source, /valueAnimation="shuffle"/);
            const prompt = treemap.treemapPrompt(
              recipe,
              finish,
              ["#733bff", "#119548", "#f22e79"],
              animate,
            );
            assert.ok(prompt.includes(source));
            assert.match(prompt, /https:\/\/kindui\.dev\/charts\/docs\/components\/treemap\//);
            assert.doesNotMatch(
              prompt,
              /localhost|127\.0\.0\.1|candidate|published.*0\.5\.0|validated archive/,
            );
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
  assert.equal(files.length, 204, "Every recipe, finish and motion setting must be checked");
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
    [treemap.treemapRecipes, treemap.treemapCode],
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
      assert.doesNotMatch(
        source,
        /<\w+Chart\.(?:Legend|ColorLegend)\b/,
        `${recipe.id} hides the explicit legend`,
      );
      if (recipe.family !== "Heatmap")
        assert.doesNotMatch(source, /<\w+Chart\.Grid\b/, `${recipe.id} omits the explicit grid`);
      if (recipe.family === "Treemap") {
        assert.doesNotMatch(source, /<TreemapChart\.(Labels|ColorLegend)\b/);
        assert.match(source, /padding=\{8\}/);
        assert.match(source, /borderRadius:\s*12/);
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
