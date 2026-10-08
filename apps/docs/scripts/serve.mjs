import { readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

import { basePath } from "../lib/routing.mjs";

const root = path.resolve("out");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".tgz": "application/gzip",
};
const server = createServer((request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (basePath) {
      if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) throw new Error();
      pathname = pathname.slice(basePath.length) || "/";
    }
    let file = path.resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) throw new Error();
    if (statSync(file).isDirectory()) file = path.join(file, "index.html");
    response.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
    response.end(readFileSync(file));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  }
});
const port = Number(process.env.KIND_DOCS_PORT || 6373);
server.listen(port, "127.0.0.1", () =>
  console.log(`Docs static preview: http://127.0.0.1:${port}${basePath}/`),
);
