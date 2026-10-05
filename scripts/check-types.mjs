import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function checkTypes(consumer, compiler, files, { stdio = "inherit" } = {}) {
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
            skipLibCheck: false,
            noEmit: true,
            typeRoots: [join(consumer, "node_modules", "@types")],
          },
          files,
        }),
      );
      await new Promise((resolve, reject) => {
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
      });
    }),
  );
  for (const result of results) if (result.status === "rejected") throw result.reason;
}
