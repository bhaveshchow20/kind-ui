import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = fileURLToPath(new URL("../", import.meta.url));
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const name = path.join(dir, entry.name);
        return entry.isDirectory() ? files(name) : [name];
      }),
    )
  ).flat();
}

test("skill discovery frontmatter retains a focused consumer trigger", async () => {
  const text = await readFile(path.join(root, "SKILL.md"), "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(frontmatter, "frontmatter delimiters");
  const metadata = parse(frontmatter[1]);
  assert.deepEqual(Object.keys(metadata).sort(), ["description", "name"]);
  assert.equal(metadata.name, "kind-ui-charts");
  assert.match(metadata.description, /@kind-ui\/charts/);
});

test("every relative Markdown reference resolves within the installable skill", async () => {
  for (const file of await files(root)) {
    if (!file.endsWith(".md")) continue;
    const text = await readFile(file, "utf8");
    for (const [, link] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(link)) continue;
      const target = path.resolve(path.dirname(file), link.split("#")[0]);
      assert.ok(target.startsWith(root), `outside skill: ${link}`);
      assert.ok((await stat(target)).isFile(), `missing ${link} in ${file}`);
    }
  }
});

test("consumer rules avoid removed routes and invented material tokens", async () => {
  for (const file of await files(root)) {
    if (!/\.(md|tsx)$/.test(file)) continue;
    const text = await readFile(file, "utf8");
    assert.ok(!text.includes("guides/customization"), file);
    assert.ok(!/material=["'](?:paper|plain)["']/.test(text), file);
    assert.ok(!/from ["'][^"']*packages\/charts/.test(text), file);
  }
});

test("evaluation requests include cross-family and non-trigger tasks", async () => {
  const data = JSON.parse(await readFile(path.join(root, "evals/requests.json"), "utf8"));
  assert.equal(data.skill_name, "kind-ui-charts");
  assert.equal(new Set(data.evals.map((entry) => entry.id)).size, data.evals.length);
  assert.ok(data.evals.some((entry) => entry.prompt.includes("Sankey")));
  assert.ok(data.evals.some((entry) => entry.prompt.includes("matrix")));
  assert.ok(data.evals.filter((entry) => entry.should_trigger === false).length >= 2);
});
