import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../../..");
const guide = await readFile(join(root, "apps/docs/content/docs/installation.mdx"), "utf8");
const examples = [...guide.matchAll(/```tsx title="(Dashboard.tsx)"\n([\s\S]*?)```/g)];

test("Installation renders its exact first-chart example in an application", async () => {
  assert.deepEqual(
    examples.map((example) => example[1]),
    ["Dashboard.tsx"],
  );
  const fixture = await mkdtemp(join(root, "apps/docs/.composition-guide-"));
  try {
    for (const [index, example] of examples.entries()) {
      assert.match(example[2], /MonthlyVisitorsChart/);
      await writeFile(
        join(fixture, `example-${index}.tsx`),
        example[2].replace("./MonthlyVisitorsChart", "./MonthlyVisitorsChart.js"),
      );
    }
    await writeFile(
      join(fixture, "MonthlyVisitorsChart.tsx"),
      await readFile(join(root, "apps/docs/examples/line-start/example.tsx"), "utf8"),
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
            types: ["react", "react-dom"],
          },
          include: ["*.tsx"],
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

test("focused Root docs type retains exclusive visibility ownership", async () => {
  const fixture = await mkdtemp(join(root, "apps/docs/.composition-guide-"));
  try {
    await writeFile(
      join(fixture, "ownership.tsx"),
      `
import type { Root } from "../lib/public-types.js";
const config = { sales: { label: "Sales", color: "#4477aa" } };
const passive: Root = { config };
const readOnly: Root = { config, visibleSeries: ["sales"] };
const controlled: Root = { config, visibleSeries: ["sales"], onVisibleSeriesChange: (next: string[]) => void next };
const defaulted: Root = { config, defaultVisibleSeries: ["sales"], onVisibleSeriesChange: (next: string[]) => void next };
// @ts-expect-error Controlled and defaulted ownership are exclusive.
const mixed: Root = { config, visibleSeries: ["sales"], defaultVisibleSeries: ["sales"] };
// @ts-expect-error A visibility callback requires controlled or defaulted ownership.
const callbackOnly: Root = { config, onVisibleSeriesChange: (next: string[]) => void next };
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
