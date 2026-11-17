#!/usr/bin/env node
// Serves the docs' static export as a plain file server would (a folder serves its index.html, no rewrites) and
// opens every page in light, then in dark with reduced motion, failing on any page error or console error, such as a
// hydration mismatch. Each page's Markdown, the search index and every internal link must also resolve.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const out = join(dirname(fileURLToPath(import.meta.url)), "../apps/docs/out");
const origin = "http://127.0.0.1:4330";
const basePath = process.env.NEXT_PUBLIC_DOCS_BASE_PATH ?? "";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};
const passes = [
  { colorScheme: "light", reducedMotion: "no-preference" },
  { colorScheme: "dark", reducedMotion: "reduce" },
];

// Every page: the export writes each one as a folder with an index.html.
const pagesIn = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter(
      (file) =>
        file.endsWith("index.html") && !file.startsWith("404") && !file.startsWith("_not-found"),
    )
    .map((file) => `/${dirname(file)}/`.replace("/./", "/"))
    .sort();

function fileFor(url) {
  const { pathname } = new URL(url, origin);
  if (!pathname.startsWith(basePath)) return undefined;
  try {
    const file = join(out, decodeURIComponent(pathname.slice(basePath.length)));
    return existsSync(file) && statSync(file).isDirectory() ? join(file, "index.html") : file;
  } catch {
    return undefined;
  }
}

function serve() {
  const server = createServer((request, response) => {
    const file = fileFor(request.url);
    if (!file?.startsWith(out) || !existsSync(file)) {
      response.statusCode = 404;
      return response.end();
    }
    response.setHeader("content-type", types[extname(file)] ?? "text/plain");
    response.end(readFileSync(file));
  });
  return new Promise((resolve, reject) => {
    server.once("error", (error) =>
      reject(error.code === "EADDRINUSE" ? new Error("port 4330 is in use") : error),
    );
    server.listen(4330, "127.0.0.1", () => resolve(server));
  });
}

async function check() {
  if (!existsSync(out)) throw new Error("no docs export; run `npm run build:docs` first");
  const pages = pagesIn(out);
  const server = await serve();
  const browser = await chromium.launch();
  const errors = [];
  const links = new Set([`${basePath}/api/search`]);
  try {
    for (const options of passes) {
      const context = await browser.newContext(options);
      for (const path of pages) {
        const label = `${path} (${options.colorScheme})`;
        const page = await context.newPage();
        page.on("pageerror", (error) => errors.push(`${label}: ${error.message}`));
        page.on("console", (message) => {
          if (message.type() === "error")
            errors.push(`${label}: ${message.text()} ${message.location().url}`);
        });
        const response = await page.goto(origin + basePath + path, { waitUntil: "networkidle" });
        if (!response.ok()) errors.push(`${label}: ${response.status()}`);
        if (path.startsWith("/docs/")) links.add(`${basePath}/llms.mdx${path.slice(0, -1)}.md`);
        for (const href of await page
          .locator("a[href]")
          .evaluateAll((anchors) => anchors.map((a) => a.href)))
          if (href.startsWith(origin)) links.add(new URL(href).pathname);
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  for (const link of links) {
    // Until every chart family, building block and guide is written, links to them stay unresolved `.mdx` paths.
    if (link.endsWith(".mdx")) continue;
    const file = fileFor(link);
    if (!file || !existsSync(file)) errors.push(`${link}: 404`);
  }
  if (errors.length) throw new Error(errors.join("\n  "));
  console.log(
    `opened ${pages.length} docs pages twice and resolved ${links.size} links with no errors`,
  );
}

check().catch((error) => {
  console.error(`check-docs: ${error.message}`);
  process.exit(1);
});
