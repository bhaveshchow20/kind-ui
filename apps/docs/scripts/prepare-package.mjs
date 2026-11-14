import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve("../..");
const release = process.env.KIND_DOCS_RELEASE_VERSION;
const sourcePaths = [
  "packages/charts",
  "scripts/prepare-package.mjs",
  "scripts/check-package.mjs",
  "scripts/copy-styles.mjs",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
];
let commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
if (
  !release &&
  execFileSync("git", ["status", "--porcelain", "--", ...sourcePaths], {
    cwd: root,
    encoding: "utf8",
  }).trim()
)
  throw new Error(
    "Commit chart package/guard changes before pinning a documentation source revision",
  );
mkdirSync("vendor", { recursive: true });
if (release && !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(release))
  throw new Error("Release version must be exact semver");
const canonical = "vendor/kind-ui-charts-0.1.1.tgz";
let packed;
if (release) {
  packed = JSON.parse(
    execFileSync(
      "npm",
      [
        "pack",
        `@kind-ui/charts@${release}`,
        "--json",
        "--pack-destination",
        path.resolve("vendor"),
      ],
      { cwd: root, encoding: "utf8" },
    ),
  )[0];
  if (packed.filename !== path.basename(canonical))
    renameSync(`vendor/${packed.filename}`, canonical);
} else {
  const reuse = process.argv.includes("--reuse-validated");
  if (!reuse) execFileSync("npm", ["run", "pack:artifact"], { cwd: root, stdio: "inherit" });
  const metadata = JSON.parse(
    readFileSync(path.join(root, "artifacts/package/validated-artifact.json"), "utf8"),
  );
  const artifact = path.join(root, "artifacts/package", metadata.filename);
  const actual = createHash("sha256").update(readFileSync(artifact)).digest("hex");
  if (actual !== metadata.sha256)
    throw new Error("Validated package artifact checksum differs from its metadata");
  const packageManifest = JSON.parse(
    readFileSync(path.join(root, "packages/charts/package.json"), "utf8"),
  );
  if (reuse) {
    const previous = JSON.parse(readFileSync("vendor/provenance.json", "utf8"));
    if (
      previous.sha256 !== actual ||
      previous.integrity !== metadata.integrity ||
      previous.version !== packageManifest.version
    )
      throw new Error(
        "Reuse requires the already-pinned, unchanged source and validated bytes; run prepare:package without reuse",
      );
    execFileSync("git", ["diff", "--exit-code", previous.sourceCommit, "--", ...sourcePaths], {
      cwd: root,
      stdio: "ignore",
    });
    commit = previous.sourceCommit;
  }
  packed = { ...metadata, name: packageManifest.name, version: packageManifest.version };
  cpSync(artifact, canonical);
}
const sha = createHash("sha256").update(readFileSync(canonical)).digest("hex");
writeFileSync(
  "vendor/provenance.json",
  `${JSON.stringify(
    {
      mode: release ? "registry" : "local",
      version: packed.version,
      package: packed.name,
      integrity: packed.integrity,
      sha256: sha,
      sourceCommit: commit,
      publicExportsOnly: true,
      guardedArtifact: !release,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Pinned ${packed.name}@${packed.version} (${release ? "registry" : commit.slice(0, 7)})`,
);
