import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const configFilename = "kind-ui.json";
const defaultConfig = {
  schemaVersion: 1,
  framework: "react",
  recipesDir: "src/components/ui",
} as const;

export type Request = { command: "init" } | { command: "add"; recipe: string };
export interface PlannedFile {
  path: string;
  action: "create" | "unchanged" | "preserve";
  content: string;
  existingHash: string | null;
}
export interface Plan {
  root: string;
  request: Request;
  files: readonly PlannedFile[];
  installCommands: readonly string[];
  notes: readonly string[];
}
interface Config {
  schemaVersion: 1;
  framework: "react";
  recipesDir: string;
}
interface Recipe {
  id: string;
  version: string;
  framework: "react";
  runtime: { package: string; version: string; react: string };
  file: { source: string; target: string; sha256: string };
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function fail(message: string): never {
  throw new Error(message);
}

// A portable relative path subset excludes traversal, Windows drives/streams, and shell-like paths.
export function validateRelativePath(path: string): void {
  if (
    !path ||
    isAbsolute(path) ||
    path.includes("\\") ||
    path
      .split("/")
      .some(
        (part) =>
          !/^[A-Za-z0-9_][A-Za-z0-9._-]*$/.test(part) ||
          part.endsWith(".") ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
      )
  ) {
    fail(`Unsafe relative path: ${JSON.stringify(path)}`);
  }
}

async function statIfPresent(path: string) {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function safePath(root: string, path: string): Promise<string> {
  validateRelativePath(path);
  // Recheck the root and every existing component; symlinks are refused, even when they point inside.
  if ((await realpath(root)) !== root)
    fail("Project root changed or became a symlink; rerun the command");
  let current = root;
  const parts = path.split("/");
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    const stat = await statIfPresent(current);
    if (stat?.isSymbolicLink()) fail(`Refusing symlink: ${path}`);
    if (stat && index < parts.length - 1 && !stat.isDirectory()) {
      fail(`Expected a directory in path: ${path}`);
    }
    if (stat && index === parts.length - 1 && !stat.isFile()) {
      fail(`Expected a regular file: ${path}`);
    }
  }
  const inside = relative(root, current);
  if (inside.startsWith(`..${sep}`) || isAbsolute(inside)) fail(`Path escapes project: ${path}`);
  return current;
}

async function readOptional(root: string, path: string): Promise<string | null> {
  const filename = await safePath(root, path);
  const stat = await statIfPresent(filename);
  if (!stat) return null;
  const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!(await handle.stat()).isFile()) fail(`Expected a regular file: ${path}`);
    return await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
}

function parseConfig(content: string): Config {
  const parsed: unknown = JSON.parse(content);
  if (
    !record(parsed) ||
    parsed.schemaVersion !== 1 ||
    parsed.framework !== "react" ||
    typeof parsed.recipesDir !== "string" ||
    Object.keys(parsed).some((key) => !["schemaVersion", "framework", "recipesDir"].includes(key))
  ) {
    fail(`Invalid ${configFilename}; expected schemaVersion 1, framework react, and recipesDir`);
  }
  validateRelativePath(parsed.recipesDir);
  if (
    parsed.recipesDir
      .split("/")
      .some((part) => ["node_modules", "dist"].includes(part.toLowerCase()))
  ) {
    fail("recipesDir must point to application source, outside node_modules and dist");
  }
  return parsed as unknown as Config;
}

async function recipeFor(id: string): Promise<Recipe> {
  const manifest: unknown = JSON.parse(
    await readFile(new URL("../recipes/manifest.json", import.meta.url), "utf8"),
  );
  if (!record(manifest) || manifest.schemaVersion !== 1 || !Array.isArray(manifest.recipes)) {
    fail("Invalid bundled recipe manifest");
  }
  const entry: unknown = manifest.recipes.find((item: unknown) => record(item) && item.id === id);
  if (!record(entry)) fail(`Unknown recipe: ${id}. Available recipe: charts/line`);
  if (
    entry.id !== "charts/line" ||
    entry.version !== "0.0.0" ||
    entry.framework !== "react" ||
    !record(entry.runtime) ||
    entry.runtime.package !== "@kind-ui/charts" ||
    entry.runtime.version !== "0.0.0" ||
    entry.runtime.react !== "^19.0.0" ||
    !record(entry.file) ||
    typeof entry.file.source !== "string" ||
    typeof entry.file.target !== "string" ||
    typeof entry.file.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(entry.file.sha256)
  ) {
    fail("Unsupported bundled recipe manifest entry");
  }
  validateRelativePath(entry.file.source);
  validateRelativePath(entry.file.target);
  return entry as unknown as Recipe;
}

function planned(path: string, content: string, existing: string | null): PlannedFile {
  return {
    path,
    content,
    action: existing === null ? "create" : "unchanged",
    existingHash: existing === null ? null : hash(existing),
  };
}

/** Read-only planning: no writes, installs, subprocesses, or network calls. */
export async function createPlan(directory: string, request: Request): Promise<Plan> {
  const root = await realpath(resolve(directory));
  const project = await readOptional(root, "package.json");
  if (project === null || !record(JSON.parse(project) as unknown)) {
    fail(
      "A project package.json is required (or use --cwd). React/TypeScript compatibility is not detected",
    );
  }
  const existingConfig = await readOptional(root, configFilename);
  if (request.command === "init") {
    if (existingConfig !== null) parseConfig(existingConfig);
    return {
      root,
      request,
      files: [planned(configFilename, existingConfig ?? json(defaultConfig), existingConfig)],
      installCommands: [],
      notes: [
        "This recipe requires React 19 + TypeScript; framework and dependency compatibility are not checked.",
        "No application files or dependencies are installed.",
      ],
    };
  }
  if (request.command !== "add") fail("Unsupported command");
  if (existingConfig === null) fail(`Missing ${configFilename}; run init first`);
  const config = parseConfig(existingConfig);
  const recipe = await recipeFor(request.recipe);
  const recipeRoot = await realpath(fileURLToPath(new URL("../recipes/", import.meta.url)));
  const content = await readOptional(recipeRoot, recipe.file.source);
  if (content === null || hash(content) !== recipe.file.sha256)
    fail("Bundled recipe integrity check failed");
  const target = `${config.recipesDir}/${recipe.file.target}`;
  const receiptPath = "kind-ui/recipes/charts-line.json";
  const receipt = json({
    schemaVersion: 1,
    recipe: recipe.id,
    version: recipe.version,
    runtime: recipe.runtime,
    files: [{ path: target, sha256: hash(content) }],
  });
  const existingReceipt = await readOptional(root, receiptPath);
  if (existingReceipt !== null && existingReceipt !== receipt) {
    fail(
      "Recipe receipt differs from this bundled version or configured path; automatic upgrades are not supported",
    );
  }
  const existing = await readOptional(root, target);
  if (existing !== null && existing !== content && existingReceipt === null) {
    fail(`Refusing to overwrite existing file: ${target}`);
  }
  const file = planned(target, content, existing);
  if (existing !== null && existing !== content) file.action = "preserve";
  return {
    root,
    request,
    files: [file, planned(receiptPath, receipt, existingReceipt)],
    installCommands: [`npm install ${recipe.runtime.package}@${recipe.runtime.version}`],
    notes: [
      "Copied compositions are yours to edit; the chart runtime stays an npm dependency.",
      `Requires an existing React ${recipe.runtime.react} + TypeScript application. Compatibility is NOT checked; review your current React version before installing.`,
      "Kind UI packages remain private and npm scope ownership is unverified. Install local tarballs for this scaffold; registry availability is not claimed.",
      "No dependencies are installed, package.json is unchanged, and existing edits are preserved.",
    ],
  };
}

/** Apply only a still-current plan; exclusive writes never replace existing files. */
export async function applyPlan(plan: Plan): Promise<void> {
  const fresh = await createPlan(plan.root, plan.request);
  if (JSON.stringify(fresh) !== JSON.stringify(plan)) {
    fail("Project changed after planning; rerun the command before applying");
  }
  for (const file of plan.files) {
    if (file.action !== "create") continue;
    await safePath(plan.root, file.path);
    const parts = file.path.split("/");
    let directory = plan.root;
    for (const part of parts.slice(0, -1)) {
      directory = join(directory, part);
      const stat = await statIfPresent(directory);
      if (stat && (!stat.isDirectory() || stat.isSymbolicLink()))
        fail(`Unsafe directory: ${directory}`);
      if (!stat) {
        await mkdir(directory);
      }
      if ((await realpath(directory)) !== directory)
        fail(`Directory became a symlink: ${directory}`);
    }
    const target = await safePath(plan.root, file.path);
    const handle = await open(
      target,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o644,
    );
    try {
      await handle.writeFile(file.content, "utf8");
    } finally {
      await handle.close();
    }
  }
}
