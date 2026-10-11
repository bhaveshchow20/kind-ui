import { createServer } from "node:http";
import { serveRegistry } from "./registry/server.mjs";

const port = Number(process.env.KIND_REGISTRY_PORT || 6374);
createServer((request, response) => {
  if (!serveRegistry(request, response)) {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Registry preview: http://127.0.0.1:${port}/r/`));
