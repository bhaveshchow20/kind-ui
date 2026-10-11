import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * @param {string} consumer
 * @param {string} compiler
 * @param {string[]} files
 * @param {{stdio?: import("node:child_process").StdioOptions, strictOptionalTypes?: boolean}} [options]
 */
export async function checkTypes(
  consumer,
  compiler,
  files,
  { stdio = "inherit", strictOptionalTypes = false } = {},
) {
  // Independent resolution modes share only immutable installed dependencies.
  // Separate configs prevent one process from reading the other mode's options.
  const results = await Promise.allSettled(
    ["NodeNext", "Bundler"].map(async (mode) => {
      const config = `tsconfig.${mode}.json`;
      await writeFile(
        join(consumer, config),
        JSON.stringify({
          compilerOptions: {
            target: "ES2022",
            jsx: "react-jsx",
            esModuleInterop: true,
            module: mode === "Bundler" ? "ESNext" : mode,
            moduleResolution: mode,
            strict: true,
            noUncheckedIndexedAccess: true,
            // Redux Toolkit's TaskAbortError.code/asyncThunk declarations fail
            // exact optional checking. Baseline modes check all declarations;
            // focused strict fixtures check consumer source with that flag.
            exactOptionalPropertyTypes: strictOptionalTypes,
            isolatedModules: true,
            noImplicitOverride: true,
            skipLibCheck: strictOptionalTypes,
            noEmit: true,
            typeRoots: [join(consumer, "node_modules", "@types")],
          },
          files,
        }),
      );
      await new Promise(
        /** @param {(value?: void) => void} resolve */ (resolve, reject) => {
          const child = spawn(process.execPath, [compiler, "-p", config], {
            cwd: consumer,
            stdio,
            env: { ...process.env, NODE_PATH: "" },
          });
          child.on("error", reject);
          child.on("exit", (code, signal) =>
            code === 0
              ? resolve()
              : reject(new Error(`${mode} consumer types failed (${signal ?? code})`)),
          );
        },
      );
    }),
  );
  for (const result of results) if (result.status === "rejected") throw result.reason;
}
