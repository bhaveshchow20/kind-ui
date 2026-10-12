import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { consumerShard, expandConsumers } from "./consumer-shards.mjs";
import { declarationCompilerOptions } from "./consumer-validation-files.mjs";

test("generated legend fixture guards selection and mount under owned-source strict checks", async (t) => {
  const script = await readFile(new URL("check-legend-browser.mjs", import.meta.url), "utf8");
  const parsed = ts.createSourceFile(
    "check-legend-browser.mjs",
    script,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  let template;
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(parsed) === "write" &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text === "src/main.tsx"
    )
      template = node.arguments[1];
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  assert.ok(template, "The browser gate must generate its consumer entry point");
  const source = runInNewContext(template.getText(parsed), {
    imports: [],
    examples: ['{id:"line",render:(pending:boolean) => <span>{String(pending)}</span>}'],
  });
  const scratch = await mkdtemp(join(tmpdir(), "kind-docs-legend-source-"));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  await symlink(
    fileURLToPath(new URL("../../../node_modules", import.meta.url)),
    join(scratch, "node_modules"),
    "dir",
  );
  const file = join(scratch, "main.tsx");
  await writeFile(file, source);
  const options = ts.convertCompilerOptionsFromJson(
    {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "react-jsx",
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      noEmit: true,
      skipLibCheck: true,
      types: [],
    },
    scratch,
  );
  assert.equal(options.errors.length, 0);
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([file], options.options));
  assert.deepEqual(
    diagnostics.map((diagnostic) => diagnostic.messageText),
    [],
  );
  const runtime = ts
    .transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
      },
    })
    .outputText.replace(/^import .*;$/gm, "");
  assert.throws(
    () => runInNewContext(runtime, { document: { getElementById: () => null } }),
    /Legend consumer mount element is missing/,
  );
  assert.match(script, /compilerOptions: declarationCompilerOptions/);
});

test("copied-consumer declaration modes reject invalid dependency declarations and retain source safety", async (t) => {
  const scratch = await mkdtemp(join(tmpdir(), "kind-docs-declarations-"));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  const source = join(scratch, "consumer.ts");
  const dependency = join(scratch, "dependency.d.ts");
  const base = {
    compilerOptions: {
      target: "ES2022",
      strict: true,
      exactOptionalPropertyTypes: true,
      noUncheckedIndexedAccess: true,
      noEmit: true,
      skipLibCheck: true,
      types: [],
    },
    files: ["consumer.ts", "dependency.d.ts"],
  };
  await writeFile(join(scratch, "tsconfig.json"), JSON.stringify(base));
  await writeFile(source, "export const value: number = 1;");
  await writeFile(dependency, "declare const brokenDependency: MissingDependencyType;\n");
  for (const module of ["NodeNext", "ESNext"]) {
    const config = ts.parseJsonConfigFileContent(
      {
        extends: "./tsconfig.json",
        compilerOptions: {
          ...declarationCompilerOptions,
          module,
          moduleResolution: module === "ESNext" ? "Bundler" : "NodeNext",
          types: [],
        },
      },
      ts.sys,
      scratch,
    );
    assert.equal(config.errors.length, 0);
    assert.equal(config.options.exactOptionalPropertyTypes, false);
    assert.equal(config.options.skipLibCheck, false);
    assert.equal(config.options.noUncheckedIndexedAccess, true);
    const diagnostics = ts.getPreEmitDiagnostics(
      ts.createProgram(config.fileNames, config.options),
    );
    assert.ok(
      diagnostics.some(
        (diagnostic) => diagnostic.file?.fileName === dependency && diagnostic.code === 2304,
      ),
      "Declaration modes must reject an invalid dependency type",
    );
  }
  await writeFile(dependency, "interface ValidDependency { value: number }\n");
  await writeFile(
    source,
    "type Optional = {value?: number}; export const value: Optional = {value: undefined};",
  );
  const sourceConfig = ts.parseJsonConfigFileContent(base, ts.sys, scratch);
  const diagnostics = ts.getPreEmitDiagnostics(
    ts.createProgram(sourceConfig.fileNames, sourceConfig.options),
  );
  assert.ok(
    diagnostics.some(
      (diagnostic) => diagnostic.file?.fileName === source && diagnostic.code === 2375,
    ),
    "The source gate must reject explicitly undefined optional values",
  );
});

test("every copied-consumer family uses the shared declaration baseline", async () => {
  for (const script of [
    "check-consumers.mjs",
    "check-box-plot-consumers.mjs",
    "check-histogram-consumers.mjs",
    "check-combo-consumers.mjs",
    "check-waterfall-consumers.mjs",
    "check-heatmap-consumers.mjs",
  ]) {
    const source = await readFile(new URL(script, import.meta.url), "utf8");
    assert.match(source, /compilerOptions: declarationCompilerOptions/, script);
  }
});

test("consumer sharding covers every complete example and non-default variant exactly once", () => {
  const bundles = Object.fromEntries(
    Array.from({ length: 17 }, (_, index) => [
      index,
      {
        id: `example-${index}`,
        files: {
          "package.json": "pinned",
          [`src/examples/example-${index}/example.tsx`]: "default",
        },
        defaultVariant: "glass",
        variants: {
          glass: { source: "default" },
          flat: { source: "flat" },
          glow: { source: "glow" },
        },
      },
    ]),
  );
  const consumers = expandConsumers(bundles);
  assert.equal(consumers.length, 51);
  assert.deepEqual(consumerShard(consumers).consumers, consumers);
  const shards = [1, 2, 3, 4].map((index) => consumerShard(consumers, [`--shard=${index}/4`]));
  const combined = shards.flatMap((shard) => shard.consumers);
  assert.equal(new Set(combined.map((consumer) => consumer.id)).size, 51);
  assert.deepEqual(
    combined.map((consumer) => consumer.id).sort(),
    consumers.map((consumer) => consumer.id).sort(),
  );
  for (const consumer of combined) {
    assert.equal(consumer.files["package.json"], "pinned");
    const [id, variant] = consumer.id.split(":");
    assert.equal(consumer.files[`src/examples/${id}/example.tsx`], variant ?? "default");
  }
  assert.equal(new Set(shards.map((shard) => shard.suffix)).size, 4);
});

test("consumer sharding rejects invalid or ambiguous shard arguments", () => {
  for (const args of [
    ["--shard=0/4"],
    ["--shard=5/4"],
    ["--shard=1/0"],
    ["--shard=1.5/4"],
    ["--shard=1/4", "--skip"],
    ["--skip"],
    ["--shard=9007199254740992/9007199254740992"],
  ])
    assert.throws(() => consumerShard([], args));
});
