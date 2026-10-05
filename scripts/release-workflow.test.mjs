import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const workflow = parse(
  await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8"),
);
const versionWorkflow = parse(
  await readFile(new URL("../.github/workflows/version.yml", import.meta.url), "utf8"),
);

function assertVersionPullRequests(w) {
  assert.deepEqual(Object.keys(w.on), ["push"]);
  assert.deepEqual(w.on.push.branches, ["main"]);
  assert.deepEqual(w.on.push.paths, [".changeset/**", ".github/workflows/version.yml"]);
  assert.deepEqual(w.permissions, { contents: "read" });
  assert.deepEqual(Object.keys(w.jobs), ["version"]);
  const job = w.jobs.version;
  assert.equal(
    job.if,
    "github.repository == 'bhaveshchow20/kind-ui' && github.ref == 'refs/heads/main'",
  );
  assert.deepEqual(job.permissions, { contents: "write", "pull-requests": "write" });
  assert.equal(job.environment, undefined);
  const plan = job.steps.find((step) => step.id === "plan");
  assert.match(plan.run, /npm run release:status/);
  assert.match(plan.run, /status\.releases\.length > 0/);
  const action = job.steps.find((step) => step.uses?.startsWith("changesets/"));
  assert.equal(action.uses, "changesets/action/version@ae32849d5ba541f9ae29e40e22a623bc13562f51");
  assert.equal(action.if, "steps.plan.outputs.has_changesets == 'true'");
  assert.deepEqual(action.with, {
    script: "npm run release:version",
    "pr-title": "Version packages",
    "pr-draft": "create",
  });
  assert.ok(!JSON.stringify(w).includes("secrets."));
  for (const step of job.steps) {
    if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
    if (step.uses?.startsWith("actions/checkout@"))
      assert.equal(step.with["persist-credentials"], false);
    assert.ok(!/npm publish|changeset publish/.test(step.run ?? ""));
  }
}

test("Changesets opens draft version PRs only for pending changes on main", () =>
  assertVersionPullRequests(versionWorkflow));
for (const [name, mutate] of [
  [
    "untrusted trigger",
    (w) => {
      w.on.pull_request = null;
    },
  ],
  [
    "publishing permission",
    (w) => {
      w.jobs.version.permissions["id-token"] = "write";
    },
  ],
  [
    "unconditional version bump",
    (w) => {
      w.jobs.version.steps.at(-1).if = undefined;
    },
  ],
  [
    "publishing action",
    (w) => {
      w.jobs.version.steps.at(-1).uses =
        "changesets/action/publish@ae32849d5ba541f9ae29e40e22a623bc13562f51";
    },
  ],
]) {
  test(`version PR workflow rejects ${name}`, () => {
    const w = structuredClone(versionWorkflow);
    mutate(w);
    assert.throws(() => assertVersionPullRequests(w));
  });
}
function assertDisabledRelease(w) {
  assert.deepEqual(
    Object.keys(w.on),
    ["workflow_dispatch"],
    "Release must be explicitly dispatched",
  );
  assert.deepEqual(w.permissions, { contents: "read" }, "No publishing identity is granted");
  assert.equal(w.jobs.validate.if, "github.ref == 'refs/heads/main'", "Candidate uses main only");
  assert.equal(w.jobs.validate.strategy, undefined);
  for (const job of Object.values(w.jobs)) {
    assert.equal(
      job.steps.find((s) => s.uses?.startsWith("actions/setup-node@"))?.with["node-version"],
      22,
    );
  }
  assert.equal(w.jobs.verify.needs, "validate", "Validation must pass before handoff");
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
  assert.equal(manifest.private, undefined);
});
