import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const workflow = parse(
  await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8"),
);
function assertDisabledRelease(w) {
  assert.deepEqual(
    Object.keys(w.on),
    ["workflow_dispatch"],
    "Release must be explicitly dispatched",
  );
  assert.deepEqual(w.permissions, { contents: "read" }, "No publishing identity is granted");
  assert.equal(w.jobs.validate.if, "github.ref == 'refs/heads/main'", "Candidate uses main only");
  assert.deepEqual(w.jobs.validate.strategy.matrix.node, [22, 24]);
  assert.equal(w.jobs.verify.needs, "validate", "Both matrix jobs must pass before handoff");
  assert.equal(w.jobs.publish.needs, "verify");
  // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal GitHub Actions expression.
  assert.equal(w.jobs.publish.if, "${{ false }}", "Publishing remains hard-disabled");
  for (const job of Object.values(w.jobs)) {
    assert.equal(job.permissions, undefined, "No job adds unapproved permissions");
    assert.equal(job.environment, undefined, "No protected environment is created here");
    for (const step of job.steps) {
      if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/, "Pin official actions");
    }
  }
  const publish = w.jobs.publish.steps.find((s) => s.name?.startsWith("Publish"));
  assert.match(
    publish.run,
    /npm publish "\.\/artifacts\/release-candidate\/package\/\$CANDIDATE_FILENAME"/,
  );
  assert.match(publish.run, /--ignore-scripts/);
  assert.ok(w.jobs.publish.steps.some((s) => s.run?.includes("--require-public")));
  assert.ok(!JSON.stringify(w).includes("secrets."), "No credential setup in this workflow");
}
test("manual pipeline preserves read-only permissions and disabled exact-artifact publishing", () =>
  assertDisabledRelease(workflow));
for (const [name, mutate] of [
  [
    "merge trigger",
    (w) => {
      w.on.push = { branches: ["main"] };
    },
  ],
  [
    "publish activation",
    (w) => {
      w.jobs.publish.if = "github.ref == 'refs/heads/main'";
    },
  ],
  [
    "OIDC grant",
    (w) => {
      w.jobs.publish.permissions = { "id-token": "write" };
    },
  ],
  [
    "ungated handoff",
    (w) => {
      w.jobs.verify.needs = undefined;
    },
  ],
])
  test(`requires a separately reviewed change for ${name}`, () => {
    const w = structuredClone(workflow);
    mutate(w);
    assert.throws(() => assertDisabledRelease(w));
  });

test("manual validation defaults to the reviewed package candidate version", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../packages/charts/package.json", import.meta.url), "utf8"),
  );
  assert.equal(workflow.on.workflow_dispatch.inputs.version.default, manifest.version);
  assert.equal(manifest.private, true);
});
