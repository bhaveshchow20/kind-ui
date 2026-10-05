import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const ci = parse(await read(".github/workflows/ci.yml"));
const docs = parse(await read(".github/workflows/docs.yml"));
const release = parse(await read(".github/workflows/release.yml"));
const dependabot = parse(await read(".github/dependabot.yml"));

test("PR checks run without trigger exclusions and preserve required receipts", () => {
  assert.equal(ci.on.pull_request, null);
  assert.deepEqual(ci.on.push.branches, ["main"]);
  for (const [id, name] of [
    ["check22", "check (22)"],
    ["check24", "check (24)"],
  ]) {
    const job = ci.jobs[id];
    assert.equal(job.name, name);
    assert.equal(job.if, "always()");
    assert.deepEqual(job.needs, ["changes", "fast", "packed", "playwright"]);
  }
  assert.equal(ci.jobs.fast.needs, undefined);
  assert.equal(ci.jobs.packed.needs, undefined);
  assert.equal(ci.jobs.fast.strategy, undefined);
  for (const workflow of [ci, docs, release]) {
    for (const job of Object.values(workflow.jobs)) {
      assert.equal(job.strategy?.matrix.node, undefined);
      for (const step of job.steps.filter((s) => s.uses?.startsWith("actions/setup-node@"))) {
        assert.equal(step.with["node-version"], 22);
      }
    }
  }
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
  for (const job of [ci.jobs.playwright, release.jobs.validate]) {
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
  for (const job of [ci.jobs.fast, docs.jobs.build, release.jobs.validate]) {
    assert.ok(job.steps.some((step) => step.run === "npm audit --audit-level=high --include=dev"));
  }
  assert.ok(
    docs.jobs.build.steps.some(
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

test("split CI covers all aggregate gates and sends shard args to every browser suite", async () => {
  const { scripts } = JSON.parse(await read("package.json"));
  const fastRuns = ci.jobs.fast.steps.map((s) => s.run).filter(Boolean);
  for (const command of ["npm run check:preflight", "npm run typecheck", "npm run test:unit"])
    assert.ok(fastRuns.includes(command));
  assert.equal(scripts["check:preflight"], "node scripts/run-checks.mjs preflight");
  assert.ok(ci.jobs.packed.steps.some((s) => s.run === "npm run check:packed"));
  for (const gate of [
    "pack:artifact",
    "check-showcase-code.mjs",
    "tsc -p examples/chart",
    "vite build examples/chart",
    "check:line-integrations",
  ])
    assert.ok(scripts["check:packed"].includes(gate), `Missing gate: ${gate}`);
  assert.deepEqual(ci.jobs.playwright.needs, ["changes", "packed"]);
  assert.equal(ci.jobs.playwright.if, "needs.changes.outputs.browsers == 'true'");
  assert.deepEqual(ci.jobs.playwright.strategy.matrix.shard, [1, 2, 3, 4]);
  assert.equal(ci.jobs.playwright.strategy["fail-fast"], false);
  // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal GitHub Actions expression.
  assert.ok(ci.jobs.playwright.steps.some((s) => s.run?.includes("--shard=${{ matrix.shard }}/4")));
  const runner = await read("scripts/run-checks.mjs");
  for (const suite of [
    "test:chart",
    "test:composition",
    "test:configured-line",
    "test:line-integrations",
  ])
    assert.ok(runner.includes(`"${suite}"`));
  assert.match(runner, /process\.argv\.slice\(3\)/);
  const upload = ci.jobs.packed.steps.find((s) => s.with?.name === "charts-browser-fixtures");
  const download = ci.jobs.playwright.steps.find((s) =>
    s.uses?.startsWith("actions/download-artifact@"),
  );
  assert.equal(download.with.name, upload.with.name);
  for (const path of [
    "artifacts/package/",
    "artifacts/packed-*/",
    "artifacts/line-integrations/",
    "examples/chart/dist/",
  ])
    assert.ok(upload.with.path.split("\n").includes(path));
});

test("cached browser binaries do not replace OS dependency installation", () => {
  for (const job of [ci.jobs.playwright, docs.jobs.browsers, release.jobs.validate]) {
    const steps = job.steps;
    const cache = steps.find((s) => s.uses?.startsWith("actions/cache@"));
    assert.equal(cache.with.path, "~/.cache/ms-playwright");
    assert.ok(cache.with.key.includes("runner.os"));
    assert.ok(cache.with.key.includes("runner.arch"));
    assert.ok(cache.with.key.includes("playwright-version.outputs.version"));
    assert.equal(cache.with["restore-keys"], undefined);
    const deps = steps.find((s) => s.run === "npm exec playwright install-deps -- chromium");
    assert.equal(deps.if, undefined);
    const install = steps.find((s) => s.run === "npm exec playwright install -- chromium");
    assert.equal(install.if, "steps.browsers.outputs.cache-hit != 'true'");
  }
});

test("Docs separates copied consumers without dropping any browser or build gate", () => {
  assert.equal(docs.jobs.build.needs, undefined);
  assert.equal(docs.jobs.consumers.needs, undefined);
  assert.deepEqual(docs.jobs.consumers.strategy.matrix.shard, [1, 2, 3, 4]);
  assert.equal(docs.jobs.consumers.strategy["fail-fast"], false);
  assert.ok(
    docs.jobs.consumers.steps.some((s) => s.run?.includes("npm run check:consumers -- --shard=")),
  );
  assert.deepEqual(docs.jobs.browsers.needs, "build");
  assert.deepEqual(docs.jobs.docs.needs, ["build", "consumers", "browsers"]);
  assert.equal(docs.jobs.docs.if, "always()");
  const build = docs.jobs.build.steps.map((s) => s.run ?? "").join("\n");
  for (const command of ["npm run generate", "npm run build", "npm run check"])
    assert.ok(build.includes(command));
  const browsers = docs.jobs.browsers.steps.map((s) => s.run ?? "").join("\n");
  assert.ok(browsers.includes("npm run check:browser"));
  for (const family of [
    "line",
    "area",
    "pie",
    "radar",
    "sankey",
    "histogram",
    "radial",
    "waterfall",
    "box-plot",
    "combo",
    "scatter",
    "bar",
    "heatmap",
  ])
    assert.ok(browsers.includes(`start-${family}-checks.mjs`));
  for (const contract of [
    "pie-contract",
    "check-sankey-source",
    "histogram-contract",
    "waterfall-contract",
    "combo-contract",
    "heatmap-contract",
  ])
    assert.ok(browsers.includes(`${contract}.test.mjs`));
  for (const family of ["histogram", "waterfall", "box-plot", "combo", "heatmap"])
    assert.ok(browsers.includes(`check-${family}-consumers.mjs`));
});
