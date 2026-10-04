import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const ci = parse(await read(".github/workflows/ci.yml"));
const docs = parse(await read(".github/workflows/docs.yml"));
const release = parse(await read(".github/workflows/release.yml"));
const dependabot = parse(await read(".github/dependabot.yml"));

test("PR checks retain the protected Node status names and run without path exclusions", () => {
  assert.equal(ci.on.pull_request, null);
  assert.deepEqual(ci.on.push.branches, ["main"]);
  assert.ok(ci.jobs.check, "Required check job must remain present");
  assert.equal(ci.jobs.check.name, undefined);
  assert.deepEqual(ci.jobs.check.strategy.matrix.node, [22, 24]);
  assert.equal(ci.jobs.check.strategy["fail-fast"], false);
});

test("all workflows keep untrusted code read-only, pinned, and bounded", () => {
  for (const workflow of [ci, docs, release]) {
    assert.deepEqual(workflow.permissions, { contents: "read" });
    assert.equal(workflow.on.pull_request_target, undefined);
    assert.equal(workflow.on.workflow_run, undefined);
    assert.ok(!JSON.stringify(workflow).includes("secrets."));
    for (const job of Object.values(workflow.jobs)) {
      assert.equal(job.permissions, undefined);
      assert.ok(Number.isInteger(job["timeout-minutes"]));
      assert.ok(job["timeout-minutes"] > 0 && job["timeout-minutes"] <= 60);
      for (const step of job.steps) {
        if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
        if (step.uses?.startsWith("actions/checkout@"))
          assert.equal(step.with["persist-credentials"], false);
      }
    }
  }
});

test("Docs follows shared dependency, build configuration, and package gate changes", () => {
  for (const event of ["pull_request", "push"]) {
    for (const path of [
      "apps/docs/**",
      "packages/charts/**",
      "package.json",
      "package-lock.json",
      "tsconfig.base.json",
      "scripts/**",
      ".github/workflows/docs.yml",
    ]) {
      assert.ok(docs.on[event].paths.includes(path), `${event} must cover ${path}`);
    }
  }
});

test("both test pipelines retain every aggregate browser suite's available failure output", async () => {
  const directories = await Promise.all(
    [
      "playwright.config.mjs",
      "playwright.composition.config.mjs",
      "playwright.configured-line.config.mjs",
      "playwright.line-integrations.config.mjs",
    ].map(async (file) => {
      const { default: config } = await import(new URL(`../${file}`, import.meta.url));
      assert.equal(typeof config.outputDir, "string", `Missing browser evidence in ${file}`);
      return config.outputDir;
    }),
  );
  for (const job of [ci.jobs.check, release.jobs.validate]) {
    const uploads = job.steps.filter(
      (step) => step.uses?.startsWith("actions/upload-artifact@") && step.if === "always()",
    );
    for (const directory of [...directories, "artifacts/line-integrations/next-build.log"]) {
      assert.ok(
        uploads.some(
          (step) =>
            step.with.path.split("\n").includes(`${directory}/`) ||
            step.with.path.split("\n").includes(directory),
        ),
        `Missing failure evidence: ${directory}`,
      );
    }
  }
});

test("advisory checks include development tooling and npm updates cover both lockfiles", async () => {
  for (const job of [ci.jobs.check, docs.jobs.docs, release.jobs.validate]) {
    assert.ok(job.steps.some((step) => step.run === "npm audit --audit-level=high --include=dev"));
  }
  assert.ok(
    docs.jobs.docs.steps.some(
      (step) =>
        step.run === "npm audit --audit-level=high --include=dev" &&
        step["working-directory"] === "apps/docs",
    ),
  );
  for (const directory of ["/", "/apps/docs"]) {
    await read(`${directory === "/" ? "" : "apps/docs/"}package-lock.json`);
    assert.ok(
      dependabot.updates.some(
        (update) => update["package-ecosystem"] === "npm" && update.directory === directory,
      ),
    );
  }
});
