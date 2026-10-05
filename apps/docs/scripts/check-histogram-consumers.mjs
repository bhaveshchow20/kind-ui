import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const bundles = JSON.parse(readFileSync("generated/histogram-examples.json", "utf8"));
const root = path.resolve("artifacts/histogram-consumer");
mkdirSync(root, { recursive: true });
const first = Object.values(bundles)[0];
for (const [name, body] of Object.entries(first.files)) {
  const target = path.join(root, name);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, body);
}
if (first.localPackage) {
  mkdirSync(path.join(root, "vendor"), { recursive: true });
  cpSync("vendor/kind-ui-charts-0.0.0.tgz", path.join(root, "vendor/kind-ui-charts-0.0.0.tgz"));
}
execFileSync(
  "npm",
  [
    existsSync(path.join(root, "package-lock.json")) ? "ci" : "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ],
  { cwd: root, stdio: "inherit" },
);
if (!existsSync("examples/shared/consumer-package-lock.json"))
  cpSync(path.join(root, "package-lock.json"), "examples/shared/consumer-package-lock.json");
const installed = JSON.parse(
  readFileSync(path.join(root, "node_modules/@kind-ui/charts/package.json"), "utf8"),
);
if (installed.version !== first.version)
  throw new Error("Consumer installed the wrong package version");
const evidence = [];
const consumers = Object.values(bundles).flatMap((bundle) => [
  bundle,
  ...Object.entries(bundle.variants ?? {})
    .filter(([value]) => value !== bundle.defaultVariant)
    .map(([value, variant]) => ({
      ...bundle,
      id: `${bundle.id}:${value}`,
      files: { ...bundle.files, [`src/examples/${bundle.id}/example.tsx`]: variant.source },
    })),
]);
for (const bundle of consumers) {
  rmSync(path.join(root, "src"), { recursive: true, force: true });
  for (const [name, body] of Object.entries(bundle.files)) {
    if (name === "package-lock.json") continue;
    const target = path.join(root, name);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, body);
  }
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
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
  evidence.push({
    id: bundle.id,
    status: "passed",
    package: installed.version,
    source: "generated complete consumer files",
    workspaceImports: false,
    declarationModes: ["NodeNext", "Bundler"],
    skipLibCheck: false,
  });
}
writeFileSync(
  "artifacts/histogram-consumer-results.json",
  `${JSON.stringify(evidence, null, 2)}\n`,
);
console.log(
  `${evidence.length} copied consumers passed strict TypeScript and Vite production builds.`,
);
