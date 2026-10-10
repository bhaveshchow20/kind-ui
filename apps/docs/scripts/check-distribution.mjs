import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { basePath, docRoute, publicPath } from "../lib/routing.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
const failures = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(error.message));
  const visit = (slug) => page.goto(`${origin}${basePath}${docRoute(`/docs/${slug}/`)}`);
  await visit("components/line");
  const workbench = page.locator('[data-component="line"]');
  await workbench.locator(".recharts-line-curve").first().waitFor();
  const svg = await workbench.locator("svg.recharts-surface").elementHandle();
  const distribution = page.getByRole("combobox", { name: "Chart distribution" });
  await distribution.focus();
  await page.keyboard.press("s");
  await page.keyboard.press("Enter");
  if ((await distribution.inputValue()) !== "shadcn") await distribution.selectOption("shadcn");
  assert.equal(
    await svg.evaluate((node) => node.isConnected),
    true,
    "Switching distribution remounted the chart",
  );
  await workbench.getByRole("tab", { name: "Code", exact: true }).click();
  const code = await workbench.locator(".code-files").innerText();
  assert.ok(code.includes(`${origin}${publicPath("/r/kind-line.json")}`));
  assert.ok(code.includes("@/components/charts/line/example"));
  await visit("components/area");
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Chart distribution"]').value === "shadcn",
  );
  assert.equal(
    await page.getByRole("combobox", { name: "Chart distribution" }).inputValue(),
    "shadcn",
  );
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Chart distribution"]').value === "shadcn",
  );
  await visit("installation");
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Chart distribution"]').value === "shadcn",
  );
  assert.ok(
    (await page.locator("#docs-content").innerText()).includes(
      "@/components/charts/line-start/example",
    ),
  );
  assert.ok((await page.locator("#docs-content").innerText()).includes("kind-line-start.json"));
  await page.getByRole("combobox", { name: "Chart distribution" }).selectOption("npm");
  assert.ok((await page.locator("#docs-content").innerText()).includes('"./MonthlyVisitorsChart"'));
  const response = await page.request.get(`${origin}${publicPath("/r/registry.json")}`);
  assert.equal(response.status(), 200);
  assert.equal((await response.json()).items.length, 51);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(failures, []);
  mkdirSync("artifacts/registry", { recursive: true });
  await page.screenshot({ path: "artifacts/registry/distribution-mobile.png", fullPage: true });
  writeFileSync(
    "artifacts/registry/distribution.json",
    JSON.stringify(
      {
        basePath,
        selectionPersists: true,
        previewPreserved: true,
        commands: true,
        usage: true,
        mobile: true,
        hydrationErrors: failures,
      },
      null,
      2,
    ),
  );
  console.log(
    "Distribution commands, imports, persistence, unchanged preview, mobile and hydration passed.",
  );
} finally {
  await browser.close();
}
