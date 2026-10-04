import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const npm = process.env.npm_execpath;
assert.ok(npm, "Run npm run check:next after npm run pack:artifact");
const artifactDir = join(root, "artifacts/package");
const proofFile = join(artifactDir, "next-consumer.json");
await rm(proofFile, { force: true });
const receipt = JSON.parse(await readFile(join(artifactDir, "validated-artifact.json"), "utf8"));
assert.equal(receipt.filename, basename(receipt.filename));
const tarball = join(artifactDir, receipt.filename);
function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
assert.equal(
  digest(await readFile(tarball)),
  receipt.sha256,
  "Retained candidate checksum mismatch",
);
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const names = [
  "next",
  "react",
  "react-dom",
  "react-is",
  "recharts",
  "motion",
  "typescript",
  "@types/react",
  "@types/react-dom",
  "@types/node",
];
const versions = Object.fromEntries(names.map((name) => [name, manifest.devDependencies[name]]));
for (const name of names) assert.match(versions[name], /^\d+\.\d+\.\d+$/, `${name} must be pinned`);
const consumer = await mkdtemp(join(tmpdir(), "kind-ui-next-"));
let server;
let browser;
let serverOutput = "";
function run(args) {
  return execFileSync(process.execPath, args, {
    cwd: consumer,
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
    env: { ...process.env, NODE_PATH: "", NEXT_TELEMETRY_DISABLED: "1" },
    timeout: 240_000,
  });
}
try {
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  run([
    npm,
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--workspaces=false",
    "--package-lock=false",
    tarball,
    ...names.map((name) => `${name}@${versions[name]}`),
  ]);
  assert.equal(
    await realpath(join(consumer, "node_modules/@kind-ui/charts")),
    join(await realpath(consumer), "node_modules/@kind-ui/charts"),
  );
  await cp(join(root, "tests/fixtures/next/app"), join(consumer, "app"), { recursive: true });
  await writeFile(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "es2022"],
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        plugins: [{ name: "next" }],
      },
      include: ["next-env.d.ts", "app/**/*.tsx", ".next/types/**/*.ts"],
    }),
  );
  // No transpilePackages, workspace links, copied library code or SSR opt-out.
  await writeFile(join(consumer, "next.config.mjs"), "export default {};\n");
  const next = join(consumer, "node_modules/next/dist/bin/next");
  console.log(run([next, "build"]));
  const portProbe = createServer();
  await new Promise((resolve) => portProbe.listen(0, "127.0.0.1", resolve));
  const port = portProbe.address().port;
  await new Promise((resolve, reject) =>
    portProbe.close((error) => (error ? reject(error) : resolve())),
  );
  const url = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [next, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: consumer,
      env: { ...process.env, NODE_PATH: "", NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout.on("data", (data) => {
    serverOutput += data;
  });
  server.stderr.on("data", (data) => {
    serverOutput += data;
  });
  server.on("error", (error) => {
    serverOutput += error.message;
  });
  let response;
  for (let attempt = 0; attempt < 150; attempt++) {
    assert.equal(server.exitCode, null, serverOutput);
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(response?.ok, `Next server did not become ready: ${serverOutput}`);
  const html = await response.text();
  assert.match(html, /Packed chart App Router consumer/);
  assert.match(html, /Tasks data/);
  browser = await chromium.launch(
    process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(url);
  const section = page.getByRole("region", { name: "Interactive chart" });
  await section.getByRole("button", { name: "Tasks: 12", exact: true }).click();
  await section.getByRole("button", { name: "Tasks: 13", exact: true }).waitFor();
  await page.locator(".recharts-line-curve").first().waitFor();
  assert.ok((await section.locator('[data-kind-ui="chart-icon"] > svg').count()) > 0);
  const legend = section.getByRole("button", { name: "Tasks", exact: true });
  assert.equal(await legend.getAttribute("aria-pressed"), "true");
  await legend.click();
  await page.waitForFunction(() =>
    document.querySelector('section[aria-label="Interactive chart"] button[aria-pressed="false"]'),
  );
  assert.deepEqual(errors, [], "Browser must hydrate and interact without console/page errors");
  assert.equal(
    digest(await readFile(tarball)),
    receipt.sha256,
    "Candidate changed during Next validation",
  );
  await mkdir(artifactDir, { recursive: true });
  await writeFile(
    proofFile,
    `${JSON.stringify({ sha256: receipt.sha256, versions, checks: ["App Router production build", "server HTML/data alternative", "hydration", "state update", "controlled legend", "native SVG icon"] }, null, 2)}\n`,
  );
  console.log(
    `Installed tarball Next ${versions.next}: production App Router, SSR shell, hydration and interaction passed`,
  );
} finally {
  await browser?.close();
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill("SIGTERM");
    const killTimer = setTimeout(() => server.kill("SIGKILL"), 5000);
    await exited;
    clearTimeout(killTimer);
  }
  await rm(consumer, { recursive: true, force: true });
}
