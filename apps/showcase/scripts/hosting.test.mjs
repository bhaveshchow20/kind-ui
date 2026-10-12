import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { domainRootRewrites } from "./domain-root.mjs";
import { prepareHostingAssets } from "./prepare-hosting.mjs";

/** @param {import("node:test").TestContext} t */
async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "kind-hosting-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const options = {
    docsExport: path.join(root, "docs"),
    registry: path.join(root, "registry"),
    publicDirectory: path.join(root, "public"),
  };
  await mkdir(path.join(options.docsExport, "components/line"), { recursive: true });
  await mkdir(options.registry);
  await mkdir(options.publicDirectory);
  const html =
    '<link rel="canonical" href="https://kindui.dev/charts/docs/"><script src="/charts/docs/_next/app.js"></script>';
  await writeFile(path.join(options.docsExport, "index.html"), html);
  await writeFile(path.join(options.docsExport, "components/line/index.html"), html);
  await writeFile(path.join(options.registry, "registry.json"), '{"items":[]}');
  await writeFile(path.join(options.registry, "line-chart.json"), '{"name":"line-chart"}');
  await writeFile(path.join(options.publicDirectory, "art.svg"), "art");
  return { ...options, html };
}

test("stage registry at the domain root alongside the production Docs mount", async (t) => {
  const f = await fixture(t);
  await prepareHostingAssets(f);
  assert.equal(
    await readFile(path.join(f.publicDirectory, "r/line-chart.json"), "utf8"),
    '{"name":"line-chart"}',
  );
  assert.equal(
    await readFile(path.join(f.publicDirectory, "charts/docs/components/line/index.html"), "utf8"),
    f.html,
  );
  const routes = domainRootRewrites(f.publicDirectory);
  assert.ok(
    routes.some(
      ({ source, destination }) =>
        source === "/charts/docs/components/line/" &&
        destination === "/charts/docs/components/line/index.html",
    ),
  );
  assert.ok(
    routes.some(
      ({ source, destination }) =>
        source === "/charts/docs" && destination === "/charts/docs/index.html",
    ),
  );
  assert.ok(
    routes.some(
      ({ source, destination }) => source === "/charts/art.svg" && destination === "/art.svg",
    ),
  );
  assert.ok(!routes.some(({ source }) => source.startsWith("/charts/r/")));
  await writeFile(path.join(f.publicDirectory, "r/stale.json"), "{}");
  await prepareHostingAssets(f);
  await assert.rejects(readFile(path.join(f.publicDirectory, "r/stale.json")), { code: "ENOENT" });
  assert.equal(await readFile(path.join(f.publicDirectory, "art.svg"), "utf8"), "art");
});

test("reject preview exports and nested registry output before staging", async (t) => {
  const f = await fixture(t);
  assert.throws(
    () => domainRootRewrites(f.publicDirectory),
    /Prepare the production Docs export and registry assets/,
  );
  await writeFile(
    path.join(f.docsExport, "index.html"),
    `${f.html}<meta name="robots" content="noindex">`,
  );
  await assert.rejects(prepareHostingAssets(f), /production-indexable/);
  await writeFile(path.join(f.docsExport, "index.html"), f.html);
  await mkdir(path.join(f.registry, "nested"));
  await assert.rejects(prepareHostingAssets(f), /only flat JSON endpoints/);
  await assert.rejects(readFile(path.join(f.publicDirectory, "r/registry.json")), {
    code: "ENOENT",
  });
});
