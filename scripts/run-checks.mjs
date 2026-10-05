import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

export async function runChecks(scripts) {
  assert.ok(process.env.npm_execpath, "Run checks through npm scripts");
  const results = await Promise.all(
    scripts.map(
      (script) =>
        new Promise((resolve) => {
          const start = performance.now();
          console.log(`[check] ${script} started ${new Date().toISOString()}`);
          const child = spawn(process.execPath, [process.env.npm_execpath, "run", script], {
            stdio: "inherit",
            env: process.env,
          });
          child.on("error", (error) => {
            console.error(error);
            resolve(false);
          });
          child.on("exit", (code, signal) => {
            console.log(
              `[check] ${script} ${code === 0 ? "passed" : "failed"} in ${((performance.now() - start) / 1000).toFixed(1)}s${signal ? ` (${signal})` : ""}`,
            );
            resolve(code === 0);
          });
        }),
    ),
  );
  if (results.some((result) => !result)) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "preflight") {
    await runChecks(["check:ci", "check:release", "lint"]);
  } else if (process.argv[2] === "consumers") {
    // Prepared once before this phase; suites own separate ports/output paths.
    await runChecks(["test:chart", "test:composition", "test:configured-line", "check:framework"]);
  } else {
    throw new Error("Expected check phase: preflight or consumers");
  }
}
