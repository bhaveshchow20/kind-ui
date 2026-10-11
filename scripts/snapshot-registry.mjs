import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { registryOutput } from "./build-registry.mjs";

const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination))
  throw new Error("Supply an absolute generated site snapshot directory");
const source = path.join(registryOutput, "public/r");
if (!existsSync(path.join(source, "registry.json")))
  throw new Error("Run npm run build:registry first");
const target = path.join(destination, "out/r");
// Merge only registry JSON into an existing domain-root static export.
// Preserve its hosting identity, homepage, docs, and every other asset.
mkdirSync(target, { recursive: true });
for (const file of readdirSync(target)) if (file.endsWith(".json")) rmSync(path.join(target, file));
cpSync(source, target, { recursive: true });
console.log(
  `Registry copied to ${target}; the domain-root host must serve /r/ from this directory.`,
);
