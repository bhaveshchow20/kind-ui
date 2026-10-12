import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { registryItems } from "../../../registry/catalog.mjs";
import { family } from "../examples/treemap-catalog.mjs";
import { installationFor, installationMarkdown } from "../lib/chart-installation.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";
import { assertPublicCandidateIdentity } from "./public-candidate-identity.mjs";
import { assertPublicCopy } from "./public-copy.mjs";

const docs = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, docs), "utf8");
const checksum = createHash("sha256").update("reviewed Treemap test archive").digest("hex");
const sourceCommit = "a".repeat(40);
const provenance = { sha256: checksum, sourceCommit };
const archive = "vendor/kind-ui-charts-0.5.0.tgz";
const archiveInstruction = (digest = checksum) =>
  `Obtain the reviewed archive matching SHA-256 ${digest}, place it at ${archive}`;
function candidate(id = "treemap") {
  const example = family.examples.find((example) => example.id === id);
  const source = read(`examples/${id}/example.tsx`);
  return {
    id,
    family: "treemap",
    title: example.title,
    version: "0.5.0",
    packageStatus: "Treemap candidate artifact",
    candidateSha256: checksum,
    files: {
      "package.json": JSON.stringify({ dependencies: { "@kind-ui/charts": `file:${archive}` } }),
      [`src/examples/${id}/example.tsx`]: source,
    },
    ...(id === "treemap"
      ? {
          defaultVariant: "return",
          variants: {
            return: { label: "Signed return", source },
            activity: {
              label: "Activity",
              source: source.replace('metric = "return"', 'metric = "activity"'),
            },
            loading: {
              label: "Loading",
              source: source.replace("loading = false", "loading = true"),
            },
          },
        }
      : {}),
  };
}
function publicIdentity(body, file) {
  assertPublicCopy(body, file);
  assertPublicCandidateIdentity(body, file, provenance);
}

test("Treemap pending installation cannot expose a CLI through accidental registry metadata", () => {
  for (const example of family.examples) {
    const bundle = candidate(example.id);
    for (const registryItemName of [undefined, "treemap-chart"]) {
      const input = { ...bundle, ...(registryItemName ? { registryItemName } : {}) };
      const result = installationFor(input);
      assert.equal(result.available, false);
      assert.equal(result.command, "");
      assert.deepEqual(result.steps, []);
      assert.match(result.message, /Published @kind-ui\/charts@0\.5\.0 does not export it/);
      assert.match(result.message, /after publication and a matching registry update/);
      const markdown = installationMarkdown(input);
      assertPublicCopy(markdown, `${example.id} pending install`);
      assert.doesNotMatch(markdown, /### CLI|npx shadcn|npm install @kind-ui\/charts/);
    }
  }
  assert.equal(
    registryItems.some(
      (item) => item.exampleId === "treemap" || item.exampleId.startsWith("treemap-"),
    ),
    false,
  );
});

test("Treemap installation requires a later stable registry version without candidate identity", () => {
  const plain = {
    id: "treemap",
    family: "treemap",
    files: candidate().files,
    registryItemName: "treemap-chart",
  };
  for (const version of ["0.4.0", "0.5.0", "0.6.0-beta.1"]) {
    assert.equal(installationFor({ ...plain, version }).available, false);
  }
  assert.equal(
    installationFor({ ...plain, version: "0.6.0", candidateSha256: checksum }).available,
    false,
  );
  assert.equal(
    installationFor({ ...plain, version: "0.6.0", packageStatus: "Treemap candidate artifact" })
      .available,
    false,
  );
  const published = installationFor({
    ...plain,
    version: "0.6.0",
    packageStatus: "@kind-ui/charts",
  });
  assert.equal(published.available, true);
  assert.equal(published.command, "npx shadcn@latest add @kind-ui/treemap-chart");
  assert.throws(
    () => installationFor({ id: "unknown", version: "0.6.0", files: {} }),
    /No registry installation/,
  );
});

test("Treemap copied prompts identify the reviewed archive and preserve selected source and deployed links", () => {
  for (const example of family.examples) {
    const bundle = candidate(example.id);
    const before = JSON.stringify(bundle);
    for (const variant of [undefined, ...Object.keys(bundle.variants ?? {})]) {
      const prompt = promptFor(bundle, {}, variant);
      assertPublicCopy(prompt, `${example.id}:${variant} prompt`);
      assert.ok(prompt.includes(`checksum (SHA-256) ${checksum}`));
      assert.ok(prompt.includes("Published @kind-ui/charts@0.5.0 does not contain Treemap"));
      assert.ok(prompt.includes(`place the matching archive at ${archive} before npm install`));
      assert.ok(prompt.includes("Public registry installation is awaiting the feature release"));
      assert.doesNotMatch(
        prompt,
        /Reference package: @kind-ui\/charts@0\.5\.0|Install @kind-ui\/charts and its|npx shadcn/,
      );
      assert.ok(prompt.includes(`Selected example: ${example.id}`));
      const selected = variant ?? bundle.defaultVariant;
      const expectedURL = selected
        ? `/examples/${example.id}/variants/${selected}/example.tsx`
        : `/examples/${example.id}/src/examples/${example.id}/example.tsx`;
      assert.ok(prompt.includes(`https://kindui.dev/charts/docs${expectedURL}`));
      const links = [...prompt.matchAll(/https?:\/\/[^\s]+/g)].map(
        ([url]) => new URL(url.replace(/\.$/, "")),
      );
      assert.equal(links.length, 5);
      for (const link of links) {
        assert.equal(link.origin, "https://kindui.dev");
        assert.ok(link.pathname.startsWith("/charts/docs/"));
      }
      const selectedFiles = filesFor(bundle, {}, variant);
      const manifest = JSON.parse(selectedFiles["package.json"]);
      assert.equal(manifest.dependencies["@kind-ui/charts"], `file:${archive}`);
      const selectedSource = selectedFiles[`src/examples/${example.id}/example.tsx`];
      assert.equal(
        selectedSource,
        selected
          ? bundle.variants[selected].source
          : bundle.files[`src/examples/${example.id}/example.tsx`],
      );
      if (variant === "loading") {
        assert.match(selectedSource, /loading = true/);
        assert.match(selectedSource, /metric = "return"/);
      }
    }
    assert.equal(JSON.stringify(bundle), before);
  }
});

test("Treemap checksum exception permits only exact trusted identity fields and archive instructions", () => {
  for (const example of family.examples) {
    publicIdentity(
      `# ${example.title} — candidate consumer\n${archiveInstruction()}, then install dependencies.`,
      `examples/${example.id}/README.md`,
    );
  }
  publicIdentity(archiveInstruction(), "markdown/components/treemap.md");
  const payload = JSON.stringify({
    candidateSha256: checksum,
    files: { "README.md": archiveInstruction() },
  });
  publicIdentity(
    `<script>self.__next_f.push([1,${JSON.stringify(payload)}])</script>`,
    "docs/components/treemap/index.html",
  );
  publicIdentity(payload, "components/treemap/index.html");
  for (const path of [
    "docs/components/treemap/__next.$c$slug.__PAGE__.txt",
    "docs/components/treemap/__next._full.txt",
    "docs/components/treemap/index.txt",
    "components/treemap/__next.$c$slug.__PAGE__.txt",
  ]) {
    publicIdentity(`1:${JSON.stringify(payload)}`, path);
    assert.throws(
      () => publicIdentity(`${payload}\nSource revision: ${sourceCommit}`, path),
      /Internal source/,
    );
    assert.throws(
      () => publicIdentity(payload.replaceAll(checksum, "b".repeat(64)), path),
      /differs from trusted/,
    );
  }
  for (const path of [
    "docs/components/line/__next.$c$slug.__PAGE__.txt",
    "docs/components/treemap/arbitrary.txt",
    "docs/components/treemap/__next._tree.txt",
  ]) {
    assert.throws(() => publicIdentity(payload, path), /location is not allowed/);
  }
  assert.throws(
    () => publicIdentity(`Receipt: ${checksum}`, "examples/treemap/README.md"),
    /Internal checksum/,
  );
  assert.throws(
    () => publicIdentity(archiveInstruction(), "examples/line/README.md"),
    /location is not allowed/,
  );
  assert.throws(
    () => publicIdentity(payload, "examples/treemap/README.md"),
    /location is not allowed/,
  );
  assert.throws(
    () => publicIdentity(payload, "docs/components/line/index.html"),
    /location is not allowed/,
  );
  assert.throws(
    () => publicIdentity(archiveInstruction("b".repeat(64)), "examples/treemap/README.md"),
    /differs from trusted/,
  );
  assert.throws(
    () => publicIdentity('{"candidateSha256":"undefined"}', "components/treemap/index.html"),
    /Malformed candidate/,
  );
  assert.throws(
    () => publicIdentity(`${payload}\nOther receipt: ${checksum}`, "components/treemap/index.html"),
    /Internal checksum/,
  );
  assert.throws(
    () =>
      publicIdentity(
        `${archiveInstruction()}\nSource revision: ${sourceCommit}`,
        "examples/treemap/README.md",
      ),
    /Internal source/,
  );
  for (const forbidden of [
    "/package-provenance.json",
    "/examples/package/kind-ui-charts-0.5.0.tgz",
    "release candidate",
    "unpublished",
    "pre-release",
  ]) {
    assert.throws(
      () => publicIdentity(`${archiveInstruction()}\n${forbidden}`, "examples/treemap/README.md"),
      /Stale public copy/,
    );
  }
});

test("Treemap generated manifests and prompts match exact validated archive bytes without publishing the archive", () => {
  const bundles = JSON.parse(read("generated/treemap-examples.json"));
  const receipt = JSON.parse(read("vendor/provenance.json"));
  const digest = createHash("sha256")
    .update(readFileSync(new URL(archive, docs)))
    .digest("hex");
  assert.equal(digest, receipt.sha256);
  for (const [id, bundle] of Object.entries(bundles)) {
    assert.equal(bundle.version, receipt.version);
    assert.equal(bundle.candidateSha256, digest);
    assert.equal(bundle.registryItemName, undefined);
    assert.equal(
      JSON.parse(bundle.files["package.json"]).dependencies["@kind-ui/charts"],
      `file:${archive}`,
    );
    assert.ok(bundle.files["README.md"].includes(archiveInstruction(digest)));
    assertPublicCopy(bundle.files["README.md"], `${id} candidate README`);
    assertPublicCandidateIdentity(bundle.files["README.md"], `examples/${id}/README.md`, receipt);
    for (const variant of [undefined, ...Object.keys(bundle.variants ?? {})]) {
      assert.ok(promptFor(bundle, {}, variant).includes(`checksum (SHA-256) ${digest}`));
    }
    assert.ok(
      !Object.keys(bundle.files).some((file) => /\.tgz$|package-provenance\.json/.test(file)),
    );
  }
});
