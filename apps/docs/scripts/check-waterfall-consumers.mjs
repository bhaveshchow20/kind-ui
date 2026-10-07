import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { verificationFiles } from "./consumer-validation-files.mjs";

const bundles = JSON.parse(readFileSync("generated/waterfall-examples.json", "utf8"));
const root = path.resolve("artifacts/waterfall-consumer");
function writeFiles(files) {
  for (const [file, body] of Object.entries(files)) {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, body);
  }
}
writeFiles(verificationFiles(bundles.waterfall));
mkdirSync(path.join(root, "vendor"), { recursive: true });
cpSync("vendor/kind-ui-charts-0.3.0.tgz", path.join(root, "vendor/kind-ui-charts-0.3.0.tgz"));
const run = (args) => execFileSync("npm", args, { cwd: root, stdio: "inherit" });
run(["ci", "--ignore-scripts", "--no-audit", "--no-fund"]);
const variants = Object.values(bundles).flatMap((b) => [
  b,
  ...Object.entries(b.variants ?? {})
    .filter(([v]) => v !== b.defaultVariant)
    .map(([value, v]) => ({
      ...b,
      variant: value,
      files: { ...b.files, [`src/examples/${b.id}/example.tsx`]: v.source },
    })),
]);
const evidence = [];
for (const b of variants) {
  rmSync(path.join(root, "src"), { recursive: true, force: true });
  writeFiles(verificationFiles(b));
  run(["run", "build"]);
  writeFileSync(
    path.join(root, "tsconfig.strict.json"),
    JSON.stringify({
      extends: "./tsconfig.json",
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        skipLibCheck: false,
        types: ["react", "react-dom"],
      },
      include: ["src/examples/**/*.tsx"],
    }),
  );
  run(["exec", "tsc", "--", "-p", "tsconfig.strict.json"]);
  run([
    "exec",
    "tsc",
    "--",
    "-p",
    "tsconfig.strict.json",
    "--module",
    "ESNext",
    "--moduleResolution",
    "Bundler",
  ]);
  evidence.push({
    id: b.id,
    variant: b.variant ?? b.defaultVariant,
    production: "passed",
    strictNodeNext: "passed",
    strictBundler: "passed",
  });
}
assert.equal(evidence.length, 5);
assert.deepEqual(
  evidence.filter(({ id }) => id === "waterfall-materials").map(({ variant }) => variant),
  ["default", "clay", "glow"],
);
writeFileSync("artifacts/waterfall-consumers.json", JSON.stringify(evidence, null, 2));
