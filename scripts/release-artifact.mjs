import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function verifyReleaseArtifact(directory, expected, { requirePublic = false } = {}) {
  assert.match(expected.commit, /^[a-f0-9]{40}$/, "Expected an immutable checkout commit");
  assert.match(
    expected.repository,
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
    "Expected the current GitHub repository",
  );
  assert.match(expected.runId, /^\d+$/, "Expected a workflow run ID");
  assert.match(expected.runAttempt, /^\d+$/, "Expected a workflow attempt");
  assert.match(
    expected.version,
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
    "Expected a stable package version",
  );
  assert.match(expected.tag, /^[a-z][a-z0-9-]*$/, "Expected a plain npm dist-tag");
  const receipt = JSON.parse(await readFile(join(directory, "package/validated-artifact.json")));
  assert.equal(
    receipt.filename,
    `kind-ui-charts-${expected.version}.tgz`,
    "Unexpected candidate filename",
  );
  assert.equal(receipt.package?.name, "@kind-ui/charts", "Unexpected package");
  assert.equal(
    receipt.package.version,
    expected.version,
    "Candidate version differs from approval",
  );
  assert.equal(
    receipt.source?.checkoutCommit,
    expected.commit,
    "Candidate checkout differs from approval",
  );
  assert.equal(
    receipt.source.dirty,
    false,
    "Dirty candidates are diagnostics, never release evidence",
  );
  assert.equal(
    receipt.source.pullRequestHeadCommit,
    null,
    "Use a manual main candidate, not a PR artifact",
  );
  assert.equal(
    receipt.source.pullRequestBaseCommit,
    null,
    "Use a manual main candidate, not a PR artifact",
  );
  assert.equal(
    receipt.workflow?.event,
    "workflow_dispatch",
    "Candidate must come from the manual workflow",
  );
  assert.equal(receipt.workflow.runId, expected.runId, "Candidate is from a different run");
  assert.equal(
    receipt.workflow.runAttempt,
    expected.runAttempt,
    "Candidate is from a different attempt",
  );
  assert.equal(
    receipt.workflow.runUrl,
    `https://github.com/${expected.repository}/actions/runs/${expected.runId}`,
  );
  assert.match(receipt.sha256, /^[a-f0-9]{64}$/, "Expected a SHA-256 digest");
  if (expected.sha256)
    assert.equal(receipt.sha256, expected.sha256, "Digest differs from verified handoff");
  assert.match(
    receipt.integrity,
    /^sha512-[A-Za-z0-9+/]+={0,2}$/,
    "Expected npm SHA-512 integrity",
  );
  const tarball = join(directory, "package", receipt.filename);
  const bytes = await readFile(tarball);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    receipt.sha256,
    "Tarball checksum differs",
  );
  assert.equal(
    `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
    receipt.integrity,
    "npm integrity differs",
  );
  const manifest = JSON.parse(
    execFileSync("tar", ["-xOzf", tarball, "package/package.json"], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    }),
  );
  assert.equal(manifest.name, receipt.package.name);
  assert.equal(manifest.version, receipt.package.version);
  assert.equal(manifest.repository?.url, `git+https://github.com/${expected.repository}.git`);
  assert.equal(manifest.repository.directory, "packages/charts");
  assert.equal(manifest.license, "MIT");
  const integration = JSON.parse(
    await readFile(join(directory, "line-integrations/evidence.json")),
  );
  assert.equal(
    integration.sha256,
    receipt.sha256,
    "Integration evidence uses a different artifact",
  );
  for (const check of [
    "Next production static export",
    "package SSR shell/content",
    "Tailwind production build",
    "named icon tree-shaking",
  ]) {
    assert.ok(integration.checks?.includes(check), `Missing integration build evidence: ${check}`);
  }
  await readFile(join(directory, "line-integrations/next-build.log"));
  const publishable = manifest.private !== true && manifest.version !== "0.0.0";
  if (requirePublic)
    assert.ok(publishable, "Publication is blocked for private/placeholder packages");
  return {
    tarball,
    filename: receipt.filename,
    sha256: receipt.sha256,
    integrity: receipt.integrity,
    version: manifest.version,
    tag: expected.tag,
    publishable,
  };
}
