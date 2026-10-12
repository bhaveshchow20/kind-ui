import assert from "node:assert/strict";
import { cp, mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../../../", import.meta.url));

/**
 * Stage generated assets in the existing homepage host, at their domain-root paths.
 * @param {{docsExport?: string, registry?: string, publicDirectory?: string}} options
 */
export async function prepareHostingAssets(options = {}) {
  const docsExport = options.docsExport ?? path.join(repository, "apps/docs/out");
  const registry = options.registry ?? path.join(repository, "artifacts/registry/r");
  const publicDirectory = options.publicDirectory ?? path.join(repository, "apps/showcase/public");
  const docsHTML = await readFile(path.join(docsExport, "index.html"), "utf8");
  assert.ok(
    docsHTML.includes('href="https://kindui.dev/charts/docs/"'),
    "Hosting requires Docs built for the production /charts/docs mount",
  );
  assert.ok(
    !docsHTML.includes("noindex") && docsHTML.includes("/charts/docs/_next/"),
    "Hosting requires a production-indexable Docs export with the public asset prefix",
  );
  const files = await readdir(registry, { withFileTypes: true });
  assert.ok(
    files.some(({ name }) => name === "registry.json"),
    "Build the registry catalog first",
  );
  assert.ok(
    files.every((file) => file.isFile() && /^[a-z0-9-]+\.json$/.test(file.name)),
    "The root registry must contain only flat JSON endpoints",
  );
  for (const file of files) {
    /** @type {unknown} */
    const parsed = JSON.parse(await readFile(path.join(registry, file.name), "utf8"));
    assert.ok(parsed !== null && typeof parsed === "object", `${file.name} must contain JSON`);
  }
  await mkdir(path.join(publicDirectory, "charts"), { recursive: true });
  for (const [source, target] of [
    [docsExport, path.join(publicDirectory, "charts/docs")],
    [registry, path.join(publicDirectory, "r")],
  ]) {
    assert.ok(source && target);
    await rm(target, { recursive: true, force: true });
    await cp(source, target, { recursive: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareHostingAssets();
  console.log("Production Docs and registry assets staged in the homepage domain-root host.");
}
