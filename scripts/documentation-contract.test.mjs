import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertDocumentationContract,
  documentationSource,
  repositorySourcePrefix,
} from "./documentation-contract.mjs";

const readme = await readFile(new URL("../packages/charts/README.md", import.meta.url), "utf8");
const recipes = await readdir(new URL("../examples/chart/", import.meta.url));
const files = ["README.md", "CHANGELOG.md", "LICENSE", "package.json"];
const check = (body, packed = files) => assertDocumentationContract(body, recipes, packed);
const withoutPublicImports = (body) =>
  body.replaceAll(/from\s+["']@kind-ui\/charts["']/g, 'from "../src"');
const withoutStylesheetImports = (body) =>
  body.replaceAll(/import\s+["']@kind-ui\/charts\/styles\.css["'];?/g, "");

test("quick-start README uses public imports, stylesheet and existing documentation sources", () => {
  check(readme);
});
test("rejects missing documentation, public package import and stylesheet setup", () => {
  assert.throws(
    () => check(readme.replace(documentationSource, "https://example.com")),
    /canonical documentation/,
  );
  assert.throws(() => check(withoutPublicImports(readme)), /public package import/);
  assert.throws(() => check(withoutStylesheetImports(readme)), /stylesheet import/);
});
test("negative fixtures remove setup imports from every example", () => {
  const multipleExamples = `[Documentation](${documentationSource})

\`\`\`tsx
import { LineChart } from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
\`\`\`

\`\`\`tsx
import { AreaChart } from
  '@kind-ui/charts';
import
  '@kind-ui/charts/styles.css';
\`\`\`
`;
  check(multipleExamples);
  assert.throws(() => check(withoutPublicImports(multipleExamples)), /public package import/);
  assert.throws(() => check(withoutStylesheetImports(multipleExamples)), /stylesheet import/);
});
test("rejects missing or unsupported repository source links", () => {
  assert.throws(
    () => check(`${readme}\n[missing](${repositorySourcePrefix}blob/main/docs/missing.md)`),
    /Missing repository source/,
  );
  assert.throws(
    () =>
      check(`${readme}\n[branch](${repositorySourcePrefix}blob/unknown/examples/chart/BARS.md)`),
    /Unsupported repository source route/,
  );
  assert.throws(
    () =>
      check(`${readme}\n[recipe](${repositorySourcePrefix}blob/main/examples/chart/missing.md)`),
    /Missing recipe source/,
  );
});
test("rejects links outside the package and an unpacked license", () => {
  assert.throws(() => check(`${readme}\n[guide](../../docs/guide.md)`), /Link leaves the package/);
  assert.throws(
    () =>
      check(
        readme,
        files.filter((file) => file !== "LICENSE"),
      ),
    /Link leaves the package: LICENSE/,
  );
});
