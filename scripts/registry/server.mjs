import { readFileSync } from "node:fs";
import path from "node:path";
import { registryOutput } from "../build-registry.mjs";

export function serveRegistry(request, response, root = path.join(registryOutput, "public/r")) {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname !== "/r" && !pathname.startsWith("/r/")) return false;
  const name = pathname === "/r" || pathname === "/r/" ? "registry.json" : pathname.slice(3);
  try {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(name)) throw new Error("Invalid item name");
    const body = readFileSync(path.join(root, name));
    response.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  }
  return true;
}
