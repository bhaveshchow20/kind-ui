import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export const sourcePaths = [
  "packages/charts",
  "scripts/prepare-package.mjs",
  "scripts/check-package.mjs",
  "scripts/copy-styles.mjs",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
];

// Promote retained hosted package-gate bytes without creating a second tarball.
export function readValidatedArtifact(root, directory, manifest) {
  const metadata = JSON.parse(
    readFileSync(path.join(directory, "validated-artifact.json"), "utf8"),
  );
  assert.equal(metadata.package?.name, manifest.name, "Validated package name differs");
  assert.equal(metadata.package?.version, manifest.version, "Validated package version differs");
  assert.equal(
    metadata.filename,
    `kind-ui-charts-${manifest.version}.tgz`,
    "Validated package filename differs",
  );
  assert.equal(metadata.source?.dirty, false, "Validated source must be clean");
  assert.match(metadata.source?.checkoutCommit ?? "", /^[a-f0-9]{40}$/);
  assert.match(metadata.tools?.node ?? "", /^v?22\./, "Use the hosted Node 22 package gate");
  assert.ok(Number(metadata.workflow?.runId) > 0, "Validated workflow receipt is missing");
  assert.ok(Number(metadata.workflow?.runAttempt) > 0, "Validated workflow attempt is missing");
  const artifact = path.join(directory, metadata.filename);
  const bytes = readFileSync(artifact);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    metadata.sha256,
    "Validated package checksum differs",
  );
  assert.equal(
    `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
    metadata.integrity,
    "Validated package integrity differs",
  );
  execFileSync(
    "git",
    ["diff", "--exit-code", metadata.source.checkoutCommit, "--", ...sourcePaths],
    { cwd: root, stdio: "ignore" },
  );
  return { metadata, artifact };
}
