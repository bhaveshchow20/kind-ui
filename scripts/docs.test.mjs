import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { registryItems } from "../registry/catalog.mjs";

const docs = new URL("../apps/docs/", import.meta.url);
const content = new URL("content/docs/", docs);
const read = (url) => readFileSync(url, "utf8");
const pages = readdirSync(content, { recursive: true }).filter((file) => file.endsWith(".mdx"));
const charts = readdirSync(new URL("charts/", content))
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => file.slice(0, -".mdx".length));

for (const chart of charts) {
  test(`${chart} has a chart page with every section`, () => {
    const source = read(new URL(`charts/${chart}.mdx`, content));
    assert.match(source, /^---\ntitle: .+\ndescription: .+\n---\n/);
    assert.match(source, /<Example caption=".+">/);
    assert.ok(source.includes("\n## Installation\n"));
    if (registryItems.some(({ name }) => name === `${chart}-chart`))
      assert.ok(source.includes(`npx shadcn@latest add @kind-ui/${chart}-chart\n`));
    assert.ok(source.includes("\n## Composition\n"));
    assert.ok(source.includes("\n## Usage\n"));
    assert.match(source, /\n## API Reference\n\n(### .+\n\n)?<auto-type-table /);
  });
}

test("chart props tables are narrowed to the options Charts adds", () => {
  for (const chart of charts) {
    const source = read(new URL(`charts/${chart}.mdx`, content));
    for (const [table] of source.matchAll(/<auto-type-table [^>]*\/>/g)) {
      if (table.includes("ChartProps"))
        assert.ok(table.includes("type='Pick<"), `${chart}: ${table}`);
    }
  }
});

test("the sidebar lists every page, and every listed page exists", () => {
  const listed = new Set();
  for (const file of readdirSync(content, { recursive: true })) {
    if (!file.endsWith("meta.json")) continue;
    const folder = file.slice(0, -"meta.json".length);
    for (const entry of JSON.parse(read(new URL(file, content))).pages) {
      if (entry.startsWith("---")) continue;
      const path = entry.startsWith("...")
        ? `${folder}${entry.slice(3)}/`
        : `${folder}${entry}.mdx`;
      listed.add(path);
    }
  }
  const missing = [...listed].filter((path) => !existsSync(new URL(path, content)));
  assert.deepEqual(missing, []);
  for (const page of pages) {
    const folder = page.slice(0, page.lastIndexOf("/") + 1);
    assert.ok(listed.has(page) || listed.has(folder), `${page} is not in a meta.json`);
  }
});

test("pages import examples and link pages by relative path", () => {
  for (const page of pages) {
    const source = read(new URL(page, content));
    assert.doesNotMatch(source, /from "@\//, page);
    assert.doesNotMatch(source, /\]\(\/docs/, page);
  }
});

// Chart parts like `LineChart.XAxis` are properties of a client component, which a server component can't reach.
test("examples are client components importing only the package, React and sibling files", () => {
  const examples = new URL("examples/", docs);
  for (const file of readdirSync(examples, { recursive: true })) {
    if (!file.endsWith(".tsx")) continue;
    const source = read(new URL(file, examples));
    assert.match(source, /^(\/\/.*\n)*"use client";\n/, file);
    for (const [, specifier] of source.matchAll(/from "([^"]+)"/g))
      assert.match(
        specifier,
        /^(@kind-ui\/charts|react|\.\/[^/]+)$/,
        `${file} imports ${specifier}`,
      );
  }
});

test("every registry item ships an example its page shows", () => {
  for (const { name, source } of registryItems) {
    assert.match(source, /^apps\/docs\/examples\//, `${name}: ${source} is not a docs example`);
    const include = `<include cwd lang="tsx">./${source.slice("apps/docs/".length)}</include>`;
    assert.ok(
      pages.some((page) => read(new URL(page, content)).includes(include)),
      `${name}: no page includes ${source}`,
    );
  }
});
