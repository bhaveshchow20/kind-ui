import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const html = readdirSync(root, { recursive: true }).filter(
  (file) => String(file).endsWith(".html") && !String(file).startsWith("examples/"),
);
const missing = new Set();
let links = 0;
for (const file of html) {
  const body = readFileSync(path.join(root, file), "utf8");
  for (const match of body.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const url = decodeURIComponent(match[1]);
    if (url.startsWith("//")) continue;
    const target = path.join(root, url);
    if (
      !existsSync(target) ||
      (statSync(target).isDirectory() && !existsSync(path.join(target, "index.html")))
    )
      missing.add(`${file}: ${url}`);
    links++;
  }
}
const index = readFileSync(path.join(root, "llms.txt"), "utf8");
if (!index.includes("aa7fe56"))
  throw new Error("Agent index does not identify the approved package snapshot");
for (const file of readdirSync(path.join(root, "markdown"), { recursive: true }).filter((name) =>
  String(name).endsWith(".md"),
)) {
  const body = readFileSync(path.join(root, "markdown", file), "utf8");
  if (/<(?:ComponentPlayground|ApiTable|Snapshot)\b/.test(body))
    throw new Error(`Unresolved MDX in ${file}`);
}
if (missing.size) throw new Error([...missing].join("\n"));
console.log(
  `${html.length} exported HTML routes and ${links} local asset/page links passed; clean Markdown and synchronized agent index passed.`,
);
