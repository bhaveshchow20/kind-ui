import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createGenerator, createProject } from "fumadocs-typescript";
import ts from "typescript";
import { examples } from "../examples/catalog.mjs";

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
  .update(readFileSync("vendor/kind-ui-charts-0.0.0.tgz"))
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
    "@kind-ui/charts": local ? "file:vendor/kind-ui-charts-0.0.0.tgz" : provenance.version,
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
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  throw new Error("Settings must contain only JSON literals");
}
const bundles = {};
for (const example of examples) {
  const settingsSource = read(`examples/${example.id}/settings.ts`);
  const parsed = ts.createSourceFile("settings.ts", settingsSource, ts.ScriptTarget.Latest, true);
  const variable = parsed.statements
    .flatMap((s) => (ts.isVariableStatement(s) ? [...s.declarationList.declarations] : []))
    .find((v) => v.name.getText(parsed) === "defaultSettings");
  if (!variable?.initializer) throw new Error(`Missing settings for ${example.id}`);
  const settings = literal(variable.initializer);
  const files = {
    "package.json": JSON.stringify(manifest, null, 2) + "\n",
    "index.html":
      '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kind UI chart example</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
    "tsconfig.json":
      JSON.stringify(
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
      ) + "\n",
    "src/main.tsx": `import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport { Example } from "./examples/${example.id}/example";\nimport "@kind-ui/charts/styles.css";\nimport "./example.css";\nconst root = document.getElementById("root");\nif (!root) throw new Error("Missing mount element");\ncreateRoot(root).render(<StrictMode><Example /></StrictMode>);\n`,
    "src/example.css": read("examples/shared/example.css"),
    "src/examples/shared/controls.tsx": read("examples/shared/controls.tsx"),
    [`src/examples/${example.id}/example.tsx`]: read(`examples/${example.id}/example.tsx`),
    [`src/examples/${example.id}/settings.ts`]: settingsSource,
    "README.md": `# ${example.title} — complete consumer\n\n${status}.\n\nNode 22.12+ and npm 11.9. ${local ? "The downloaded ZIP includes the exact vendor tarball. This package is not on npm; do not replace it with a registry install." : "This bundle pins the published package version."}\n\nRun npm install (or npm ci when the lockfile is present), then npm run dev or npm run build.\n\n${example.notes}\n\nAcceptance: ${example.acceptance}\n\nSelected options are in src/examples/${example.id}/settings.ts. Chart geometry and filtering stay in example.tsx. Source adapted from ${example.source} at ${provenance.sourceCommit}; original repository MIT license.\n\n${local ? `Vendor SHA-256: ${provenance.sha256}.` : ""}\n`,
    LICENSE: read("../../LICENSE"),
  };
  if (existsSync("examples/shared/consumer-package-lock.json"))
    files["package-lock.json"] = read("examples/shared/consumer-package-lock.json");
  bundles[example.id] = {
    ...example,
    settings,
    files,
    packageStatus: status,
    localPackage: local,
    version: provenance.version,
  };
  for (const [file, body] of Object.entries(files))
    write(`public/examples/${example.id}/${file}`, body);
}
write("generated/examples.json", JSON.stringify(bundles, null, 2) + "\n");
write("public/package-provenance.json", JSON.stringify(provenance, null, 2) + "\n");
if (local) {
  mkdirSync("public/examples/package", { recursive: true });
  cpSync("vendor/kind-ui-charts-0.0.0.tgz", "public/examples/package/kind-ui-charts-0.0.0.tgz");
}
const project = await createProject({ tsconfigPath: "tsconfig.json" });
const generator = createGenerator({ project });
const typeSource = ts.createSourceFile(
  "public-types.ts",
  read("lib/public-types.ts"),
  ts.ScriptTarget.Latest,
  true,
);
const names = typeSource.statements
  .filter((node) => ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node))
  .map((node) => node.name.text);
const generated = [];
try {
  for (const name of names)
    generated.push(
      ...(await generator.generateDocumentation(
        { path: path.resolve("lib/public-types.ts") },
        name,
      )),
    );
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
if (!api.Root?.length || !api.PieSeries?.length || !api.ComboChart?.length)
  throw new Error("Public API generation returned incomplete tables");
write("generated/api.json", JSON.stringify(api, null, 2) + "\n");
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
const origin = process.env.KIND_DOCS_ORIGIN?.replace(/\/$/, "") || "";
for (const entry of readdirSync("content/docs", { recursive: true }).filter((entry) =>
  String(entry).endsWith(".mdx"),
)) {
  const original = read(`content/docs/${entry}`);
  const title = original.match(/^title:\s*(.+)$/m)?.[1] || "Kind UI";
  const description = original.match(/^description:\s*(.+)$/m)?.[1] || "";
  const key = String(entry).replace(/\.mdx$/, "");
  let body = original.replace(/^---\n[\s\S]*?\n---\n/, "");
  body = body.replace(/<ComponentPlayground id="([\w-]+)"\s*\/>/g, (_, id) => {
    const bundle = bundles[id];
    if (!bundle) throw new Error(`Unknown example ${id}`);
    const inline = Object.entries(bundle.files).filter(
      ([file]) => !["package-lock.json", "LICENSE", "README.md"].includes(file),
    );
    const linked = Object.keys(bundle.files).filter(
      (file) => !inline.some(([name]) => name === file),
    );
    return (
      `## Complete ${bundle.title} consumer\n\n${bundle.notes}\n\n${bundle.packageStatus}. Use Download example at ${origin}/docs/components/${id}/; the ZIP includes the vendor tarball. Direct package asset: ${origin}/examples/package/kind-ui-charts-0.0.0.tgz.\n\n` +
      inline
        .map(
          ([file, source]) =>
            `### ${file}\n\n\`\`\`${file.endsWith("tsx") ? "tsx" : file.endsWith("ts") ? "ts" : file.endsWith("css") ? "css" : file.endsWith("json") ? "json" : "text"}\n${source.trimEnd()}\n\`\`\``,
        )
        .join("\n\n") +
      "\n\nComplete setup files:\n" +
      linked.map((file) => `- [${file}](${origin}/examples/${id}/${file})`).join("\n")
    );
  });
  body = body.replace(/<ApiTable name="([\w]+)"(?:\s+compact)?\s*\/>/g, (_, name) =>
    tableMarkdown(name),
  );
  if (/<(?:ComponentPlayground|ApiTable)\b/.test(body)) throw new Error(`Unresolved MDX in ${key}`);
  const markdown = `# ${title}\n\n${description}\n\nPackage snapshot: ${status}.\n\n${body.trim()}\n`;
  write(`public/markdown/${key}.md`, markdown);
  index.push({ key, title, markdown });
}
write(
  "public/llms.txt",
  `# Kind UI charts documentation\n\nPre-release documentation preview. ${status}. This Site is initially owner-private; its URLs are not an anonymous public-docs availability claim. No registry installation is available in local mode.\n\nUse the consumer guidance, then retrieve the exact example and public type reference. Geometry and data stay consumer-owned. Glass is paused.\n\n` +
    index.map(({ key, title }) => `- [${title}](${origin}/markdown/${key}.md)`).join("\n") +
    "\n",
);
write("public/llms-full.txt", index.map(({ markdown }) => markdown).join("\n\n---\n\n"));
console.log(
  `Generated ${examples.length} complete examples, ${Object.keys(api).length} public API tables and ${index.length} Markdown pages.`,
);
