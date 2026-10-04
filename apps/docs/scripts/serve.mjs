import { readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve("out");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".tgz": "application/gzip",
};
const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
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
server.listen(6373, "127.0.0.1", () => console.log("Docs static preview: http://127.0.0.1:6373"));
