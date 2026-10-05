import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { assertDocumentationContract, recipeSourcePrefix } from "./documentation-contract.mjs";

const readme = await readFile(new URL("../packages/charts/README.md", import.meta.url), "utf8");
const recipes = await readdir(new URL("../examples/chart/", import.meta.url));
const files = ["README.md", "CHANGELOG.md", "LICENSE", "package.json"];

test("shipped README links use available canonical recipes", () => {
  assertDocumentationContract(readme, recipes, files);
});
test("rejects recipe links outside the tarball", () => {
  assert.throws(
    () =>
      assertDocumentationContract(
        readme.replace(recipeSourcePrefix, "../../examples/chart/"),
        recipes,
        files,
      ),
    /canonical repository recipe route/,
  );
});
test("rejects recipe references on an unsupported route", () => {
  assert.throws(
    () =>
      assertDocumentationContract(
        readme.replace(recipeSourcePrefix, recipeSourcePrefix.replace("blob/main", "blob/unknown")),
        recipes,
        files,
      ),
    /canonical repository recipe route/,
  );
});
test("rejects missing recipe targets and other unpacked local files", () => {
  assert.throws(
    () =>
      assertDocumentationContract(
        readme,
        recipes.filter((file) => file !== "BARS.md"),
        files,
      ),
    /Missing recipe/,
  );
  assert.throws(
    () => assertDocumentationContract(`${readme}\n[guide](../../docs/guide.md)`, recipes, files),
    /Link leaves the package/,
  );
});

test("rejects a README changelog link when the changelog is not packed", () => {
  assert.throws(
    () =>
      assertDocumentationContract(
        readme,
        recipes,
        files.filter((file) => file !== "CHANGELOG.md"),
      ),
    /Link leaves the package: CHANGELOG.md/,
  );
});
