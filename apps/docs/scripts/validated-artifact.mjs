import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import {
  artifactReceiptSchema,
  packageIdentitySchema,
  parseJson,
} from "../../../scripts/tooling-schemas.mjs";

export const sourcePaths = [
  "packages/charts",
  "scripts/prepare-package.mjs",
  "scripts/check-package.mjs",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
];

// Read checksum-verified package-gate bytes without creating a second tarball.
/** @param {string} root @param {string} directory @param {unknown} inputManifest */
export function readLocalCandidate(root, directory, inputManifest) {
  const manifest = packageIdentitySchema.parse(inputManifest);
  const metadata = artifactReceiptSchema.parse(
    parseJson(readFileSync(path.join(directory, "validated-artifact.json"), "utf8")),
  );
  assert.equal(metadata.package?.name, manifest.name, "Validated package name differs");
  assert.equal(metadata.package?.version, manifest.version, "Validated package version differs");
  assert.equal(
    metadata.filename,
    `kind-ui-charts-${manifest.version}.tgz`,
    "Validated package filename differs",
  );
  assert.match(metadata.source?.checkoutCommit ?? "", /^[a-f0-9]{40}$/);
  assert.match(metadata.tools?.node ?? "", /^v?22\./, "Use the hosted Node 22 package gate");
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

// Local candidates retain their local provenance; they never acquire a hosted workflow receipt.
/** @param {string} root @param {string} directory @param {unknown} inputManifest */
export function readValidatedArtifact(root, directory, inputManifest) {
  const checked = readLocalCandidate(root, directory, inputManifest);
  assert.equal(checked.metadata.source.dirty, false, "Validated source must be clean");
  assert.ok(Number(checked.metadata.workflow.runId) > 0, "Validated workflow receipt is missing");
  assert.ok(
    Number(checked.metadata.workflow.runAttempt) > 0,
    "Validated workflow attempt is missing",
  );
  return checked;
}

/** Same-version tarball replacements otherwise reuse Webpack's managed-package snapshot. */
/** @param {string} docsRoot @param {string | undefined} previousSha @param {string} nextSha */
export function invalidateChangedPackageCache(docsRoot, previousSha, nextSha) {
  if (previousSha === nextSha) return;
  rmSync(path.join(docsRoot, ".next/cache/webpack"), { recursive: true, force: true });
}
