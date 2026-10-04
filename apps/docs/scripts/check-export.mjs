import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { allExamples, families } from "../examples/catalog.mjs";

const familyIds = families.map(({ id }) => id);

const root = path.resolve("out");
const html = readdirSync(root, { recursive: true }).filter(
  (file) => String(file).endsWith(".html") && !String(file).startsWith("examples/"),
);
const componentRoutes = html.filter((file) => String(file).startsWith("docs/components/"));
assert.deepEqual(
  componentRoutes.sort(),
  familyIds.map((id) => `docs/components/${id}/index.html`).sort(),
);
assert.deepEqual(
  readdirSync(path.join(root, "markdown/components")).sort(),
  familyIds.map((id) => `${id}.md`).sort(),
);
assert.deepEqual(
  readdirSync(path.join(root, "examples")).sort(),
  [...allExamples.map(({ id }) => id), "package"].sort(),
);
const search = JSON.parse(readFileSync(path.join(root, "api/search"), "utf8"));
const searchIds = search.internalDocumentIDStore.internalIdToId;
for (const id of searchIds.filter((id) => id.startsWith("/docs/components/")))
  assert.ok(
    familyIds.some(
      (family) =>
        id === `/docs/components/${family}` ||
        new RegExp(`^/docs/components/${family}-\\d+$`).test(id),
    ),
    `Search exposes ${id}`,
  );
const navigation = JSON.parse(readFileSync("content/docs/components/meta.json", "utf8"));
assert.deepEqual([...navigation.pages].sort(), [...familyIds].sort());
for (const id of familyIds) {
  assert.ok(
    searchIds.some((key) => key === `/docs/components/${id}`),
    `Search omits ${id}`,
  );
  assert.ok(
    readFileSync(path.join(root, "llms.txt"), "utf8").includes(`/markdown/components/${id}.md`),
    `Agent index omits ${id}`,
  );
  assert.ok(
    readFileSync(path.join(root, "llms-full.txt"), "utf8").includes(
      readFileSync(path.join(root, `markdown/components/${id}.md`), "utf8"),
    ),
    `Full agent index omits ${id}`,
  );
}
const missing = new Set();
let links = 0;
for (const file of html) {
  const body = readFileSync(path.join(root, file), "utf8");
  for (const match of body.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const url = decodeURIComponent(match[1]);
    if (url.startsWith("//")) continue;
    const target = path.join(root, url);
    if (
      !existsSync(target) ||
      (statSync(target).isDirectory() && !existsSync(path.join(target, "index.html")))
    )
      missing.add(`${file}: ${url}`);
    links++;
  }
}
const index = readFileSync(path.join(root, "llms.txt"), "utf8");
const provenance = JSON.parse(readFileSync("vendor/provenance.json", "utf8"));
if (!index.includes(provenance.sourceCommit.slice(0, 7)))
  throw new Error("Agent index does not identify the approved package snapshot");
for (const file of readdirSync(path.join(root, "markdown"), { recursive: true }).filter((name) =>
  String(name).endsWith(".md"),
)) {
  const body = readFileSync(path.join(root, "markdown", file), "utf8");
  if (
    /<(?:ComponentPlayground|ChartExample|LineExample|AreaExample|PackageSource|ApiTable|Snapshot)\b/.test(
      body,
    )
  )
    throw new Error(`Unresolved MDX in ${file}`);
}
for (const file of ["llms.txt", "llms-full.txt"]) {
  const body = readFileSync(path.join(root, file), "utf8");
  for (const match of body.matchAll(/\/(?:docs|markdown)\/components\/([^/\s)#?]+)/g))
    assert.ok(
      familyIds.some((id) => match[1] === id || match[1] === `${id}.md`),
      `${file} exposes ${match[1]}`,
    );
}
if (missing.size) throw new Error([...missing].join("\n"));
console.log(
  `${html.length} exported HTML routes and ${links} local asset/page links passed; clean Markdown and synchronized agent index passed.`,
);
