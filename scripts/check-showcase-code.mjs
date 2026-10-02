import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exampleDirectory = join(root, "examples/chart");

// Evaluate the copy-code generator without starting Vite or opening an HMR socket.
async function loadSourceModule(name, embedRecipes = false) {
  let source = await readFile(join(exampleDirectory, name), "utf8");
  if (embedRecipes) {
    const imports = [...source.matchAll(/import\("(\.\/[^"\n]+\.tsx)\?raw"\)/g)];
    assert.ok(imports.length > 0, "Expected maintained raw recipe imports");
    for (const [expression, path] of imports) {
      const recipe = await readFile(resolve(exampleDirectory, path), "utf8");
      source = source.replace(expression, `Promise.resolve({default:${JSON.stringify(recipe)}})`);
    }
  }
  const { outputText } = ts.transpileModule(source, {
    fileName: name,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const [{ exampleCode }, { examples }] = await Promise.all([
  loadSourceModule("showcase-code.ts", true),
  loadSourceModule("showcase-data.ts"),
]);
const temporaryDirectory = await mkdtemp(join(exampleDirectory, ".showcase-code-check-"));
try {
  const files = [];
  for (const [family, cards] of Object.entries(examples)) {
    for (const card of cards) {
      const file = join(temporaryDirectory, `${family}-${card.id}.tsx`);
      await writeFile(file, await exampleCode(family, card, "clay", true, "#5b7cde", "#5b9f8a"));
      files.push(file);
    }
  }
  assert.equal(files.length, 30, "The copied-code gate must cover all thirty gallery examples");
  const configPath = join(exampleDirectory, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, exampleDirectory);
  const program = ts.createProgram(files, parsed.options);
  const diagnostics = [
    ...(config.error ? [config.error] : []),
    ...parsed.errors,
    ...ts.getPreEmitDiagnostics(program),
  ];
  if (diagnostics.length) {
    process.stderr.write(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (file) => file,
        getCurrentDirectory: () => root,
        getNewLine: () => "\n",
      }),
    );
    process.exitCode = 1;
  } else {
    console.log(`Copied gallery code: ${files.length} examples passed strict TypeScript checks.`);
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
