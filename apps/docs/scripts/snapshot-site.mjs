import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination))
  throw new Error("Supply an absolute generated snapshot directory");
if (!existsSync("out/index.html")) throw new Error("Build the static docs export first");
mkdirSync(destination, { recursive: true });
const output = path.join(destination, "out");
rmSync(output, { recursive: true, force: true });
cpSync("out", output, { recursive: true });
const manifestPath = path.join(destination, ".openai", "hosting.json");
mkdirSync(path.dirname(manifestPath), { recursive: true });
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
writeFileSync(
  manifestPath,
  `${JSON.stringify({ ...manifest, static: { directory: "out" } }, null, 2)}\n`,
);
const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const packageInfo = JSON.parse(readFileSync("vendor/provenance.json", "utf8"));
writeFileSync(
  path.join(destination, "provenance.json"),
  `${JSON.stringify(
    {
      editableSource: "https://github.com/bhaveshchow20/kind-ui",
      appPath: "apps/docs",
      sourceCommit: commit,
      package: packageInfo,
      generator: "npm run build; npm run snapshot:site -- <absolute-directory>",
      generatedSnapshot: true,
    },
    null,
    2,
  )}\n`,
);
writeFileSync(
  path.join(destination, "README.md"),
  "# Generated Kind UI docs deployment\n\nThis checkout is a static deployment snapshot, not a second editable app. Edit apps/docs in the Kind UI GitHub branch, verify it, build it and regenerate this snapshot. Preserve this checkout's .git and .openai Site identity. See provenance.json for source and package pins.\n",
);
console.log(`Generated static deployment snapshot at ${destination}`);
