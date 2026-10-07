import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  assertIndexingHTML,
  assertIndexingRoutes,
  textExportFiles,
} from "../../../scripts/indexing-output.mjs";
import { canonicalDocURL } from "../../indexing.mjs";
import { basePath, canonicalDocSlugs, legacyDocSlugs, publicPath } from "../lib/routing.mjs";
import { assertPublicCopy } from "./public-copy.mjs";

const routePrefix = basePath ? "" : "docs/";

import { allExamples, families } from "../examples/catalog.mjs";

const provenance = JSON.parse(readFileSync("vendor/provenance.json", "utf8"));

const familyIds = families.map(({ id }) => id);

const root = path.resolve("out");
const html = readdirSync(root, { recursive: true }).filter(
  (file) => String(file).endsWith(".html") && !String(file).startsWith("examples/"),
);
const canonicalURLs = [];
for (const file of html) {
  const route = String(file)
    .replace(/(?:^|\/)index\.html$/, "")
    .replace(/\/$/, "");
  if (route !== "" && !route.startsWith(routePrefix || "components/") && !basePath) continue;
  if (/(?:^|\/)(?:404|_not-found)(?:\.html|$)/.test(route)) continue;
  const slugs = route
    .replace(/^docs\/?/, "")
    .split("/")
    .filter(Boolean);
  const canonical = canonicalDocURL(canonicalDocSlugs(slugs));
  assertIndexingHTML(readFileSync(path.join(root, file), "utf8"), canonical);
  if (!legacyDocSlugs.some((alias) => alias.join("/") === slugs.join("/")))
    canonicalURLs.push(canonical);
}
assertIndexingRoutes(
  readFileSync(path.join(root, "robots.txt"), "utf8"),
  readFileSync(path.join(root, "sitemap.xml"), "utf8"),
  canonicalURLs,
);
const componentRoutes = html.filter((file) => String(file).startsWith(`${routePrefix}components/`));
assert.deepEqual(
  componentRoutes.sort(),
  familyIds.map((id) => `${routePrefix}components/${id}/index.html`).sort(),
);
assert.deepEqual(
  readdirSync(path.join(root, "markdown/components")).sort(),
  familyIds.map((id) => `${id}.md`).sort(),
);
assert.deepEqual(
  readdirSync(path.join(root, "examples")).sort(),
  allExamples.map(({ id }) => id).sort(),
);
assert.equal(
  existsSync(path.join(root, "package-provenance.json")),
  false,
  "Internal package provenance must not be exported",
);
assert.equal(
  existsSync(path.join(root, "examples/package")),
  false,
  "Validation archives must not be exported",
);
for (const file of textExportFiles(root)) {
  const body = readFileSync(path.join(root, file), "utf8");
  assertPublicCopy(body, file);
  for (const receipt of [provenance.sourceCommit, provenance.sha256])
    assert.ok(!body.includes(receipt), `Internal receipt exposed in ${file}`);
}
const search = JSON.parse(readFileSync(path.join(root, "api/search"), "utf8"));
const searchIds = search.internalDocumentIDStore.internalIdToId;
for (const slug of legacyDocSlugs) {
  assert.ok(searchIds.includes(publicPath(`/docs/${slug[1]}`)), `Search omits ${slug[1]}`);
  assert.ok(
    !searchIds.some((id) => id.startsWith(publicPath(`/docs/${slug.join("/")}`))),
    "Search indexes a legacy alias",
  );
}
for (const id of searchIds.filter((id) => id.startsWith(publicPath("/docs/components/"))))
  assert.ok(
    familyIds.some(
      (family) =>
        id === publicPath(`/docs/components/${family}`) ||
        new RegExp(`^${publicPath(`/docs/components/${family}`)}-\\d+$`).test(id),
    ),
    `Search exposes ${id}`,
  );
const navigation = JSON.parse(readFileSync("content/docs/components/meta.json", "utf8"));
assert.deepEqual([...navigation.pages].sort(), [...familyIds].sort());
for (const id of familyIds) {
  assert.ok(
    searchIds.some((key) => key === publicPath(`/docs/components/${id}`)),
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
    if (basePath && !url.startsWith(`${basePath}/`))
      throw new Error(`${file}: internal URL escaped docs prefix: ${url}`);
    const target = path.join(root, basePath ? url.slice(basePath.length) : url);
    if (
      !existsSync(target) ||
      (statSync(target).isDirectory() && !existsSync(path.join(target, "index.html")))
    )
      missing.add(`${file}: ${url}`);
    links++;
  }
}
const index = readFileSync(path.join(root, "llms.txt"), "utf8");
for (const file of ["llms.txt", "llms-full.txt", "AGENTS.md"])
  assert.equal(
    readFileSync(path.join(root, file), "utf8"),
    readFileSync(path.join("public", file), "utf8"),
    `Stale exported agent asset: ${file}`,
  );
const fullIndex = readFileSync(path.join(root, "llms-full.txt"), "utf8");
const markdownFiles = (directory) =>
  readdirSync(directory, { recursive: true })
    .filter((name) => String(name).endsWith(".md"))
    .sort();
assert.deepEqual(
  markdownFiles(path.join(root, "markdown")),
  markdownFiles("public/markdown"),
  "Exported canonical Markdown pages differ from generated pages",
);
for (const file of markdownFiles("public/markdown")) {
  const body = readFileSync(path.join(root, "markdown", file), "utf8");
  assert.equal(
    body,
    readFileSync(path.join("public/markdown", file), "utf8"),
    `Stale Markdown: ${file}`,
  );
  const alias = legacyDocSlugs.find((slug) => file === `${slug.join("/")}.md`);
  if (alias) {
    assert.equal(body, readFileSync(path.join(root, "markdown", `${alias[1]}.md`), "utf8"));
    assert.ok(
      !index.includes(publicPath(`/markdown/${file}`)),
      `Agent index duplicates alias ${file}`,
    );
  } else assert.ok(index.includes(publicPath(`/markdown/${file}`)), `Agent index omits ${file}`);
  assert.ok(fullIndex.includes(body.trimEnd()), `Full agent index omits canonical ${file}`);
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
