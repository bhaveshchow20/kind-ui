import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalDocURL,
  docsURL,
  indexingMetadata,
  isIndexable,
  robotsPolicy,
  showcaseURL,
  sitemapEntries,
} from "../apps/indexing.mjs";

const production = { KIND_UI_DEPLOYMENT_ENV: "production" };
test("only an explicitly production deployment is indexable, not every next build", () => {
  for (const env of [
    {},
    { NODE_ENV: "production" },
    { KIND_UI_DEPLOYMENT_ENV: "preview" },
    { VERCEL_ENV: "preview" },
    { KIND_UI_DEPLOYMENT_ENV: "production", VERCEL_ENV: "preview" },
    { KIND_UI_DEPLOYMENT_ENV: "development" },
  ]) {
    assert.equal(isIndexable(env), false);
    assert.deepEqual(indexingMetadata(env).robots, { index: false, follow: false });
    assert.deepEqual(robotsPolicy(env), { rules: { userAgent: "*", disallow: "/" } });
    assert.deepEqual(sitemapEntries([showcaseURL, docsURL], env), []);
  }
  for (const env of [production, { VERCEL_ENV: "production" }]) {
    assert.equal(isIndexable(env), true);
    assert.deepEqual(indexingMetadata(env).robots, { index: true, follow: true });
    assert.equal(indexingMetadata(env).metadataBase.href, "https://kindui.dev/");
    assert.deepEqual(robotsPolicy(env), {
      rules: { userAgent: "*", allow: "/" },
      sitemap: [
        "https://kindui.dev/charts/sitemap.xml",
        "https://kindui.dev/charts/docs/sitemap.xml",
      ],
    });
  }
  assert.throws(() => isIndexable({ KIND_UI_DEPLOYMENT_ENV: "prod" }), /must be/);
});
test("canonical docs and sitemap use the public mount exactly once and exclude duplicate aliases", () => {
  assert.equal(canonicalDocURL(), docsURL);
  assert.equal(
    canonicalDocURL(["components", "line"]),
    "https://kindui.dev/charts/docs/components/line/",
  );
  assert.equal(
    canonicalDocURL(["guides", "identity layout"]),
    "https://kindui.dev/charts/docs/guides/identity%20layout/",
  );
  assert.deepEqual(
    sitemapEntries([docsURL, canonicalDocURL(["installation"]), docsURL], production),
    [{ url: docsURL }, { url: "https://kindui.dev/charts/docs/installation/" }],
  );
});

import {
  assertIndexingHTML,
  assertIndexingRoutes,
  assertPageSEO,
  textExportFiles,
} from "./indexing-output.mjs";

test("emitted HTML assertions reject missing, duplicate or contradictory directives", () => {
  const html = `<link href="${showcaseURL}" rel="canonical"/><meta content="index, follow" name="robots"/>`;
  assertIndexingHTML(html, showcaseURL, production);
  assertIndexingHTML(html.replace("index, follow", "noindex, nofollow"), showcaseURL, {});
  assert.throws(() => assertIndexingHTML(html, docsURL, production));
  assert.throws(() =>
    assertIndexingHTML(`${html}<meta name="robots" content="noindex"/>`, showcaseURL, production),
  );
  assert.throws(() => assertIndexingHTML(html, showcaseURL, {}));
  assert.throws(() => assertIndexingHTML("", showcaseURL, production));
});
test("emitted routes assert public sitemap membership and protected previews", () => {
  const robots =
    "User-Agent: *\nAllow: /\nSitemap: https://kindui.dev/charts/sitemap.xml\nSitemap: https://kindui.dev/charts/docs/sitemap.xml\n";
  const sitemap = `<urlset><url><loc>${showcaseURL}</loc></url></urlset>`;
  assertIndexingRoutes(robots, sitemap, [showcaseURL], production);
  assertIndexingRoutes("User-Agent: *\nDisallow: /\n", "<urlset/>", [showcaseURL], {});
  assert.throws(() => assertIndexingRoutes(robots, sitemap, [docsURL], production));
  assert.throws(() => assertIndexingRoutes(robots, sitemap, [showcaseURL], {}));
});

test("page metadata checks reject inherited summaries and mismatched social URLs", () => {
  const title = "Line Chart · Kind UI charts";
  const description = "Build a chart for your team's trends.";
  const url = "https://kindui.dev/charts/docs/components/line/";
  const alt =
    "Kind UI Charts documentation: A line chart and composable React code example over dark clouds";
  const html = `<title>${title}</title><meta name="description" content="${description}"/>
    <meta property="og:title" content="${title}"/><meta property="og:description" content="${description}"/>
    <meta property="og:url" content="${url}"/><meta property="og:image" content="https://kindui.dev/charts/docs/social/documentation-v1.png"/>
    <meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="${alt}"/>
    <meta name="twitter:image:alt" content="${alt}"/><meta name="twitter:title" content="${title}"/><meta name="twitter:description" content="${description}"/>
    <meta name="twitter:card" content="summary_large_image"/><meta name="twitter:image" content="https://kindui.dev/charts/docs/social/documentation-v1.png"/>`;
  assert.deepEqual(assertPageSEO(html, url), { title, description });
  assert.throws(() => assertPageSEO(html, showcaseURL));
  assert.throws(() => assertPageSEO(html.replace("summary_large_image", "summary"), url));
  assert.throws(() => assertPageSEO(html.replace("1200", "512"), url));
  assert.throws(() => assertPageSEO(html.replace("documentation-v1.png", "homepage-v1.png"), url));
  assert.throws(() => assertPageSEO(html.replace('name="description"', 'name="missing"'), url));
  assert.throws(() =>
    assertPageSEO(html.replace('property="og:description"', 'name="description"'), url),
  );
  assert.throws(() =>
    assertPageSEO(html.replace(`content="${title}"`, 'content="Generic title"'), url),
  );
});

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

test("text export scans preserve nested files without treating metadata route directories as files", () => {
  const root = mkdtempSync(path.join(tmpdir(), "kind-indexing-"));
  try {
    mkdirSync(path.join(root, "robots.txt"));
    writeFileSync(path.join(root, "robots.txt", "segment.txt"), "No internal receipts");
    writeFileSync(path.join(root, "index.html"), "Public HTML");
    writeFileSync(path.join(root, "sitemap.xml"), "<urlset/>");
    assert.deepEqual(textExportFiles(root).sort(), [
      "index.html",
      path.join("robots.txt", "segment.txt"),
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("both social images are distinct, deployable 1200 by 630 PNGs", () => {
  const paths = [
    "../apps/showcase/public/social/homepage-v1.png",
    "../apps/docs/public/social/documentation-v1.png",
  ];
  const files = paths.map((file) => readFileSync(new URL(file, import.meta.url)));
  for (const file of files) {
    assert.equal(file.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(file.readUInt32BE(16), 1200);
    assert.equal(file.readUInt32BE(20), 630);
    assert.ok(file.length < 1_000_000, "Keep share cards under 1 MB");
  }
  assert.notDeepEqual(files[0], files[1]);
});
