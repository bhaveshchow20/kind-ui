import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { coreVersion, docsRoot, publishedIntegrity, validateCatalog } from "./registry.mjs";

const read = (file) => readFileSync(file, "utf8");
const index = JSON.parse(read("registry.json"));
validateCatalog(index);
const root = path.join(docsRoot, "artifacts/registry-consumer");
rmSync(root, { recursive: true, force: true });
mkdirSync(path.join(root, "src"), { recursive: true });
const write = (file, body) => writeFileSync(path.join(root, file), body);
const json = (file, body) => write(file, `${JSON.stringify(body, null, 2)}\n`);
// A real src-based consumer validates the CLI's target handling as well as dependency resolution.
json("package.json", {
  name: "kind-registry-consumer",
  private: true,
  type: "module",
  scripts: { build: "tsc --noEmit && vite build" },
  dependencies: { react: "19.3.0", "react-dom": "19.3.0", recharts: "3.10.1", motion: "13.4.6" },
  devDependencies: {
    typescript: "5.9.3",
    vite: "8.3.1",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
  },
});
json("tsconfig.json", {
  compilerOptions: {
    target: "ES2022",
    lib: ["ES2022", "DOM", "DOM.Iterable"],
    module: "ESNext",
    moduleResolution: "Bundler",
    jsx: "react-jsx",
    strict: true,
    skipLibCheck: false,
    types: ["react", "react-dom"],
    noEmit: true,
    esModuleInterop: true,
    paths: { "@/*": ["./src/*"] },
  },
  include: ["src"],
});
json("components.json", {
  $schema: "https://ui.shadcn.com/schema.json",
  style: "new-york",
  rsc: false,
  tsx: true,
  tailwind: { config: "", css: "src/globals.css", baseColor: "neutral", cssVariables: true },
  aliases: {
    components: "@/components",
    ui: "@/components/ui",
    utils: "@/lib/utils",
    lib: "@/lib",
    hooks: "@/hooks",
  },
});
write("src/globals.css", "@import 'tailwindcss';\n");
write(
  "index.html",
  '<!doctype html><html lang="en"><title>Registry consumer</title><div id="root"></div><script type="module" src="/src/main.tsx"></script></html>',
);
async function run(command, args, cwd = root) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited ${code}`)),
    );
  });
}
const server = createServer((req, res) => {
  const name = new URL(req.url, "http://localhost").pathname.match(
    /^\/charts\/docs\/r\/([a-z-]+)\.json$/,
  )?.[1];
  if (!name) {
    res.writeHead(404);
    return res.end();
  }
  try {
    res.setHeader("Content-Type", "application/json");
    res.end(read(`public/r/${name}.json`));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/charts/docs/r`;
const config = JSON.parse(read(path.join(root, "components.json")));
config.registries = { "@kind": `${base}/{name}.json` };
json("components.json", config);

const evidence = [];
try {
  const published = JSON.parse(
    execFileSync("npm", ["view", `@kind-ui/charts@${coreVersion}`, "--json"], { encoding: "utf8" }),
  );
  assert.equal(
    published.dist.integrity,
    publishedIntegrity,
    "Published npm bytes changed: review compatibility pin",
  );
  await run("npm", ["install", "--no-audit", "--no-fund"]);
  await run("npm", [
    "exec",
    "--yes",
    "--package=shadcn@4.21.4",
    "--",
    "shadcn",
    "search",
    "@kind",
    "--limit",
    "100",
  ]);
  for (const item of index.items) {
    const before = new Set(readdirSync(path.join(root, "src"), { recursive: true }));
    await run("npm", [
      "exec",
      "--yes",
      "--package=shadcn@4.21.4",
      "--",
      "shadcn",
      "add",
      `${base}/${item.name}.json`,
      "--yes",
      "--silent",
    ]);
    const added = readdirSync(path.join(root, "src"), { recursive: true }).filter(
      (file) => !before.has(file),
    );
    const expected = item.files.map((file) => file.target);
    for (const target of expected) assert.ok(read(path.join(root, "src", target)).length);
    for (const file of added.filter((file) => /\.(css|tsx)$/.test(file)))
      assert.ok(expected.includes(file), `${item.name} installed unrelated ${file}`);
    const manifest = JSON.parse(read(path.join(root, "package.json")));
    assert.equal(manifest.dependencies["@kind-ui/charts"], `^${coreVersion}`);
    evidence.push({ name: item.name, cli: "4.21.4", installed: true, files: expected });
  }
  const lock = JSON.parse(read(path.join(root, "package-lock.json")));
  assert.equal(lock.packages["node_modules/@kind-ui/charts"].integrity, publishedIntegrity);
  assert.equal(lock.packages["node_modules/@kind-ui/charts"].version, coreVersion);
  const bundles = JSON.parse(read("generated/all-examples.json"));
  const imports = [],
    renders = [];
  for (const item of index.items) {
    const bundle = bundles[item.meta.example],
      name = bundle.registry.componentName;
    imports.push(`import { ${name} } from "./components/charts/${bundle.id}/example.js";`);
    renders.push(
      `{(!selected || selected === "${bundle.id}") && <section data-recipe="${bundle.id}"><${name} /></section>}`,
    );
    for (const variant of Object.keys(bundle.variants ?? {}))
      renders.push(
        `{(!selected || selected === "${bundle.id}-${variant}") && <section data-recipe="${bundle.id}-${variant}"><${name} ${bundle.registry.variantProp}=${JSON.stringify(variant)} /></section>}`,
      );
  }
  write(
    "src/main.tsx",
    `import { createRoot } from "react-dom/client";\n${imports.join("\n")}\nconst selected = new URLSearchParams(location.search).get("recipe");\ncreateRoot(document.getElementById("root")!).render(<main>${renders.join("\n")}</main>);\n`,
  );
  await run("npm", ["run", "build"]);
  await run("npm", ["exec", "tsc", "--", "--module", "NodeNext", "--moduleResolution", "NodeNext"]);
  await run("npm", ["ls", "--all"]);
  write(
    "registry-results.json",
    JSON.stringify(
      {
        coreVersion,
        publishedIntegrity,
        declarationModes: ["Bundler", "NodeNext"],
        productionBuild: true,
        items: evidence,
      },
      null,
      2,
    ),
  );
  console.log(
    `All ${evidence.length} registry recipes and their variants installed with the actual shadcn CLI, typechecked and built against published npm.`,
  );
} finally {
  server.close();
}
