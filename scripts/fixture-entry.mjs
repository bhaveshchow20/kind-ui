import { writeFile } from "node:fs/promises";
import { join } from "node:path";

/** @param {string} directory @param {string} name @param {string} module */
export async function writeFixtureEntry(directory, name, module) {
  await writeFile(
    join(directory, `${name}-entry.tsx`),
    `import { createRoot } from "react-dom/client";
import Fixture from "${module}";
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(<Fixture />);
`,
  );
  await writeFile(
    join(directory, `${name}.html`),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Chart regression fixture</title></head><body><div id="root"></div><script type="module" src="./${name}-entry.tsx"></script></body></html>`,
  );
}
