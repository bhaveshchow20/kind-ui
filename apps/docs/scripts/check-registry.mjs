import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { localExample } from "../lib/registry-catalog.mjs";
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
  if (process.env.KIND_UI_SHADCN_COLORS_FILE && req.url === "/shadcn/colors/neutral.json") {
    res.setHeader("Content-Type", "application/json");
    return res.end(read(process.env.KIND_UI_SHADCN_COLORS_FILE));
  }
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
// Optional verbatim official color fixture for network-restricted cloud environments.
// Normal CI reads the official registry directly. Never substitute Kind item payloads.
if (process.env.KIND_UI_SHADCN_COLORS_FILE)
  process.env.REGISTRY_URL = `http://127.0.0.1:${server.address().port}/shadcn`;
const config = JSON.parse(read(path.join(root, "components.json")));
config.registries = { "@kind-ui": `${base}/{name}.json` };
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
    "@kind-ui",
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
      `@kind-ui/${item.name}`,
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
  let exampleIndex = 0;
  for (const bundle of Object.values(bundles)) {
    const alternative = `<div className="consumer-alternative"><table data-chart-alternative aria-label=${JSON.stringify(bundle.title + " data")}><caption>{${JSON.stringify(bundle.dataAlternative.caption)}}</caption><tbody>${bundle.dataAlternative.rows
      .map(
        (row) =>
          `<tr>${Object.values(row)
            .map((value) => `<td>{${JSON.stringify(value)}}</td>`)
            .join("")}</tr>`,
      )
      .join("")}</tbody></table></div>`;
    const name = bundle.registry.componentName,
      alias = `Example${exampleIndex++}`;
    for (const [file, content] of Object.entries(bundle.files)) {
      if (!/\.(tsx|ts)$/.test(file)) continue;
      mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      write(
        file,
        (file.endsWith("/example.tsx") ? localExample(content, bundle.family, bundle.id) : content)
          .replaceAll('"@/components/charts/', '"../../components/charts/')
          .replace(/(from "\.\.\/\.\.\/components\/charts\/[^".]+)(")/g, "$1.js$2"),
      );
    }
    imports.push(`import { ${name} as ${alias} } from "./examples/${bundle.id}/example.js";`);
    renders.push(
      `{(!selected || selected === "${bundle.id}") && <section className="chart-example" data-recipe="${bundle.id}"><${alias} />${alternative}</section>}`,
    );
    for (const variant of Object.keys(bundle.variants ?? {}))
      renders.push(
        `{(!selected || selected === "${bundle.id}-${variant}") && <section className="chart-example" data-recipe="${bundle.id}-${variant}"><${alias} ${bundle.registry.variantProp}=${JSON.stringify(variant)} />${alternative}</section>}`,
      );
  }
  write(
    "src/contracts.tsx",
    `import {createRef} from "react";
import {LineChart} from "./components/charts/line-chart.js";
import {AreaChart} from "./components/charts/area-chart.js";
import {RadarChart} from "./components/charts/radar-chart.js";
const config={sales:{label:"Sales",color:"#733bff"}};
const rows=[{month:"Jan",sales:12}];
const line=<LineChart data={rows} config={config} aria-label="Sales" xDataKey={row=>row.month} series={[{seriesKey:"sales",dataKey:row=>row.sales}]} ref={createRef<SVGSVGElement>()}/>;
const area=<AreaChart data={rows} config={config} legend={{}} rootProps={{ref:createRef<HTMLDivElement>(),visibleSeries:["sales"],onVisibleSeriesChange:next=>void next}} aria-label="Sales"/>;
// @ts-expect-error Controlled and defaulted state remain exclusive across the editable frame.
const invalid=<AreaChart config={config} rootProps={{visibleSeries:["sales"],defaultVisibleSeries:["sales"]}}/>;
// @ts-expect-error A callback alone cannot own Root visibility.
const callbackOnly=<AreaChart config={config} rootProps={{onVisibleSeriesChange:(_next:string[])=>{}}}/>;
// @ts-expect-error Radar selection still requires its controller callback.
const selected=<RadarChart data={rows} selectedSeries="sales"/>;
void [line,area,invalid,callbackOnly,selected];`,
  );
  const usage = JSON.parse(read("registry/usage.json"));
  for (const [name, source] of Object.entries(usage))
    write(
      `src/usage-${name}.tsx`,
      source
        .replaceAll('"@/components/charts/', '"./components/charts/')
        .replace(/(from "\.\/components\/charts\/[^".]+)(")/g, "$1.js$2"),
    );
  for (const name of Object.keys(usage)) {
    const alias = `Usage${name.replaceAll("-", "")}`;
    imports.push(`import { Dashboard as ${alias} } from "./usage-${name}.js";`);
    renders.push(
      `{selected === "installed-${name}" && <section className="chart-example" data-recipe="installed-${name}"><${alias} /></section>}`,
    );
  }
  write(
    "src/consumer.css",
    read("examples/shared/example.css") +
      "\n.chart-example {position:relative} .consumer-alternative {position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%)}\n",
  );
  write(
    "src/main.tsx",
    `import "./consumer.css";\nimport { createRoot } from "react-dom/client";\n${imports.join("\n")}\nconst selected = new URLSearchParams(location.search).get("recipe");\ncreateRoot(document.getElementById("root")!).render(<main>${renders.join("\n")}</main>);\n`,
  );
  await run("npm", ["run", "build"]);
  await run("npm", ["exec", "tsc", "--", "--module", "NodeNext", "--moduleResolution", "NodeNext"]);
  await run("npm", ["ls", "--all"]);
  const manual = path.join(docsRoot, "artifacts/registry-manual-consumer");
  rmSync(manual, { recursive: true, force: true });
  mkdirSync(manual, { recursive: true });
  const { cpSync } = await import("node:fs");
  for (const file of ["tsconfig.json", "index.html"])
    cpSync(path.join(root, file), path.join(manual, file));
  cpSync(path.join(root, "src"), path.join(manual, "src"), { recursive: true });
  // Discard CLI-installed modules; manual source comes directly from public JSON, as displayed in Manual.
  rmSync(path.join(manual, "src/components"), { recursive: true, force: true });
  for (const item of index.items)
    for (const file of JSON.parse(read(`public/r/${item.name}.json`)).files) {
      const target = path.join(manual, "src", file.target);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, file.content);
      assert.equal(
        read(target),
        read(path.join(root, "src", file.target)),
        "Manual and CLI installed source differ",
      );
    }
  const manualManifest = JSON.parse(read(path.join(root, "package.json")));
  manualManifest.dependencies["@kind-ui/charts"] = coreVersion;
  writeFileSync(path.join(manual, "package.json"), JSON.stringify(manualManifest, null, 2));
  await run("npm", ["install", "--no-audit", "--no-fund"], manual);
  await run("npm", ["run", "build"], manual);
  await run(
    "npm",
    ["exec", "tsc", "--", "--module", "NodeNext", "--moduleResolution", "NodeNext"],
    manual,
  );
  write(
    "registry-results.json",
    JSON.stringify(
      {
        coreVersion,
        publishedIntegrity,
        declarationModes: ["Bundler", "NodeNext"],
        productionBuild: true,
        manualInstall: true,
        officialColorFixture: Boolean(process.env.KIND_UI_SHADCN_COLORS_FILE),
        examples: Object.keys(bundles).length,
        items: evidence,
      },
      null,
      2,
    ),
  );
  console.log(
    `All ${evidence.length} reusable registry components, caller examples and variants installed with the actual shadcn CLI, typechecked and built against published npm.`,
  );
} finally {
  server.close();
}
