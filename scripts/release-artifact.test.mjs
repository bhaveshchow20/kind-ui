import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyReleaseArtifact } from "./release-artifact.mjs";

const expected = {
  commit: "a".repeat(40),
  repository: "owner/charts",
  version: "0.1.0",
  tag: "latest",
  runId: "123",
  runAttempt: "2",
};
async function fixture(t, { privatePackage = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), "kind-release-receipt-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "package"));
  await mkdir(join(root, "line-integrations"));
  const source = join(root, "source");
  await mkdir(join(source, "package"), { recursive: true });
  await writeFile(
    join(source, "package/package.json"),
    JSON.stringify({
      name: "@kind-ui/charts",
      version: expected.version,
      private: privatePackage,
      license: "MIT",
      repository: {
        url: `git+https://github.com/${expected.repository}.git`,
        directory: "packages/charts",
      },
    }),
  );
  const filename = "kind-ui-charts-0.1.0.tgz";
  const tarball = join(root, "package", filename);
  execFileSync("tar", ["-czf", tarball, "-C", source, "package"]);
  const bytes = await readFile(tarball);
  const receipt = {
    filename,
    package: { name: "@kind-ui/charts", version: expected.version },
    sha256: createHash("sha256").update(bytes).digest("hex"),
    integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
    source: {
      checkoutCommit: expected.commit,
      dirty: false,
      pullRequestHeadCommit: null,
      pullRequestBaseCommit: null,
    },
    workflow: {
      event: "workflow_dispatch",
      runId: expected.runId,
      runAttempt: expected.runAttempt,
      runUrl: `https://github.com/${expected.repository}/actions/runs/${expected.runId}`,
    },
  };
  const integration = {
    sha256: receipt.sha256,
    checks: [
      "Next production static export",
      "package SSR shell/content",
      "Tailwind production build",
      "named icon tree-shaking",
    ],
  };
  const save = async () => {
    await writeFile(join(root, "package/validated-artifact.json"), JSON.stringify(receipt));
    await writeFile(join(root, "line-integrations/evidence.json"), JSON.stringify(integration));
  };
  await save();
  await writeFile(join(root, "line-integrations/next-build.log"), "fixture production build");
  return { root, receipt, integration, save, tarball };
}
test("verified main candidate matches approved bytes and current repository identity", async (t) => {
  const f = await fixture(t);
  const result = await verifyReleaseArtifact(f.root, expected, { requirePublic: true });
  assert.equal(result.sha256, f.receipt.sha256);
  assert.equal(result.publishable, true);
});
test("private candidate is rehearsal evidence and cannot enter publishing", async (t) => {
  const f = await fixture(t, { privatePackage: true });
  assert.equal((await verifyReleaseArtifact(f.root, expected)).publishable, false);
  await assert.rejects(verifyReleaseArtifact(f.root, expected, { requirePublic: true }), /blocked/);
});
for (const [name, mutate, reason] of [
  [
    "dirty source",
    (f) => {
      f.receipt.source.dirty = true;
    },
    /Dirty/,
  ],
  [
    "wrong source",
    (f) => {
      f.receipt.source.checkoutCommit = "b".repeat(40);
    },
    /checkout/,
  ],
  [
    "wrong run",
    (f) => {
      f.receipt.workflow.runId = "456";
    },
    /different run/,
  ],
  [
    "old attempt",
    (f) => {
      f.receipt.workflow.runAttempt = "1";
    },
    /different attempt/,
  ],
  [
    "PR artifact",
    (f) => {
      f.receipt.source.pullRequestHeadCommit = "b".repeat(40);
    },
    /PR artifact/,
  ],
  [
    "different integration digest",
    (f) => {
      f.integration.sha256 = "b".repeat(64);
    },
    /Integration/,
  ],
  [
    "missing SSR evidence",
    (f) => {
      f.integration.checks = [];
    },
    /Missing integration/,
  ],
  [
    "path traversal filename",
    (f) => {
      f.receipt.filename = "../other.tgz";
    },
    /filename/,
  ],
  [
    "different npm integrity",
    (f) => {
      f.receipt.integrity = `sha512-${Buffer.alloc(64).toString("base64")}`;
    },
    /integrity/,
  ],
])
  test(`rejects ${name}`, async (t) => {
    const f = await fixture(t);
    mutate(f);
    await f.save();
    await assert.rejects(verifyReleaseArtifact(f.root, expected), reason);
  });
test("rejects tampered bytes and a changed handoff digest", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    verifyReleaseArtifact(f.root, { ...expected, sha256: "b".repeat(64) }),
    /handoff/,
  );
  await writeFile(f.tarball, "tampered");
  await assert.rejects(verifyReleaseArtifact(f.root, expected), /checksum/);
});
test("rejects shell syntax in a tag before reading candidate files", async () => {
  await assert.rejects(
    verifyReleaseArtifact("/absent", { ...expected, tag: "latest;echo injected" }),
    /dist-tag/,
  );
});
