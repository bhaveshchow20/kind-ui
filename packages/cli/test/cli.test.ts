// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyPlan, configFilename, createPlan, validateRelativePath } from "../src/index.js";

const roots: string[] = [];
const binary = resolve("packages/cli/dist/bin.js");
const recipeTarget = "src/components/ui/charts/line-chart-demo.tsx";
const receipt = "kind-ui/recipes/charts-line.json";
async function project() {
  const root = await mkdtemp(join(tmpdir(), "ui-cli-test-"));
  roots.push(root);
  await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
  return root;
}
async function init(root: string) {
  await applyPlan(await createPlan(root, { command: "init" }));
}
async function add(root: string) {
  await applyPlan(await createPlan(root, { command: "add", recipe: "charts/line" }));
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("pure planning and repeatable application", () => {
  it("plans init without mutating the project, then applies and repeats", async () => {
    const root = await project();
    const plan = await createPlan(root, { command: "init" });
    expect(plan.files[0]?.action).toBe("create");
    expect(await readdir(root)).toEqual(["package.json"]);
    await applyPlan(plan);
    const repeat = await createPlan(root, { command: "init" });
    expect(repeat.files[0]?.action).toBe("unchanged");
    await applyPlan(repeat);
    expect(JSON.parse(await readFile(join(root, configFilename), "utf8"))).toEqual({
      schemaVersion: 1,
      framework: "react",
      recipesDir: "src/components/ui",
    });
  });
  it("requires a project and initialization", async () => {
    const root = await project();
    await expect(createPlan(root, { command: "add", recipe: "charts/line" })).rejects.toThrow(
      "run init first",
    );
    await rm(join(root, "package.json"));
    await expect(createPlan(root, { command: "init" })).rejects.toThrow("package.json");
  });
  it("plans only the bundled recipe and records versions and source hashes", async () => {
    const root = await project();
    await init(root);
    const before = await readdir(root);
    const plan = await createPlan(root, { command: "add", recipe: "charts/line" });
    expect(await readdir(root)).toEqual(before);
    expect(plan.files.map((file) => file.path)).toEqual([recipeTarget, receipt]);
    expect(plan.notes.join(" ")).toContain("Compatibility is NOT checked");
    expect(plan.installCommands).toEqual(["npm install @kind-ui/charts@0.0.0"]);
    await applyPlan(plan);
    const provenance = JSON.parse(await readFile(join(root, receipt), "utf8"));
    expect(provenance.recipe).toBe("charts/line");
    expect(provenance.runtime).toEqual({
      package: "@kind-ui/charts",
      version: "0.0.0",
      react: "^19.0.0",
    });
    expect(provenance.files[0].sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(await readFile(join(root, "package.json"), "utf8")).toBe(
      '{"private":true,"type":"module"}\n',
    );
    const repeat = await createPlan(root, { command: "add", recipe: "charts/line" });
    expect(repeat.files.every((file) => file.action === "unchanged")).toBe(true);
    await applyPlan(repeat);
    await expect(
      createPlan(root, { command: "add", recipe: "https://example.com/recipe" }),
    ).rejects.toThrow("Unknown recipe");
  });
  it("warns compatibility is unchecked without suggesting a React upgrade", async () => {
    const root = await project();
    const packageJson = '{"private":true,"dependencies":{"react":"^18.0.0"}}\n';
    await writeFile(join(root, "package.json"), packageJson);
    await init(root);
    const plan = await createPlan(root, { command: "add", recipe: "charts/line" });
    expect(plan.notes.join(" ")).toContain("review your current React version");
    expect(plan.installCommands.join(" ")).not.toContain("react@");
    await applyPlan(plan);
    expect(await readFile(join(root, "package.json"), "utf8")).toBe(packageJson);
  });
  it("preserves a tracked recipe after consumer edits", async () => {
    const root = await project();
    await init(root);
    await add(root);
    await writeFile(join(root, recipeTarget), "// My application composition\n");
    const repeat = await createPlan(root, { command: "add", recipe: "charts/line" });
    expect(repeat.files[0]?.action).toBe("preserve");
    await applyPlan(repeat);
    expect(await readFile(join(root, recipeTarget), "utf8")).toBe(
      "// My application composition\n",
    );
  });
  it("restores a missing recipe file without changing its receipt", async () => {
    const root = await project();
    await init(root);
    await add(root);
    const original = await readFile(join(root, receipt), "utf8");
    await rm(join(root, recipeTarget));
    await add(root);
    expect(await readFile(join(root, recipeTarget), "utf8")).toContain("LineChartDemo");
    expect(await readFile(join(root, receipt), "utf8")).toBe(original);
  });
  it("refuses unrelated existing files before writing a receipt", async () => {
    const root = await project();
    await init(root);
    await mkdir(join(root, "src/components/ui/charts"), { recursive: true });
    await writeFile(join(root, recipeTarget), "valuable source");
    await expect(add(root)).rejects.toThrow("Refusing to overwrite");
    expect(await readFile(join(root, recipeTarget), "utf8")).toBe("valuable source");
    await expect(readFile(join(root, receipt), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("does not apply a stale plan or a modified plan object", async () => {
    const root = await project();
    const plan = await createPlan(root, { command: "init" });
    const original = plan.files[0];
    if (!original) throw new Error("Init must plan one config file");
    const tampered = { ...plan, files: [{ ...original, content: "bad" }] };
    await expect(applyPlan(tampered)).rejects.toThrow("Project changed");
    await writeFile(
      join(root, configFilename),
      '{"schemaVersion":1,"framework":"react","recipesDir":"components"}',
    );
    await expect(applyPlan(plan)).rejects.toThrow("Project changed");
  });
  it("preserves custom config and supports a safe custom recipe directory", async () => {
    const root = await project();
    const custom = '{"schemaVersion":1,"framework":"react","recipesDir":"app/components"}\n';
    await writeFile(join(root, configFilename), custom);
    await init(root);
    await add(root);
    expect(await readFile(join(root, configFilename), "utf8")).toBe(custom);
    expect(
      await readFile(join(root, "app/components/charts/line-chart-demo.tsx"), "utf8"),
    ).toContain("@kind-ui/charts");
  });
  it("refuses a changed receipt or relocation rather than pretending to upgrade", async () => {
    const root = await project();
    await init(root);
    await add(root);
    await writeFile(
      join(root, configFilename),
      '{"schemaVersion":1,"framework":"react","recipesDir":"other"}',
    );
    await expect(add(root)).rejects.toThrow("automatic upgrades are not supported");
  });
});

describe("filesystem safety", () => {
  it.each([
    "../out",
    "/tmp/out",
    "x/../../out",
    "x//y",
    "./x",
    "C:/out",
    "x\\y",
    "x/",
    "",
    "x/\0bad",
    ".git",
    "a/~b",
    "src/CON",
    "src/nul.tsx",
    "src/file.",
  ])("rejects unsafe path %j", (path) => {
    expect(() => validateRelativePath(path)).toThrow("Unsafe relative path");
  });
  it.each(["../outside", "/tmp", "node_modules/ui", "src/dist/ui"])(
    "rejects unsafe config path %s before creating files",
    async (recipesDir) => {
      const root = await project();
      await writeFile(
        join(root, configFilename),
        JSON.stringify({ schemaVersion: 1, framework: "react", recipesDir }),
      );
      await expect(add(root)).rejects.toThrow();
      expect((await readdir(root)).sort()).toEqual(["package.json", configFilename].sort());
    },
  );
  it.each(["src", "src/components", recipeTarget])("refuses a symlink at %s", async (part) => {
    const root = await project();
    const outside = await project();
    await init(root);
    const destination = join(root, part);
    const parent = part.split("/").slice(0, -1).join("/");
    if (parent) await mkdir(join(root, parent), { recursive: true });
    const target = part === recipeTarget ? join(outside, "outside.tsx") : outside;
    if (part === recipeTarget) await writeFile(target, "keep");
    await symlink(target, destination);
    await expect(add(root)).rejects.toThrow("Refusing symlink");
    expect((await readdir(outside)).sort()).toEqual(
      part === recipeTarget ? ["outside.tsx", "package.json"] : ["package.json"],
    );
  });
  it("refuses symlinked config and receipt files", async () => {
    const root = await project();
    const outside = await project();
    await writeFile(
      join(outside, "config.json"),
      '{"schemaVersion":1,"framework":"react","recipesDir":"src"}',
    );
    await symlink(join(outside, "config.json"), join(root, configFilename));
    await expect(init(root)).rejects.toThrow("Refusing symlink");
    await rm(join(root, configFilename));
    await init(root);
    await mkdir(join(root, "kind-ui/recipes"), { recursive: true });
    await symlink(join(outside, "config.json"), join(root, receipt));
    await expect(add(root)).rejects.toThrow("Refusing symlink");
  });
  it("rechecks symlink changes between planning and applying", async () => {
    const root = await project();
    const outside = await project();
    await init(root);
    const plan = await createPlan(root, { command: "add", recipe: "charts/line" });
    await symlink(outside, join(root, "src"));
    await expect(applyPlan(plan)).rejects.toThrow("Refusing symlink");
    expect(await readdir(outside)).toEqual(["package.json"]);
  });
  it("rejects unsupported config versions/frameworks and directory file targets", async () => {
    const root = await project();
    await writeFile(
      join(root, configFilename),
      '{"schemaVersion":2,"framework":"vue","recipesDir":"src"}',
    );
    await expect(init(root)).rejects.toThrow("Invalid kind-ui.json");
    await rm(join(root, configFilename));
    await mkdir(join(root, configFilename));
    await expect(init(root)).rejects.toThrow("Expected a regular file");
  });
});

describe("noninteractive command", () => {
  it("supports help, init/add dry runs, and repeated commands without installing", async () => {
    const root = await project();
    const run = (...args: string[]) =>
      execFileSync(process.execPath, [binary, ...args, "--cwd", root], { encoding: "utf8" });
    expect(execFileSync(process.execPath, [binary, "--help"], { encoding: "utf8" })).toContain(
      "Usage:",
    );
    expect(run("init", "--dry-run")).toContain("Dry run");
    expect(await readdir(root)).toEqual(["package.json"]);
    run("init");
    expect(run("add", "charts/line", "--dry-run")).toContain(`create: ${recipeTarget}`);
    await expect(readFile(join(root, recipeTarget))).rejects.toMatchObject({ code: "ENOENT" });
    run("add", "charts/line");
    expect(run("add", "charts/line")).toContain(`unchanged: ${recipeTarget}`);
    expect(await readdir(root)).not.toContain("node_modules");
  });
  it.each([
    ["wat"],
    ["init", "extra"],
    ["init", "--force"],
    ["init", "--cwd"],
    ["init", "--dry-run", "--dry-run"],
  ])("rejects invalid arguments %j", (...args) => {
    const result = spawnSync(process.execPath, [binary, ...args], { encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});
