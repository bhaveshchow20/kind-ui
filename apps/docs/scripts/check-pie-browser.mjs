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
  assert.equal(
    await first
      .locator(".recharts-label-list text")
      .first()
      .evaluate((node) => getComputedStyle(node).fill),
    "rgb(255, 255, 255)",
  );
  await first.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { name: "Pie and Donut", exact: true }).click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(100);
  await page.screenshot({ path: `${artifact}/desktop.png` });
  assert.ok(
    await first
      .locator('[data-kind-ui="pie-sector"]')
      .first()
      .evaluate((node) => getComputedStyle(node).fill !== "none"),
  );
  await first.getByRole("combobox", { name: "Shape" }).click();
  await page.getByRole("option", { name: "Donut", exact: true }).click();
  await first.getByRole("tab", { name: "Code", exact: true }).click();
  assert.ok((await first.locator("pre").textContent()).includes('shape = "donut"'));
  const blockCopy = first.getByRole("button", { name: "Copy Text", exact: true });
  assert.equal(await blockCopy.count(), 1);
  await blockCopy.click();
  assert.equal(
    (await page.evaluate(() => navigator.clipboard.readText())).trim(),
    bundles.pie.variants.donut.source.trim(),
  );
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
    await page.getByRole("heading", { name: "Pie and Donut", exact: true }).click();
    await first.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${artifact}/mobile-${width}.png` });
    const before = await page.evaluate(() => scrollY);
    await first.locator(".recharts-wrapper").hover();
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(200);
    assert.ok(await page.evaluate((value) => scrollY > value, before));
  }
  const table = page.getByRole("region", { name: "Root props", exact: true });
  await table.scrollIntoViewIfNeeded();
  await table.hover();
  const beforeTable = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate((value) => scrollY > value, beforeTable));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await first.scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.getByRole("heading", { name: "Pie and Donut", exact: true }).click();
  await page.screenshot({ path: `${artifact}/text-200.png` });
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
  const touch = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const touchPage = await touch.newPage();
  await touchPage.goto(`${origin}/docs/components/pie/`);
  await touchPage.locator('[data-component="pie"] .recharts-wrapper').waitFor();
  const session = await touch.newCDPSession(touchPage);
  const initialTouchScroll = await touchPage.evaluate(() => scrollY);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 180, y: 610 }],
  });
  for (const y of [570, 520, 470, 420, 370])
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 180, y }],
    });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await touchPage.waitForTimeout(300);
  assert.ok(await touchPage.evaluate((value) => scrollY > value, initialTouchScroll));
  await touch.close();
  const compatibility = await context.newPage();
  await compatibility.goto(`${origin}/docs/components/line/`);
  await compatibility.locator(".recharts-line-curve").first().waitFor();
  await compatibility.locator('[data-component="line"]').getByRole("application").focus();
  await compatibility.keyboard.press("ArrowRight");
  await compatibility
    .locator('[data-component="line"] [data-kind-ui="chart-tooltip-item"]')
    .first()
    .waitFor();
  await compatibility.getByRole("button", { name: "Search", exact: false }).first().click();
  const search = compatibility.getByRole("dialog");
  await search.getByRole("combobox").fill("Pie");
  await search.getByText("Pie and Donut", { exact: true }).first().waitFor();
  await compatibility.keyboard.press("Escape");
  await compatibility.close();
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
          "chart wheel and touch scrolling",
          "table vertical scroll chaining",
          "Line tooltip and shell search compatibility",
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
