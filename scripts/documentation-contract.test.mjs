import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertDocumentationContract,
  documentationSource,
  repositorySourcePrefix,
} from "./documentation-contract.mjs";

const readme = await readFile(new URL("../packages/charts/README.md", import.meta.url), "utf8");
const files = ["README.md", "CHANGELOG.md", "LICENSE", "package.json"];
const check = (body, packed = files) => assertDocumentationContract(body, packed);
const withoutPublicImports = (body) =>
  body.replaceAll(/from\s+["']@kind-ui\/charts["']/g, 'from "../src"');
const withoutTailwindImports = (body) => body.replaceAll(/@import\s+["']tailwindcss["'];?/g, "");
const withoutPackageSources = (body) =>
  body.replaceAll(/@source\s+["'][^"']*node_modules\/@kind-ui\/charts\/dist["'];?/g, "");

test("quick-start README uses public imports, Tailwind setup and existing documentation sources", () => {
  check(readme);
});
test("rejects missing documentation, public package import and Tailwind setup", () => {
  assert.throws(
    () => check(readme.replaceAll(documentationSource, "https://example.com")),
    /canonical documentation/,
  );
  assert.throws(() => check(withoutPublicImports(readme)), /public package import/);
  assert.throws(() => check(withoutTailwindImports(readme)), /Tailwind CSS import/);
  assert.throws(() => check(withoutPackageSources(readme)), /Tailwind package source/);
  assert.throws(
    () => check(`${readme}\nimport "@kind-ui/charts/styles.css";`),
    /Removed stylesheet export/,
  );
});
test("negative fixtures remove Tailwind setup from every example", () => {
  const multipleExamples = `[Documentation](${documentationSource})

\`\`\`css
@import "tailwindcss";
@source "../node_modules/@kind-ui/charts/dist";
\`\`\`

\`\`\`tsx
import { LineChart } from "@kind-ui/charts";
\`\`\`

\`\`\`css
@import
  'tailwindcss';
@source
  '../node_modules/@kind-ui/charts/dist';
\`\`\`

\`\`\`tsx
import { AreaChart } from
  '@kind-ui/charts';
\`\`\`
`;
  check(multipleExamples);
  assert.throws(() => check(withoutPublicImports(multipleExamples)), /public package import/);
  assert.throws(() => check(withoutTailwindImports(multipleExamples)), /Tailwind CSS import/);
  assert.throws(() => check(withoutPackageSources(multipleExamples)), /Tailwind package source/);
});
test("rejects missing or unsupported repository source links", () => {
  assert.throws(
    () => check(`${readme}\n[missing](${repositorySourcePrefix}blob/main/docs/missing.md)`),
    /Missing repository source/,
  );
  assert.throws(
    () =>
      check(
        `${readme}\n[branch](${repositorySourcePrefix}blob/unknown/apps/docs/examples/line/example.tsx)`,
      ),
    /Unsupported repository source route/,
  );
  assert.throws(
    () =>
      check(
        `${readme}\n[recipe](${repositorySourcePrefix}blob/main/apps/docs/examples/missing.tsx)`,
      ),
    /Missing repository source/,
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
