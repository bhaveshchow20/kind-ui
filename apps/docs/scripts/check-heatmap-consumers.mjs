import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const bundles = JSON.parse(readFileSync("generated/heatmap-examples.json", "utf8"));
const root = path.resolve("artifacts/heatmap-consumer");
mkdirSync(root, { recursive: true });
function writeFiles(files) {
  for (const [name, body] of Object.entries(files)) {
    const target = path.join(root, name);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, body);
  }
}
writeFiles(bundles.heatmap.files);
mkdirSync(path.join(root, "vendor"), { recursive: true });
cpSync("vendor/kind-ui-charts-0.1.0.tgz", path.join(root, "vendor/kind-ui-charts-0.1.0.tgz"));
execFileSync("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
  cwd: root,
  stdio: "inherit",
});
const results = [];
for (const bundle of Object.values(bundles)) {
  const sources = bundle.variants ?? {
    default: { source: bundle.files[`src/examples/${bundle.id}/example.tsx`] },
  };
  for (const [variant, { source }] of Object.entries(sources)) {
    rmSync(path.join(root, "src"), { recursive: true, force: true });
    writeFiles({ ...bundle.files, [`src/examples/${bundle.id}/example.tsx`]: source });
    execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
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
    for (const [module, resolution] of [
      ["NodeNext", "NodeNext"],
      ["ESNext", "Bundler"],
    ]) {
      execFileSync(
        "npm",
        [
          "exec",
          "tsc",
          "--",
          "-p",
          "tsconfig.strict.json",
          "--module",
          module,
          "--moduleResolution",
          resolution,
        ],
        { cwd: root, stdio: "inherit" },
      );
    }
    results.push({
      id: bundle.id,
      variant,
      production: "passed",
      NodeNext: "passed",
      Bundler: "passed",
      skipLibCheck: false,
    });
  }
}
writeFileSync("artifacts/heatmap-consumer-results.json", `${JSON.stringify(results, null, 2)}\n`);
console.log(
  `${results.length} installed-artifact Heatmap consumers passed production and strict declaration modes.`,
);
