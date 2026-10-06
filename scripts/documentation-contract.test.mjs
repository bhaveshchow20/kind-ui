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

test("installation commands explicitly include every public required peer", async () => {
  const commands = JSON.parse(
    await readFile(new URL("../apps/docs/lib/installation-commands.json", import.meta.url)),
  );
  const manifest = JSON.parse(
    await readFile(new URL("../packages/charts/package.json", import.meta.url)),
  );
  assert.deepEqual(Object.keys(commands), ["npm", "pnpm", "yarn", "bun"]);
  for (const [manager, command] of Object.entries(commands)) {
    const [binary, action, packageName, ...peers] = command.split(" ");
    assert.equal(binary, manager);
    assert.equal(action, manager === "npm" ? "install" : "add");
    assert.equal(packageName, manifest.name);
    assert.deepEqual(peers, ["react", "react-dom", "recharts", "motion"]);
    assert.deepEqual([...peers].sort(), Object.keys(manifest.peerDependencies).sort());
  }
  for (const file of [
    "README.md",
    "packages/charts/README.md",
    "docs/charts-api.md",
    "skills/kind-ui-charts/SKILL.md",
    "apps/docs/lib/consumer-agent-guide.md",
  ]) {
    const body = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.ok(body.includes(commands.npm), `${file} must document explicit peers`);
  }
});

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
