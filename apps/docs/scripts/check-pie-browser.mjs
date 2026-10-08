import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
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
  const categoryColors = [
    "rgb(115, 59, 255)",
    "rgb(36, 105, 212)",
    "rgb(182, 92, 22)",
    "rgb(20, 124, 104)",
  ];
  const fills = (card) =>
    card
      .locator('[data-kind-ui="pie-sector"]')
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill));
  assert.deepEqual(await fills(first), categoryColors);

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
  assert.deepEqual(await fills(visible), categoryColors.slice(1));
  assert.ok(
    (await visible.getByRole("status").allTextContents()).join().includes("580 hours selected"),
  );
  for (const name of ["Engineering", "Operations"])
    await visible.getByRole("button", { name, exact: true }).click();
  const research = visible.getByRole("button", { name: "Research", exact: true });
  const root = visible.locator('[data-kind-ui="chart"]').first();
  const sectors = visible.locator('[data-kind-ui="pie-sector"]');
  const paint = () =>
    sectors.evaluateAll((nodes) =>
      nodes.map((node) => ({
        path: node.getAttribute("d"),
        fill: getComputedStyle(node).fill,
        stroke: getComputedStyle(node).stroke,
        opacity: getComputedStyle(node).opacity,
      })),
    );
  await expect(sectors).toHaveCount(1);
  await expect.poll(() => fills(visible)).toEqual([categoryColors[3]]);
  const before = await paint();
  const callbacks = await root.getAttribute("data-visibility-changes");
  const feedback = root.locator('[data-kind-ui="chart-interaction-status"]');
  for (let attempt = 0; attempt < 2; attempt++) {
    const previous = await feedback.locator("span").elementHandle();
    assert.ok(previous, "Missing scoped interaction feedback");
    await research.focus();
    await page.keyboard.press("Space");
    await expect(research).toBeFocused();
    await expect(research).toHaveAttribute("aria-pressed", "true");
    await expect(feedback).toHaveText("At least one item must remain visible.");
    await expect.poll(() => previous.evaluate((node) => node.isConnected)).toBe(false);
    await previous.dispose();
    await expect.poll(paint).toEqual(before);
    await expect(root).toHaveAttribute("data-visibility-changes", callbacks);
    assert.ok(
      (await visible.getByRole("status").allTextContents()).join().includes("100 hours selected"),
    );
  }
  await expect(visible.getByRole("button", { name: /all categories/ })).toHaveCount(0);
  const rounded = page.locator('[data-component="pie-rounded"]');
  await rounded.scrollIntoViewIfNeeded();
  const geometryPaths = [];
  for (const [label, value] of [
    ["Rounded donut", "rounded-donut"],
    ["Rounded pie", "rounded-pie"],
    ["Petal donut", "petal-donut"],
  ]) {
    await rounded.getByRole("combobox", { name: "Geometry" }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
    const sectors = rounded.locator('[data-kind-ui="pie-sector"]');
    assert.equal(await sectors.count(), 4);
    const paths = await sectors.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    assert.ok(paths.every((path) => path && !/NaN|Infinity/.test(path)));
    geometryPaths.push(paths);
    assert.deepEqual(await fills(rounded), categoryColors);
    assert.equal(await rounded.locator("table").first().locator("tbody tr").count(), 4);
    await rounded.getByRole("application").focus();
    await page.keyboard.press("ArrowRight");
    await rounded.locator('[data-kind-ui="chart-tooltip-item"]').first().waitFor();
    assert.match(await rounded.locator('[data-kind-ui="chart-tooltip"]').textContent(), /hours/);
    await page.keyboard.press("Escape");
    await rounded.getByRole("tab", { name: "Code", exact: true }).click();
    assert.ok((await rounded.locator("pre").textContent()).includes(`geometry = "${value}"`));
    await rounded.getByRole("tab", { name: "Preview", exact: true }).click();
  }
  assert.notDeepEqual(geometryPaths[0], geometryPaths[1]);
  assert.notDeepEqual(geometryPaths[0], geometryPaths[2]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.deepEqual(
    await rounded
      .locator('[data-kind-ui="pie-sector"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
    geometryPaths[2],
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const materials = page.locator('[data-component="pie-materials"]');
  await materials.getByRole("combobox", { name: "Material" }).click();
  await page.getByRole("option", { name: "Glow", exact: true }).click();
  await materials.locator('[data-kind-ui="pie-halo"]').first().waitFor();
  await materials.getByRole("tab", { name: "Code", exact: true }).click();
  assert.ok((await materials.locator("pre").textContent()).includes('appearance = "glow"'));
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
  const table = page.getByRole("region", { name: "PieChart props", exact: true });
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
