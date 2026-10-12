import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../../..");
const guide = await readFile(join(root, "apps/docs/content/docs/installation.mdx"), "utf8");
test("Installation keeps Core, Tailwind and CLI setup concise", () => {
  assert.deepEqual(
    [...guide.matchAll(/^### (.+)$/gm)].map((match) => match[1]),
    ["Install the package", "Configure Tailwind CSS v4", "Add a chart"],
  );
  assert.match(guide, /npm install @kind-ui\/charts@0\.5\.0 motion recharts/);
  assert.match(guide, /npx shadcn@latest add @kind-ui\/line-chart/);
  assert.match(guide, /npm install @kind-ui\/charts/);
  assert.match(guide, /@source "\.\.\/node_modules\/@kind-ui\/charts\/dist"/);
  assert.match(
    guide,
    /`\.\.\/\.\.\/node_modules\/@kind-ui\/charts\/dist` from `src\/app\/globals\.css`/,
  );
  assert.doesNotMatch(
    guide,
    /ChartExample|Build your first chart|MonthlyVisitorsChart|Use your own data|## Composition/,
  );
});

test("focused chart-frame docs type retains exclusive visibility ownership", async () => {
  const fixture = await mkdtemp(join(root, "apps/docs/.composition-guide-"));
  try {
    await writeFile(
      join(fixture, "ownership.tsx"),
      `
import type { ChartFrame } from "../lib/public-types.js";
const config = { sales: { label: "Sales", color: "#4477aa" } };
const base = { config, children: null, "aria-label": "Sales" };
const passive: ChartFrame = { ...base };
const readOnly: ChartFrame = { ...base, visibleSeries: ["sales"] };
const controlled: ChartFrame = { ...base, visibleSeries: ["sales"], onVisibleSeriesChange: (next: string[]) => void next };
const defaulted: ChartFrame = { ...base, defaultVisibleSeries: ["sales"], onVisibleSeriesChange: (next: string[]) => void next };
// @ts-expect-error Controlled and defaulted ownership are exclusive.
const mixed: ChartFrame = { ...base, visibleSeries: ["sales"], defaultVisibleSeries: ["sales"] };
// @ts-expect-error A visibility callback requires controlled or defaulted ownership.
const callbackOnly: ChartFrame = { ...base, onVisibleSeriesChange: (next: string[]) => void next };
void [passive, readOnly, controlled, defaulted, mixed, callbackOnly];
`,
    );
    for (const module of ["NodeNext", "ESNext"]) {
      await writeFile(
        join(fixture, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            strict: true,
            noEmit: true,
            jsx: "react-jsx",
            target: "ES2022",
            module,
            moduleResolution: module === "NodeNext" ? "NodeNext" : "Bundler",
            skipLibCheck: false,
            esModuleInterop: true,
            types: ["react", "react-dom"],
          },
          files: ["ownership.tsx"],
        }),
      );
      const result = spawnSync(
        process.execPath,
        [join(root, "node_modules/typescript/bin/tsc"), "-p", fixture],
        { encoding: "utf8" },
      );
      assert.equal(result.status, 0, `${module}: ${result.stdout}${result.stderr}`);
    }
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
