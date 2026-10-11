import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
assert(
  args.length === 0 || (args.length === 2 && args[0] === "--source-root"),
  "Usage: node .agents/skills/verify-upstream.mjs [--source-root <extracted-repositories>]",
);
const sourceRoot = args.length ? resolve(args[1]) : null;
const lock = JSON.parse(readFileSync(join(root, "upstream-lock.json"), "utf8"));
const selected = [
  "composition-patterns",
  "react-best-practices",
  "codebase-design",
  "accessibility",
  "emil-design-eng",
  "review-animations",
  "web-design-guidelines",
  "shadcn",
];
assert.equal(lock.schemaVersion, 1);
assert.deepEqual(lock.distributions.map(({ skill }) => skill).sort(), selected.sort());
const recorded = new Set();
function verify(file, repository, revision) {
  assert.match(revision, /^[a-f0-9]{40}$/);
  assert.match(file.sha256, /^[a-f0-9]{64}$/);
  for (const path of [file.path, file.sourcePath]) {
    assert(
      path && !path.startsWith("/") && !path.split("/").includes(".."),
      `Unsafe path: ${path}`,
    );
  }
  assert(!recorded.has(file.path), `Duplicate file: ${file.path}`);
  recorded.add(file.path);
  const bytes = readFileSync(join(root, file.path));
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    file.sha256,
    `Changed: ${file.path}`,
  );
  if (sourceRoot) {
    const source = readFileSync(
      join(sourceRoot, repository.replaceAll("/", "__"), file.sourcePath),
    );
    assert(bytes.equals(source), `Upstream byte mismatch: ${file.path}`);
  }
}
function walk(directory, base = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `Unexpected symlink: ${path}`);
    return entry.isDirectory() ? walk(path, base) : [relative(base, path)];
  });
}
const names = new Set();
for (const distribution of lock.distributions) {
  for (const file of [...distribution.files, ...distribution.notices]) {
    verify(file, distribution.repository, distribution.revision);
  }
  const text = readFileSync(join(root, distribution.skill, "SKILL.md"), "utf8");
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert(frontmatter, `Missing frontmatter: ${distribution.skill}`);
  const metadata = parse(frontmatter[1]);
  assert(typeof metadata.name === "string" && typeof metadata.description === "string");
  assert(!names.has(metadata.name), `Duplicate discovery name: ${metadata.name}`);
  names.add(metadata.name);
  if (sourceRoot) {
    const directory = join(
      sourceRoot,
      distribution.repository.replaceAll("/", "__"),
      distribution.sourceDirectory,
    );
    const sourceFiles = walk(directory, directory).sort();
    const installedFiles = distribution.files
      .map(({ path }) => relative(distribution.skill, path))
      .sort();
    assert.deepEqual(installedFiles, sourceFiles, `Incomplete distribution: ${distribution.skill}`);
  }
}
for (const file of lock.supplementalFiles) verify(file, file.repository, file.revision);
for (const distribution of lock.distributions) {
  assert.deepEqual(
    walk(join(root, distribution.skill)).sort(),
    [...recorded].filter((path) => path.startsWith(`${distribution.skill}/`)).sort(),
    `Unrecorded files: ${distribution.skill}`,
  );
}
const missingLinks = [];
for (const path of recorded) {
  if (!path.endsWith(".md")) continue;
  const text = readFileSync(join(root, path), "utf8");
  for (const match of text.matchAll(/\[[^\]\n]*\]\(([^\s)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^[a-z]+:|^\//i.test(target)) continue;
    if (!existsSync(resolve(root, dirname(path), target))) {
      missingLinks.push({ file: path, target });
    }
  }
}
const sortLinks = (links) => links.map((link) => `${link.file}: ${link.target}`).sort();
assert.deepEqual(
  sortLinks(missingLinks),
  sortLinks(lock.knownMissingLinks),
  "Missing relative links differ from documented upstream limitations",
);
console.log(
  `Verified ${lock.distributions.length} skills and ${recorded.size} pinned files${sourceRoot ? " byte-for-byte against upstream" : " by SHA-256"}.`,
);
