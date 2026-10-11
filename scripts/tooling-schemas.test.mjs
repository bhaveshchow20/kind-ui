import assert from "node:assert/strict";
import test from "node:test";
import {
  artifactReceiptSchema,
  changesetStatusSchema,
  integrationEvidenceSchema,
  npmPackSchema,
  packageIdentitySchema,
  parseJson,
  registryMetadataSchema,
  reviewedVersionSchema,
  workspaceManifestSchema,
} from "./tooling-schemas.mjs";

const receipt = {
  filename: "kind-ui-charts-0.1.0.tgz",
  sha256: "a".repeat(64),
  integrity: `sha512-${Buffer.alloc(64).toString("base64")}`,
  package: { name: "@kind-ui/charts", version: "0.1.0" },
  source: {
    checkoutCommit: "a".repeat(40),
    pullRequestHeadCommit: null,
    pullRequestBaseCommit: null,
    dirty: false,
  },
  workflow: { event: null, runId: null, runAttempt: null, runUrl: null },
};

test("local and workflow receipts retain typed provenance without granting release approval", () => {
  assert.deepEqual(artifactReceiptSchema.parse(parseJson(JSON.stringify(receipt))), receipt);
  const workflow = {
    event: "push",
    runId: "123",
    runAttempt: "1",
    runUrl: "https://github.com/owner/repo/actions/runs/123",
  };
  assert.deepEqual(artifactReceiptSchema.parse({ ...receipt, workflow }).workflow, workflow);
  // Structural validation deliberately leaves approved event/identity and bytes
  // to verifyReleaseArtifact, whose negative fixtures remain the policy proof.
  assert.equal(
    artifactReceiptSchema.parse({ ...receipt, source: { ...receipt.source, dirty: true } }).source
      .dirty,
    true,
  );
});

test("malformed external JSON fails at the named boundary before field use", () => {
  for (const malformed of [null, [], "receipt", 42])
    assert.throws(() => artifactReceiptSchema.parse(malformed));
  for (const replacement of [
    { source: { ...receipt.source, dirty: "false" } },
    { source: { ...receipt.source, checkoutCommit: "main" } },
    { source: { ...receipt.source, pullRequestHeadCommit: undefined } },
    { workflow: { ...receipt.workflow, runId: 123 } },
    { filename: "../other.tgz" },
    { sha256: "not-a-digest" },
    { integrity: "sha1-legacy" },
    { package: { name: "@kind-ui/charts", version: 1 } },
    { tools: { node: "22", npm: "11", typescript: null, vite: "8" } },
    { consumerVersions: { react: 19 } },
  ])
    assert.throws(() => artifactReceiptSchema.parse({ ...receipt, ...replacement }));
  assert.throws(() => parseJson("{ broken"), SyntaxError);
});

test("npm pack output requires one artifact with typed file paths and integrity", () => {
  const packed = [
    {
      filename: receipt.filename,
      integrity: receipt.integrity,
      files: [{ path: "dist/index.js", size: 100 }],
    },
  ];
  assert.equal(npmPackSchema.parse(packed)[0].files[0].path, "dist/index.js");
  for (const bad of [
    [],
    [...packed, ...packed],
    [{ ...packed[0], files: [{ path: false }] }],
    [{ ...packed[0], integrity: null }],
  ])
    assert.throws(() => npmPackSchema.parse(bad));
});

test("version policy and Changesets status reject invalid configuration shapes", () => {
  assert.throws(() =>
    reviewedVersionSchema.parse({
      package: "@kind-ui/charts",
      version: "0.1.0",
      changesets: "fix",
    }),
  );
  assert.throws(() =>
    reviewedVersionSchema.parse({ package: "@kind-ui/charts", version: "0.1.0", unexpected: true }),
  );
  assert.throws(() =>
    changesetStatusSchema.parse({
      releases: [
        {
          name: "@kind-ui/charts",
          oldVersion: "0.1.0",
          newVersion: "0.1.1",
          type: "patch",
          changesets: [false],
        },
      ],
    }),
  );
  assert.throws(() =>
    workspaceManifestSchema.parse({ private: "true", version: "0.0.0", devDependencies: {} }),
  );
  assert.throws(() => packageIdentitySchema.parse({ name: "@kind-ui/charts", version: 1 }));
});

test("integration and registry metadata reject arrays masquerading as keyed objects", () => {
  assert.throws(() =>
    integrationEvidenceSchema.parse({
      sha256: receipt.sha256,
      checks: "Next production static export",
    }),
  );
  for (const bad of [
    {},
    { versions: [] },
    { "dist-tags": [] },
    { versions: { "0.1.0": { dist: { integrity: false } } } },
  ])
    assert.throws(() => registryMetadataSchema.parse(bad));
  assert.deepEqual(
    registryMetadataSchema.parse({ versions: {}, "dist-tags": { latest: "0.1.0" }, time: {} })[
      "dist-tags"
    ],
    { latest: "0.1.0" },
  );
});
