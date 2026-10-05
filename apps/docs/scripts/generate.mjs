import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createGenerator, createProject } from "fumadocs-typescript";
import ts from "typescript";
import {
  allExamples,
  dataLabels,
  examples,
  families,
  variantDefinitions,
} from "../examples/catalog.mjs";
import { publicPath } from "../lib/routing.mjs";

const read = (file) => readFileSync(file, "utf8");
const write = (file, text) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
};
const provenance = JSON.parse(read("vendor/provenance.json"));
const installed = JSON.parse(read("node_modules/@kind-ui/charts/package.json"));
if (installed.version !== provenance.version)
  throw new Error(
    "Installed chart package differs from pinned tarball. Run npm install after prepare:package.",
  );
const tarballHash = createHash("sha256")
  .update(readFileSync("vendor/kind-ui-charts-0.1.0.tgz"))
  .digest("hex");
if (tarballHash !== provenance.sha256) throw new Error("Package tarball does not match provenance");
const appLock = JSON.parse(read("package-lock.json"));
if (appLock.packages["node_modules/@kind-ui/charts"].integrity !== provenance.integrity)
  throw new Error("Documentation install lock differs from pinned tarball integrity");
const local = provenance.mode === "local";
const manifest = {
  name: "kind-ui-chart-example",
  private: true,
  version: "0.0.0",
  type: "module",
  scripts: { dev: "vite --host 127.0.0.1", build: "tsc --noEmit && vite build" },
  dependencies: {
    "@kind-ui/charts": local ? "file:vendor/kind-ui-charts-0.1.0.tgz" : provenance.version,
    react: "19.3.0",
    "react-dom": "19.3.0",
    recharts: "3.10.1",
    motion: "13.4.6",
  },
  devDependencies: {
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    typescript: "5.9.3",
    vite: "8.3.1",
  },
};
const status = local
  ? `unpublished @kind-ui/charts@${provenance.version}, source ${provenance.sourceCommit.slice(0, 7)}, SHA-256 ${provenance.sha256}`
  : `published @kind-ui/charts@${provenance.version}`;
function literal(node) {
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((prop) => {
        if (!ts.isPropertyAssignment(prop))
          throw new Error("Settings must be plain literal properties");
        return [prop.name.text, literal(prop.initializer)];
      }),
    );
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    if (node.operator === ts.SyntaxKind.MinusToken) return -Number(node.operand.text);
    if (node.operator === ts.SyntaxKind.PlusToken) return Number(node.operand.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  throw new Error("Settings must contain only JSON literals");
}
// Rebuild the published asset sets so removed pages and examples cannot survive.
rmSync("public/examples", { recursive: true, force: true });
rmSync("public/markdown", { recursive: true, force: true });
rmSync("generated", { recursive: true, force: true });
const origin = process.env.KIND_DOCS_ORIGIN?.replace(/\/$/, "") || "";
const link = (path) => `${origin}${publicPath(path)}`;
const bundles = {};
for (const example of allExamples) {
  if (!Object.hasOwn(dataLabels, example.id))
    throw new Error(`Unknown component example: ${example.id}`);
  const exampleSource = read(`examples/${example.id}/example.tsx`);
  const componentName = exampleSource.match(/export function (\w+)/)?.[1] ?? "Example";
  const parsed = ts.createSourceFile("example.tsx", exampleSource, ts.ScriptTarget.Latest, true);
  const variable = parsed.statements
    .flatMap((s) => (ts.isVariableStatement(s) ? [...s.declarationList.declarations] : []))
    .find((v) => v.name.getText(parsed) === "data");
  const labels = dataLabels[example.id];
  if (!labels.rows && !variable?.initializer)
    throw new Error(`Missing example data: ${example.id}`);
  const dataAlternative = { ...labels, rows: labels.rows ?? literal(variable.initializer) };
  if (!Array.isArray(dataAlternative.rows) || !dataAlternative.rows.length)
    throw new Error(`Empty data alternative: ${example.id}`);
  for (const row of dataAlternative.rows)
    for (const key of Object.keys(dataAlternative.columns))
      if (!Object.hasOwn(row, key)) throw new Error(`${example.id}: missing data column ${key}`);
  const variantDefinition = variantDefinitions[example.id];
  if (variantDefinition) {
    const defaultLiteral = `${variantDefinition.prop} = "${variantDefinition.default}"`;
    if (exampleSource.split(defaultLiteral).length !== 2)
      throw new Error(`${example.id}: expected one literal variant default ${defaultLiteral}`);
    const values = variantDefinition.options.map(({ value }) => value);
    if (!values.includes(variantDefinition.default) || new Set(values).size !== values.length)
      throw new Error(`${example.id}: variant options need a unique default`);
  }
  const variants = variantDefinition
    ? Object.fromEntries(
        variantDefinition.options.map((option) => [
          option.value,
          {
            label: option.label,
            source: exampleSource.replace(
              `${variantDefinition.prop} = "${variantDefinition.default}"`,
              `${variantDefinition.prop} = "${option.value}"`,
            ),
          },
        ]),
      )
    : undefined;
  const files = {
    "package.json": `${JSON.stringify(manifest, null, 2)}\n`,
    "index.html":
      '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kind UI chart example</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
    "tsconfig.json": `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          esModuleInterop: true,
        },
        include: ["src"],
      },
      null,
      2,
    )}\n`,
    "src/main.tsx": `import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport { ${componentName} } from "./examples/${example.id}/example";\nimport "@kind-ui/charts/styles.css";\nimport "./example.css";\nconst root = document.getElementById("root");\nif (!root) throw new Error("Missing mount element");\ncreateRoot(root).render(<StrictMode><${componentName} /></StrictMode>);\n`,
    "src/example.css": read("examples/shared/example.css"),
    [`src/examples/${example.id}/example.tsx`]: exampleSource,
    "README.md": `# ${example.title} — complete consumer\n\n${status}.\n\nNode 22.12+ and npm 11.9. Use the pinned vendor tarball identified by provenance; this package is not on npm.\n\nUse these complete files, preserving their directory structure. Put the exact package asset at vendor/kind-ui-charts-0.1.0.tgz. Run npm ci, then npm run dev or npm run build.\n\n${example.notes}\n\nAcceptance: ${example.acceptance}\n\nPaste example.tsx into your app. It includes its data and public imports; ${example.id.startsWith("area") ? "Area uses Root and ResponsiveContainer; stacked legend visibility is consumer-owned." : "Preserve the documented family composition and visibility ownership."} No demo modules are required. Documentation consumer of package source ${provenance.sourceCommit}.\n\nVendor SHA-256: ${provenance.sha256}.\n`,
    LICENSE: read("../../LICENSE"),
  };
  if (existsSync("examples/shared/consumer-package-lock.json"))
    files["package-lock.json"] = read("examples/shared/consumer-package-lock.json");
  files["README.md"] +=
    "\n## Complete setup files\n\n" +
    Object.keys(files)
      .filter((file) => file !== "README.md")
      .map((file) => `- [${file}](${link(`/examples/${example.id}/${file}`)})`)
      .join("\n") +
    `\n- [Pinned tarball](${link("/examples/package/kind-ui-charts-0.1.0.tgz")})\n- [Provenance](${link("/package-provenance.json")})\n`;
  bundles[example.id] = {
    ...example,
    ...(dataAlternative ? { dataAlternative } : {}),
    ...(variants
      ? {
          variants,
          variantControl: variantDefinition.control,
          defaultVariant: variantDefinition.default,
        }
      : {}),
    files,
    packageStatus: status,
    localPackage: local,
    version: provenance.version,
  };
  if (variants)
    for (const [value, variant] of Object.entries(variants))
      write(`public/examples/${example.id}/variants/${value}/example.tsx`, variant.source);
  for (const [file, body] of Object.entries(files))
    write(`public/examples/${example.id}/${file}`, body);
}
write(
  "generated/examples.json",
  `${JSON.stringify(Object.fromEntries(examples.map(({ id }) => [id, bundles[id]])), null, 2)}\n`,
);
write("generated/all-examples.json", `${JSON.stringify(bundles, null, 2)}\n`);
for (const family of families)
  write(
    `generated/${family.id}-examples.json`,
    `${JSON.stringify(
      Object.fromEntries(family.examples.map(({ id }) => [id, bundles[id]])),
      null,
      2,
    )}\n`,
  );
write("public/package-provenance.json", `${JSON.stringify(provenance, null, 2)}\n`);
if (local) {
  mkdirSync("public/examples/package", { recursive: true });
  cpSync("vendor/kind-ui-charts-0.1.0.tgz", "public/examples/package/kind-ui-charts-0.1.0.tgz");
}
const project = await createProject({ tsconfigPath: "tsconfig.json" });
const generator = createGenerator({ project });
const typePaths = [
  "lib/public-types.ts",
  ...(existsSync("lib/public-types")
    ? readdirSync("lib/public-types")
        .filter((file) => file.endsWith(".ts"))
        .sort()
        .map((file) => `lib/public-types/${file}`)
    : []),
];
const generated = [];
const aliases = new Set();
try {
  for (const file of typePaths) {
    const typeSource = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    const names = typeSource.statements
      .filter((node) => ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node))
      .filter((node) =>
        node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
      )
      .map((node) => node.name.text);
    for (const name of names) {
      if (aliases.has(name)) throw new Error(`Duplicate public documentation type: ${name}`);
      aliases.add(name);
      generated.push(
        ...(await generator.generateDocumentation({ path: path.resolve(file) }, name)),
      );
    }
  }
} finally {
  project.close();
}
const api = Object.fromEntries(
  generated.map((table) => [
    table.name,
    table.entries.map(({ name, type, description, required }) => ({
      name,
      type,
      description,
      required,
    })),
  ]),
);
if (!api.Root?.length || !api.LineSeries?.length || !api.LineChart?.length)
  throw new Error("Public API generation returned incomplete tables");
write("generated/api.json", `${JSON.stringify(api, null, 2)}\n`);
const tableMarkdown = (name) => {
  if (!api[name]) throw new Error(`Unknown API table ${name}`);
  return (
    `### ${name}\n\n| Prop | Type | Required |\n| --- | --- | --- |\n` +
    api[name]
      .map(
        (entry) =>
          `| ${entry.name} | \`${entry.type.replaceAll("|", "\\|").replaceAll("`", "'")}\` | ${entry.required ? "Yes" : "No"} |`,
      )
      .join("\n")
  );
};
const index = [];
for (const entry of readdirSync("content/docs", { recursive: true }).filter((entry) =>
  String(entry).endsWith(".mdx"),
)) {
  const original = read(`content/docs/${entry}`);
  const title = original.match(/^title:\s*(.+)$/m)?.[1] || "Kind UI";
  const description = original.match(/^description:\s*(.+)$/m)?.[1] || "";
  const key = String(entry).replace(/\.mdx$/, "");
  let body = original.replace(/^---\n[\s\S]*?\n---\n/, "");
  body = body.replace(/<PackageSource\s*\/>/g, `\`${provenance.sourceCommit}\``);
  body = body.replace(
    /<(?:ComponentPlayground|ChartExample|LineExample|AreaExample) id="([\w-]+)"\s*\/>/g,
    (_, id) => {
      const bundle = bundles[id];
      if (!bundle) throw new Error(`Unknown example ${id}`);
      const inline = Object.entries(bundle.files).filter(
        ([file]) => !["package-lock.json", "LICENSE", "README.md"].includes(file),
      );
      const linked = Object.keys(bundle.files).filter(
        (file) => !inline.some(([name]) => name === file),
      );
      return (
        `## Complete ${bundle.title} consumer\n\n${bundle.notes}\n\n${bundle.packageStatus}. Pinned package asset: ${link("/examples/package/kind-ui-charts-0.1.0.tgz")}.\n\n` +
        inline
          .map(
            ([file, source]) =>
              `### ${file}\n\n\`\`\`${file.endsWith("tsx") ? "tsx" : file.endsWith("ts") ? "ts" : file.endsWith("css") ? "css" : file.endsWith("json") ? "json" : "text"}\n${source.trimEnd()}\n\`\`\``,
          )
          .join("\n\n") +
        "\n\nComplete setup files:\n" +
        linked.map((file) => `- [${file}](${link(`/examples/${id}/${file}`)})`).join("\n")
      );
    },
  );
  body = body.replace(/<ApiTable name="([\w]+)"(?:\s+compact)?\s*\/>/g, (_, name) =>
    tableMarkdown(name),
  );
  if (/<(?:ComponentPlayground|ChartExample|LineExample|AreaExample|ApiTable)\b/.test(body))
    throw new Error(`Unresolved MDX in ${key}`);
  // Rewrite retrieval links outside fences; copied consumer source stays byte-for-byte unchanged.
  body = body
    .split(/(```[^\n]*\n[\s\S]*?\n```)/g)
    .map((part, index) =>
      index % 2 ? part : part.replace(/\]\((\/(?!\/)[^\s)]+)\)/g, (_, path) => `](${link(path)})`),
    )
    .join("");
  const markdown = `# ${title}\n\n${description}\n\nPackage snapshot: ${status}.\n\n${body.trim()}\n`;
  write(`public/markdown/${key}.md`, markdown);
  index.push({ key, title, markdown });
}
write(
  "public/llms.txt",
  `# Kind UI charts documentation\n\nPre-release documentation preview. ${status}. This Site is initially owner-private; its URLs are not an anonymous public-docs availability claim. No registry installation is available in local mode.\n\nUse the consumer guidance, then retrieve the exact example and public type reference. Geometry and data stay consumer-owned. Glass is paused.\n\n` +
    index.map(({ key, title }) => `- [${title}](${link(`/markdown/${key}.md`)})`).join("\n") +
    "\n",
);
write(
  "public/AGENTS.md",
  read("lib/consumer-agent-guide.md").replace(
    /\/(?:llms(?:-full)?\.txt|markdown\/[\w/.-]+|package-provenance\.json|examples\/[\w/.-]+)/g,
    (path) => link(path),
  ),
);
write("public/llms-full.txt", index.map(({ markdown }) => markdown).join("\n\n---\n\n"));
console.log(
  `Generated ${Object.keys(bundles).length} complete chart components, ${Object.keys(api).length} public API tables and ${index.length} Markdown pages.`,
);
