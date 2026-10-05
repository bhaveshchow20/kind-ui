import assert from "node:assert/strict";
import { existsSync } from "node:fs";

export const repositorySourcePrefix = "https://github.com/bhaveshchow20/kind-ui/";
export const documentationSource = `${repositorySourcePrefix}tree/main/apps/docs/content/docs`;
export const recipeSourcePrefix = `${repositorySourcePrefix}blob/main/examples/chart/`;

export function assertDocumentationContract(readme, recipeFiles, packedFiles) {
  const links = [...readme.matchAll(/\]\(([^)]+)\)/g)].map(([, target]) => target);
  assert.ok(links.includes(documentationSource), "README must link the canonical documentation");
  assert.match(
    readme,
    /import\s+["']@kind-ui\/charts\/styles\.css["']/,
    "Missing stylesheet import",
  );
  assert.match(readme, /from\s+["']@kind-ui\/charts["']/, "Missing public package import");
  for (const target of links) {
    if (target.startsWith(recipeSourcePrefix)) {
      const file = target.slice(recipeSourcePrefix.length).split("#")[0];
      assert.ok(recipeFiles.includes(file), `Missing recipe source: ${file}`);
    } else if (target.startsWith(repositorySourcePrefix)) {
      const route = target.slice(repositorySourcePrefix.length).split("#")[0];
      if (!route) continue;
      assert.match(route, /^(blob|tree)\/main\//, `Unsupported repository source route: ${target}`);
      const file = route.replace(/^(blob|tree)\/main\//, "");
      assert.ok(
        existsSync(new URL(`../${file}`, import.meta.url)),
        `Missing repository source: ${file}`,
      );
    } else if (!/^(https?:|#)/.test(target)) {
      assert.ok(packedFiles.includes(target.split("#")[0]), `Link leaves the package: ${target}`);
    }
  }
}
