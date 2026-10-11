import { cpSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRegistry, repositoryRoot } from "../../../scripts/build-registry.mjs";

export function syncRegistry() {
  const docsRoot = fileURLToPath(new URL("..", import.meta.url));
  const output = buildRegistry();
  // Compatibility URLs remain under the old docs mount. /r is hosted independently.
  rmSync(path.join(docsRoot, "public/r"), { recursive: true, force: true });
  cpSync(path.join(output, "public/r"), path.join(docsRoot, "public/r"), { recursive: true });
  cpSync(
    path.join(output, "installations.json"),
    path.join(docsRoot, "generated/registry-installations.json"),
  );
  cpSync(path.join(repositoryRoot, "registry/charts"), path.join(docsRoot, "generated/charts"), {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}legacy`),
  });
}
