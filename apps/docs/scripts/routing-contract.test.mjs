import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { canonicalDocSlugs, legacyDocSlugs, normalizeBasePath } from "../lib/routing.mjs";

test("old start links resolve to canonical pages without affecting other routes", () => {
  assert.deepEqual(legacyDocSlugs, [
    ["start", "installation"],
    ["start", "quickstart"],
    ["quickstart"],
    ["guides", "customization"],
    ["guides", "identity-layout"],
    ["concepts", "composition"],
    ["guides", "release"],
  ]);
  for (const page of ["installation", "quickstart"])
    assert.deepEqual(canonicalDocSlugs(["start", page]), ["installation"]);
  assert.deepEqual(canonicalDocSlugs(["components", "line"]), ["components", "line"]);
  assert.deepEqual(canonicalDocSlugs(["guides", "customization"]), ["components", "line"]);
  assert.deepEqual(canonicalDocSlugs(["guides", "identity-layout"]), ["concepts", "identity"]);
  assert.deepEqual(canonicalDocSlugs(["concepts", "composition"]), ["installation"]);
  assert.deepEqual(canonicalDocSlugs(["guides", "release"]), ["installation"]);
  assert.deepEqual(canonicalDocSlugs(["quickstart"]), ["installation"]);
  assert.equal(canonicalDocSlugs(null), null);
});

test("default and prefixed builds keep separate page and retrieval contracts", () => {
  for (const prefix of ["", "/charts/docs"]) {
    const result = JSON.parse(
      execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `
      import {docRoute, publicPath, docSlugs} from './lib/routing.mjs';
      console.log(JSON.stringify({
        page:docRoute('/docs/components/line/'),
        retrieval:publicPath('/markdown/components/line.md'),
        repeated:publicPath(publicPath('/docs/components/line/')),
        hash:docRoute('/docs/#setup'),
        external:publicPath('https://example.com/docs/'),
        slugs:docSlugs(${JSON.stringify(prefix ? ["components", "line"] : ["docs", "components", "line"])}),
      }));`,
        ],
        { env: { ...process.env, NEXT_PUBLIC_KIND_DOCS_BASE_PATH: prefix }, encoding: "utf8" },
      ),
    );
    assert.deepEqual(result, {
      page: prefix ? "/components/line/" : "/docs/components/line/",
      retrieval: `${prefix}/markdown/components/line.md`,
      repeated: `${prefix}${prefix ? "" : "/docs"}/components/line/`,
      hash: prefix ? "/#setup" : "/docs/#setup",
      external: "https://example.com/docs/",
      slugs: ["components", "line"],
    });
  }
});
test("prefix accepts plain path segments and rejects origins or ambiguous paths", () => {
  assert.equal(normalizeBasePath("/charts/docs/"), "/charts/docs");
  for (const value of ["https://kindui.dev", "//charts", "/charts/../docs", "/charts?docs", "/"]) {
    assert.throws(() => normalizeBasePath(value));
  }
});
