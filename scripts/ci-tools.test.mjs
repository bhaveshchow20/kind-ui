import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { browserDirectives } from "./browser-directives.mjs";
import { checkTypes } from "./check-types.mjs";

test("browser diagnostic deduplication forwards every unexpected diagnostic", () => {
  const root = "/tmp/client-fixture";
  const diagnostics = browserDirectives(root);
  const forwarded = [];
  const notices = [];
  const warn = console.warn;
  console.warn = (message) => notices.push(message);
  try {
    const known = {
      code: "MODULE_LEVEL_DIRECTIVE",
      message: 'semantics of directive "use client"',
      id: `${root}/node_modules/framer-motion/dist/es/context/ReorderContext.mjs`,
    };
    const forward = (warning) => forwarded.push(warning);
    diagnostics.onwarn(known, forward);
    diagnostics.onwarn(known, forward);
    for (const warning of [
      { ...known, code: "UNRESOLVED_IMPORT" },
      { ...known, message: 'semantics of directive "use server"' },
      { ...known, id: `${root}/host.tsx` },
      { ...known, id: `${root}/node_modules/other/index.js` },
      { ...known, id: undefined },
    ])
      diagnostics.onwarn(warning, forward);
    diagnostics.plugin.buildEnd();
    assert.equal(forwarded.length, 5);
    assert.equal(notices.length, 2);
    assert.match(notices[0], /ReorderContext\.mjs/);
    assert.match(notices[1], /1 repeated/);
  } finally {
    console.warn = warn;
  }
});

test("parallel modes retain strict checking and independent configs on failure", async () => {
  const consumer = await mkdtemp(join(tmpdir(), "kind-types-probe-"));
  const compiler = fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url));
  try {
    await writeFile(join(consumer, "package.json"), '{"type":"module"}');
    await writeFile(join(consumer, "valid.ts"), "export const value: number = 1;");
    await checkTypes(consumer, compiler, ["valid.ts"]);
    await writeFile(join(consumer, "invalid.ts"), 'export const value: number = "wrong";');
    await assert.rejects(
      checkTypes(consumer, compiler, ["invalid.ts"], { stdio: "ignore" }),
      /consumer types failed/,
    );
    for (const mode of ["NodeNext", "Bundler"]) {
      const config = JSON.parse(await readFile(join(consumer, `tsconfig.${mode}.json`), "utf8"));
      assert.equal(config.compilerOptions.moduleResolution, mode);
      assert.equal(config.compilerOptions.strict, true);
      assert.equal(config.compilerOptions.skipLibCheck, false);
      assert.deepEqual(config.files, ["invalid.ts"]);
    }
  } finally {
    await rm(consumer, { recursive: true, force: true });
  }
});

test("parallel aggregate waits for sibling evidence and propagates failure", async () => {
  const scratch = await mkdtemp(join(tmpdir(), "kind-runner-probe-"));
  const runner = fileURLToPath(new URL("./run-checks.mjs", import.meta.url));
  try {
    const fakeNpm = join(scratch, "npm.mjs");
    await writeFile(
      fakeNpm,
      `const name=process.argv.at(-1); if(name==='check:ci')process.exit(7); setTimeout(()=>console.log('completed '+name),200);`,
    );
    assert.throws(
      () =>
        execFileSync(process.execPath, [runner, "preflight"], {
          encoding: "utf8",
          env: { ...process.env, npm_execpath: fakeNpm },
        }),
      (error) => {
        assert.equal(error.status, 1);
        assert.match(error.stdout, /check:ci failed/);
        assert.match(error.stdout, /completed check:release/);
        assert.match(error.stdout, /completed lint/);
        return true;
      },
    );
    assert.throws(() => execFileSync(process.execPath, [runner, "invalid"], { stdio: "pipe" }));
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});

test("docs-only filter is conservative for mixed changes and executable paths", async () => {
  const { needsBrowsers, changedPaths } = await import("./ci-paths.mjs");
  assert.equal(
    needsBrowsers([
      "README.md",
      "docs/development.md",
      "apps/docs/src/page.tsx",
      "packages/charts/README.md",
    ]),
    false,
  );
  for (const path of [
    "packages/charts/src/index.ts",
    "tests/chart.spec.ts",
    "scripts/ci-paths.mjs",
    ".github/workflows/ci.yml",
    "package-lock.json",
    "examples/chart/index.html",
    "unknown/new-file",
  ])
    assert.equal(needsBrowsers(["docs/readme.md", path]), true, path);
  assert.equal(needsBrowsers([]), true);
  assert.equal(changedPaths("0".repeat(40), "a".repeat(40)), null);
  assert.equal(changedPaths("--invalid", "a".repeat(40)), null);
});

test("required CI receipts reject failed, cancelled and unexpected skipped prerequisites", async () => {
  const { parse } = await import("yaml");
  const ci = parse(await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"));
  for (const id of ["check"]) {
    const command = ci.jobs[id].steps[0].run;
    const env = {
      ...process.env,
      CHANGES: "success",
      FAST: "success",
      PACKED: "success",
      RUN_BROWSERS: "true",
      BROWSERS: "success",
    };
    const run = (overrides) =>
      execFileSync("bash", ["-e", "-c", command], { env: { ...env, ...overrides }, stdio: "pipe" });
    run({});
    run({ RUN_BROWSERS: "false", BROWSERS: "skipped" });
    for (const status of ["failure", "cancelled", "skipped", ""]) {
      for (const gate of ["CHANGES", "FAST", "PACKED"])
        assert.throws(() => run({ [gate]: status }));
      assert.throws(() => run({ BROWSERS: status }));
    }
    assert.throws(() => run({ RUN_BROWSERS: "", BROWSERS: "skipped" }));
    assert.throws(() => run({ RUN_BROWSERS: "false", BROWSERS: "failure" }));
  }
});

test("parallel browser runner forwards the shard to every suite", async () => {
  const scratch = await mkdtemp(join(tmpdir(), "kind-shard-probe-"));
  try {
    const fakeNpm = join(scratch, "npm.mjs");
    await writeFile(fakeNpm, "console.log(JSON.stringify(process.argv.slice(2)));");
    const stdout = execFileSync(
      process.execPath,
      [fileURLToPath(new URL("./run-checks.mjs", import.meta.url)), "consumers", "--shard=2/4"],
      {
        encoding: "utf8",
        env: { ...process.env, npm_execpath: fakeNpm },
      },
    );
    for (const suite of [
      "test:chart",
      "test:composition",
      "test:configured-line",
      "test:line-integrations",
    ])
      assert.ok(stdout.includes(JSON.stringify(["run", suite, "--", "--shard=2/4"])));
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});

test("Docs completion receipt fails on every incomplete prerequisite", async () => {
  const { parse } = await import("yaml");
  const docs = parse(
    await readFile(new URL("../.github/workflows/docs.yml", import.meta.url), "utf8"),
  );
  const command = docs.jobs.docs.steps[0].run;
  const env = { ...process.env, BUILD: "success", CONSUMERS: "success", BROWSERS: "success" };
  const run = (overrides) =>
    execFileSync("bash", ["-e", "-c", command], { env: { ...env, ...overrides }, stdio: "pipe" });
  run({});
  for (const gate of ["BUILD", "CONSUMERS", "BROWSERS"])
    for (const status of ["failure", "cancelled", "skipped", ""])
      assert.throws(() => run({ [gate]: status }));
});

test("background chrome preserves series and native export boundaries", async () => {
  const root = new URL("../", import.meta.url);
  const source = await readFile(
    new URL("packages/charts/src/chart-background-pattern.tsx", root),
    "utf8",
  );
  const imports = [...source.matchAll(/from "([^"\n]+)"/g)].map((match) => match[1]);
  assert.deepEqual(imports, ["react", "recharts"]);
  const tests = await readFile(new URL("tests/chart.test.mjs", root), "utf8");
  const nativeList = tests
    .split('test("composition components and helpers preserve native identity", () => {')[1]
    .split("});")[0];
  assert.doesNotMatch(nativeList, /ChartBackgroundPattern|defineChartBackgroundPattern/);
  const publicList = tests
    .split('test("direct and namespace imports expose the same public components", () => {')[1]
    .split("});")[0];
  assert.match(publicList, /"ChartBackgroundPattern"/);
  assert.match(publicList, /"defineChartBackgroundPattern"/);
});
