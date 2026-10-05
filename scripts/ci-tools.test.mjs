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
