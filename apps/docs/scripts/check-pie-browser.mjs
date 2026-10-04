import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const origin = "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/pie-examples.json", "utf8"));
const artifact = "artifacts/pie";
mkdirSync(artifact, { recursive: true });
const browser = await chromium.launch(
  process.env.KIND_BROWSER_EXECUTABLE
    ? { executablePath: process.env.KIND_BROWSER_EXECUTABLE }
    : {},
);
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(`${origin}/docs/components/pie/`);
  const first = page.locator('[data-component="pie"]');
  await first.locator('[data-kind-ui="pie-sector"]').first().waitFor();
  await page.waitForTimeout(1200);
  assert.equal(await first.locator('[data-kind-ui="pie-sector"]').count(), 4);
  assert.deepEqual(await first.locator(".recharts-label-list text").allTextContents(), [
    "42%",
    "31%",
    "17%",
    "10%",
  ]);
  await page.screenshot({ path: `${artifact}/desktop.png`, fullPage: true });
  await first.getByRole("combobox", { name: "Shape" }).click();
  await page.getByRole("option", { name: "Donut", exact: true }).click();
  await first.getByRole("tab", { name: "Code", exact: true }).click();
  assert.ok((await first.locator("pre").textContent()).includes('shape = "donut"'));
  const blockCopy = first.getByRole("button", { name: "Copy Text", exact: true });
  if (await blockCopy.count()) {
    await blockCopy.click();
    assert.equal(
      (await page.evaluate(() => navigator.clipboard.readText())).trim(),
      bundles.pie.variants.donut.source.trim(),
    );
  }
  await first.getByRole("button", { name: "Copy prompt", exact: true }).click();
  assert.ok(
    (await page.evaluate(() => navigator.clipboard.readText())).includes(
      "/examples/pie/variants/donut/example.tsx",
    ),
  );
  const viewport = first.locator(".line-code-viewport");
  await viewport.evaluate((node) => {
    node.scrollTop = 0;
  });
  await viewport.hover();
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(200);
  assert.ok(await viewport.evaluate((node) => node.scrollTop > 0));
  await viewport.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  const beforeCodeEdge = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate((before) => scrollY > before, beforeCodeEdge));
  await first.getByRole("tab", { name: "Preview", exact: true }).click();
  await first.scrollIntoViewIfNeeded();
  await first.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await first.locator('[data-kind-ui="chart-tooltip-item"]').first().waitFor();
  assert.match(
    await first.locator('[data-kind-ui="chart-tooltip"]').textContent(),
    /(Design|Engineering|Operations|Research).*hours/,
  );
  await page.keyboard.press("Escape");
  const visible = page.locator('[data-component="pie-visibility"]');
  const design = visible.getByRole("button", { name: "Design", exact: true });
  await design.focus();
  await page.keyboard.press("Space");
  assert.equal(await design.getAttribute("aria-pressed"), "false");
  assert.equal(await visible.locator('[data-kind-ui="pie-sector"]').count(), 3);
  assert.ok(
    (await visible.getByRole("status").allTextContents()).join().includes("580 hours selected"),
  );
  for (const name of ["Engineering", "Operations", "Research"])
    await visible.getByRole("button", { name, exact: true }).click();
  assert.equal(await visible.locator('[data-kind-ui="pie-sector"]').count(), 0);
  assert.ok(
    (await visible.getByRole("status").allTextContents()).join().includes("0 hours selected"),
  );
  await design.click();
  assert.equal(await visible.locator('[data-kind-ui="pie-sector"]').count(), 1);
  const materials = page.locator('[data-component="pie-materials"]');
  await materials.getByRole("combobox", { name: "Material" }).click();
  await page.getByRole("option", { name: "Glow", exact: true }).click();
  await materials.locator('[data-kind-ui="pie-halo"]').first().waitFor();
  await materials.getByRole("tab", { name: "Code", exact: true }).click();
  assert.ok((await materials.locator("pre").textContent()).includes('material = "glow"'));
  await materials.getByRole("tab", { name: "Preview", exact: true }).click();
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 812 });
    await first.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `${artifact}/mobile-${width}.png`, fullPage: true });
    const before = await page.evaluate(() => scrollY);
    await first.locator(".recharts-wrapper").hover();
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(200);
    assert.ok(await page.evaluate((value) => scrollY > value, before));
  }
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await first.scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `${artifact}/text-200.png`, fullPage: true });
  const reduced = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(`${origin}/docs/components/pie/`);
  await reducedPage.locator('[data-component="pie"] [data-kind-ui="pie-sector"]').first().waitFor();
  assert.equal(
    await reducedPage.locator('[data-kind-ui="pie-sector"][data-reveal="on"]').count(),
    0,
  );
  await reduced.close();
  assert.deepEqual(errors, []);
  writeFileSync(
    `${artifact}/browser-results.json`,
    JSON.stringify(
      {
        status: "passed",
        widths: [1440, 320, 375],
        textScale: "200%",
        reducedMotion: true,
        interactions: [
          "shape/source/copy parity",
          "tooltip keyboard identity",
          "legend keyboard filtering and empty selection",
          "material/source parity",
          "code internal scroll and edge chaining",
          "chart wheel scrolling",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("Pie scoped browser checks passed");
} finally {
  await context.close();
  await browser.close();
}
