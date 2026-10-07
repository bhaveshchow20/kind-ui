import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { isIndexable } from "../apps/indexing.mjs";

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w-]+)=["']([^"']*)["']/g)].map(([, key, value]) => [key, value]),
  );
}
export function assertIndexingHTML(html, canonical, env = process.env) {
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)].map(([tag]) => attributes(tag));
  assert.deepEqual(
    tags.filter((tag) => tag.rel === "canonical").map((tag) => tag.href),
    [canonical],
  );
  const robots = tags.filter((tag) => tag.name === "robots").map((tag) => tag.content);
  assert.equal(robots.length, 1, "Expected one robots meta tag");
  assert.deepEqual(
    robots[0].split(/,\s*/),
    isIndexable(env) ? ["index", "follow"] : ["noindex", "nofollow"],
  );
}
export function assertIndexingRoutes(robots, sitemap, expectedURLs, env = process.env) {
  if (isIndexable(env)) {
    assert.match(robots, /Allow: \/(?:\r?\n|$)/);
    assert.doesNotMatch(robots, /Disallow: \/(?:\r?\n|$)/);
    for (const url of [
      "https://kindui.dev/charts/sitemap.xml",
      "https://kindui.dev/charts/docs/sitemap.xml",
    ])
      assert.ok(robots.includes(`Sitemap: ${url}`));
  } else {
    assert.match(robots, /Disallow: \/(?:\r?\n|$)/);
    assert.doesNotMatch(robots, /Sitemap:/);
  }
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert.deepEqual(urls.sort(), isIndexable(env) ? [...new Set(expectedURLs)].sort() : []);
}

/** Next metadata routes can create RSC directories with text-looking names. */
export function textExportFiles(root) {
  return readdirSync(root, { recursive: true }).filter(
    (name) =>
      /\.(?:html|md|txt|json)$/.test(String(name)) && statSync(path.join(root, name)).isFile(),
  );
}
