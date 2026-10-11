import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { before, test } from "node:test";
import {
  buildRegistry,
  registryCatalog,
  registryOutput,
  repositoryRoot,
  validateCatalog,
} from "./build-registry.mjs";
import { serveRegistry } from "./registry/server.mjs";

before(() => buildRegistry());

test("registry builds with root dependencies and no docs application", () => {
  const fixture = mkdtempSync(path.join(tmpdir(), "kind-independent-registry-"));
  try {
    for (const file of [
      "registry",
      "scripts/registry",
      "scripts/build-registry.mjs",
      "LICENSE",
      "packages/charts/package.json",
    ]) {
      const target = path.join(fixture, file);
      mkdirSync(path.dirname(target), { recursive: true });
      cpSync(path.join(repositoryRoot, file), target, { recursive: true });
    }
    writeFileSync(path.join(fixture, "package.json"), '{"private":true,"type":"module"}\n');
    symlinkSync(
      path.join(repositoryRoot, "node_modules"),
      path.join(fixture, "node_modules"),
      "dir",
    );
    execFileSync(process.execPath, [path.join(fixture, "scripts/build-registry.mjs")], {
      cwd: fixture,
      stdio: "pipe",
    });
    const output = path.join(fixture, "artifacts/registry/public/r");
    assert.equal(readdirSync(output).length, 66);
    const index = JSON.parse(readFileSync(path.join(output, "registry.json")));
    assert.equal(index.items.length, 14);
    assert.ok(
      index.items.every((item) => item.files.every((file) => !Object.hasOwn(file, "content"))),
    );
    for (const filename of readdirSync(output))
      assert.deepEqual(
        JSON.parse(readFileSync(path.join(output, filename))),
        JSON.parse(readFileSync(path.join(registryOutput, "public/r", filename))),
      );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("the shared namespace permits independent product dependencies and rejects collisions", () => {
  const index = registryCatalog();
  index.items.push({
    name: "sample-component",
    type: "registry:component",
    categories: ["sample"],
    dependencies: ["example-package@1.0.0"],
    files: [{ path: "registry/sample/component.tsx", type: "registry:component" }],
  });
  validateCatalog(index);
  index.items.push(index.items.at(-1));
  assert.throws(() => validateCatalog(index), /Duplicate registry item/);
  index.items.pop();
  index.items.at(-1).files[0].path = "apps/docs/example.tsx";
  assert.throws(() => validateCatalog(index));
});

test("root registry routes serve every item without the docs prefix", async () => {
  const server = createServer((request, response) => {
    if (!serveRegistry(request, response)) {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const file of readdirSync(path.join(registryOutput, "public/r"))) {
      const response = await fetch(`${origin}/r/${file}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /application\/json/);
      assert.deepEqual(
        await response.json(),
        JSON.parse(readFileSync(path.join(registryOutput, "public/r", file))),
      );
    }
    assert.equal((await fetch(`${origin}/r/`)).status, 200);
    for (const invalid of [
      "/r/missing.json",
      "/r/nested/item.json",
      "/r/%2e%2e%2fpackage.json",
      "/charts/docs/r/line-chart.json",
    ])
      assert.equal((await fetch(`${origin}${invalid}`)).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("registry deployment snapshot merges only /r and preserves site identity", () => {
  const fixture = mkdtempSync(path.join(tmpdir(), "kind-registry-snapshot-"));
  try {
    mkdirSync(path.join(fixture, "out/r"), { recursive: true });
    mkdirSync(path.join(fixture, ".openai"));
    writeFileSync(path.join(fixture, ".openai/hosting.json"), '{"projectId":"existing-site"}');
    writeFileSync(path.join(fixture, "out/index.html"), "existing homepage");
    writeFileSync(path.join(fixture, "out/r/obsolete.json"), "{}");
    execFileSync(process.execPath, [
      path.join(repositoryRoot, "scripts/snapshot-registry.mjs"),
      fixture,
    ]);
    assert.equal(readFileSync(path.join(fixture, "out/index.html"), "utf8"), "existing homepage");
    assert.equal(
      readFileSync(path.join(fixture, ".openai/hosting.json"), "utf8"),
      '{"projectId":"existing-site"}',
    );
    assert.deepEqual(
      readdirSync(path.join(fixture, "out/r")).sort(),
      readdirSync(path.join(registryOutput, "public/r")).sort(),
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
