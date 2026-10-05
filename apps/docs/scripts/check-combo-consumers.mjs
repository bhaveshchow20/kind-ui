import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { filesFor } from "../lib/example-files.mjs";

const bundles = JSON.parse(readFileSync("generated/combo-examples.json", "utf8"));
const root = path.resolve("artifacts/combo-consumer");
mkdirSync(root, { recursive: true });
const first = Object.values(bundles)[0];
for (const [file, body] of Object.entries(first.files)) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, body);
}
mkdirSync(path.join(root, "vendor"), { recursive: true });
cpSync("vendor/kind-ui-charts-0.0.0.tgz", path.join(root, "vendor/kind-ui-charts-0.0.0.tgz"));
execFileSync(
  "npm",
  ["ci", "--cache", "/tmp/combo-npm-cache", "--ignore-scripts", "--no-audit", "--no-fund"],
  { cwd: root, stdio: "inherit" },
);
const results = [];
for (const bundle of Object.values(bundles)) {
  for (const variant of bundle.variants ? Object.keys(bundle.variants) : [undefined]) {
    rmSync(path.join(root, "src"), { recursive: true, force: true });
    for (const [file, body] of Object.entries(filesFor(bundle, {}, variant))) {
      const target = path.join(root, file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, body);
    }
    writeFileSync(
      path.join(root, "tsconfig.nodenext.json"),
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
    execFileSync("npm", ["exec", "tsc", "--", "-p", "tsconfig.nodenext.json"], {
      cwd: root,
      stdio: "inherit",
    });
    execFileSync(
      "npm",
      [
        "exec",
        "tsc",
        "--",
        "-p",
        "tsconfig.nodenext.json",
        "--module",
        "ESNext",
        "--moduleResolution",
        "Bundler",
      ],
      { cwd: root, stdio: "inherit" },
    );
    execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
    results.push({
      id: bundle.id,
      variant: variant ?? "default",
      strictNodeNext: true,
      strictBundler: true,
      production: true,
    });
  }
}
writeFileSync("artifacts/combo-consumer-results.json", `${JSON.stringify(results, null, 2)}\n`);
console.log(
  `${results.length} Combo consumers passed against the independently installed pinned artifact.`,
);
