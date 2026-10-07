import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import { swipeUp } from "./touch-swipe.mjs";

const origin = "http://127.0.0.1:6373";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
});
mkdirSync("artifacts/box-plot", { recursive: true });
const bundles = JSON.parse(readFileSync("generated/all-examples.json", "utf8"));
const evidence = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/docs/components/box-plot/`);
  const first = page.locator('[data-component="box-plot"]');
  await first.locator('[data-kind-ui="box-plot-mark"]').first().waitFor();
  assert.equal(await first.locator('[data-kind-ui="box-plot-mark"]').count(), 3);
  assert.equal(await first.locator('[data-box-part="outlier"]').count(), 3);
  assert.equal(await first.locator('[data-kind-ui="bar-reveal"]').count(), 0);
  const geometry = await first
    .locator('[data-kind-ui="box-plot-mark"]')
    .first()
    .evaluate((mark) => {
      const whisker = mark.querySelector('[data-box-part="whisker"]');
      const box = mark.querySelector('[data-box-part="box"]');
      const median = mark.querySelector('[data-box-part="median"]');
      const outlier = mark.querySelector('[data-box-part="outlier"]');
      return {
        lower: Number(whisker.getAttribute("y1")),
        upper: Number(whisker.getAttribute("y2")),
        boxHeight: Number(box.getAttribute("height")),
        median: Number(median.getAttribute("y1")),
        outlier: Number(outlier.getAttribute("cy")),
      };
    });
  assert.ok(Math.abs(geometry.boxHeight / (geometry.lower - geometry.upper) - 29 / 66) < 0.001);
  assert.ok(
    Math.abs((geometry.lower - geometry.median) / (geometry.lower - geometry.upper) - 26 / 66) <
      0.001,
  );
  assert.ok(geometry.outlier < geometry.upper);
  const surface = first.locator(".recharts-surface");
  await surface.focus();
  await page.keyboard.press("ArrowRight");
  const tooltip = first.locator('[data-kind-ui="chart-tooltip"]');
  await tooltip.waitFor();
  await expect(tooltip).toHaveText(
    /Lower whisker[\s\S]*Q1[\s\S]*Median[\s\S]*Q3[\s\S]*Upper whisker[\s\S]*Outlier/,
    { useInnerText: true },
  );
  await page.keyboard.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
  assert.equal(await first.locator("table tbody tr").count(), 3);
  assert.equal(await first.locator('[data-kind-ui="chart-legend"] button').count(), 0);
  await first.screenshot({ path: "artifacts/box-plot/desktop.png" });
  await page.screenshot({ path: "artifacts/box-plot/desktop-page.png" });
  await first.getByRole("tab", { name: "Preview", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(100);
  assert.equal(
    await first.getByRole("tab", { name: "Code", exact: true }).getAttribute("aria-selected"),
    "true",
  );
  const codeViewport = first.locator(".line-code-viewport");
  const codeBox = await codeViewport.boundingBox();
  const chartHeight = await first
    .locator(".preview-panel")
    .evaluate((node) => node.getBoundingClientRect().height);
  const codePanelHeight = await first
    .locator(".code-files")
    .evaluate((node) => node.getBoundingClientRect().height);
  assert.ok(Math.abs(codePanelHeight - chartHeight) < 2, "Preview and Code panel heights differ");
  assert.ok(
    codeBox.height > 200 && codeBox.height < chartHeight,
    "Code viewport must fit inside the matched panel",
  );
  await page.mouse.move(codeBox.x + codeBox.width / 2, codeBox.y + codeBox.height / 2);
  const codePageBefore = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(300);
  assert.ok((await codeViewport.evaluate((node) => node.scrollTop)) > 50);
  assert.equal(await page.evaluate(() => scrollY), codePageBefore);
  await codeViewport.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await page.waitForTimeout(200);
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(350);
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(350);
  assert.ok((await page.evaluate(() => scrollY)) > codePageBefore + 50);
  await first.getByRole("tab", { name: "Preview", exact: true }).click();
  const edge = page.locator('[data-component="box-plot-edge-cases"]');
  await edge.scrollIntoViewIfNeeded();
  await edge.locator('[data-kind-ui="box-plot-mark"]').first().waitFor({ state: "attached" });
  assert.equal(await edge.locator('[data-kind-ui="box-plot-mark"]').count(), 3);
  assert.equal(await edge.locator('[data-box-part="collapsed-box"]').count(), 2);
  assert.equal(await edge.locator('[data-box-part="outlier"]').count(), 2);
  assert.match(await edge.locator("table").innerText(), /Missing summary; no mark/);
  await edge.screenshot({ path: "artifacts/box-plot/edge-cases.png" });
  const horizontal = page.locator('[data-component="box-plot-horizontal"]');
  await horizontal.scrollIntoViewIfNeeded();
  await horizontal.locator('[data-kind-ui="box-plot-mark"]').first().waitFor();
  const h = await horizontal
    .locator('[data-kind-ui="box-plot-mark"]')
    .first()
    .evaluate((mark) => {
      const line = mark.querySelector('[data-box-part="whisker"]');
      const box = mark.querySelector('[data-box-part="box"]');
      return {
        lower: Number(line.getAttribute("x1")),
        upper: Number(line.getAttribute("x2")),
        width: Number(box.getAttribute("width")),
      };
    });
  assert.ok(Math.abs(h.width / (h.upper - h.lower) - 29 / 66) < 0.001);
  const materials = page.locator('[data-component="box-plot-materials"]');
  await materials.scrollIntoViewIfNeeded();
  for (const [value, label] of [
    ["glow", "Glow"],
    ["clay", "Clay"],
    ["plain", "Plain"],
    ["paper", "Paper"],
  ]) {
    await materials.getByRole("combobox", { name: "Material" }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
    if (value === "plain")
      assert.equal(await materials.locator('[data-kind-ui="box-material"]').count(), 0);
    else
      assert.equal(
        await materials.locator(`[data-kind-ui="box-material"][data-material="${value}"]`).count(),
        3,
      );
    await materials.getByRole("tab", { name: "Code", exact: true }).click();
    const code = await materials.locator("pre").innerText();
    assert.equal(
      code.replace(/\s+/g, ""),
      bundles["box-plot-materials"].variants[value].source.replace(/\s+/g, ""),
    );
    await materials.getByRole("tab", { name: "Preview", exact: true }).click();
  }
  await materials.screenshot({ path: "artifacts/box-plot/materials.png" });
  const materialSelect = materials.getByRole("combobox", { name: "Material" });
  await materialSelect.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  assert.ok(await materialSelect.evaluate((node) => node === document.activeElement));
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await materials.getByRole("button", { name: "Copy prompt", exact: true }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(prompt, /docs\/components\/box-plot\//);
  assert.match(prompt, /variants\/paper\/example.tsx/);
  const linkedSource = await (
    await page.request.get(`${origin}/examples/box-plot-materials/variants/paper/example.tsx`)
  ).text();
  assert.equal(linkedSource, bundles["box-plot-materials"].variants.paper.source);
  for (const region of [page.locator("#nd-toc"), page.locator(".line-props-scroll").first()]) {
    await region.scrollIntoViewIfNeeded();
    await region.hover();
    const scrollBefore = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 250);
    await page.waitForTimeout(300);
    assert.ok((await page.evaluate(() => scrollY)) > scrollBefore + 50);
  }
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/docs/components/box-plot/`);
    await first.locator('[data-kind-ui="box-plot-mark"]').first().waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await first.screenshot({ path: `artifacts/box-plot/mobile-${width}.png` });
    await first.hover();
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(300);
    assert.ok((await page.evaluate(() => scrollY)) > before + 50);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/docs/components/box-plot/`);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await first.locator('[data-kind-ui="box-plot-mark"]').first().waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await first.screenshot({ path: "artifacts/box-plot/text-200.png" });
  const ticksWithinPlot = await first
    .locator(".recharts-yAxis .recharts-cartesian-axis-tick-value")
    .evaluateAll((ticks) =>
      ticks.every(
        (tick) =>
          tick.getBoundingClientRect().left >= tick.closest("svg").getBoundingClientRect().left,
      ),
    );
  assert.ok(ticksWithinPlot, "200% numeric labels clip outside the SVG");
  const mobile = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const touchPage = await mobile.newPage();
  await touchPage.goto(`${origin}/docs/components/box-plot/`);
  await touchPage
    .locator('[data-component="box-plot"] [data-kind-ui="box-plot-mark"]')
    .first()
    .waitFor();
  const cdp = await mobile.newCDPSession(touchPage);
  await swipeUp(cdp, { x: 210, y: 450, distance: 250 });
  await touchPage.waitForTimeout(300);
  assert.ok((await touchPage.evaluate(() => scrollY)) > 100);
  await mobile.close();
  for (const family of ["line", "area"]) {
    await page.goto(`${origin}/docs/components/${family}/`);
    await page.locator(`[data-component="${family}"] .recharts-surface`).waitFor();
    assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
  }
  assert.deepEqual(errors, []);
  const motion = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  await motion.goto(`${origin}/docs/components/box-plot/`);
  await motion
    .locator('[data-component="box-plot"] [data-kind-ui="bar-reveal"]')
    .first()
    .waitFor({ state: "attached" });
  await motion
    .locator('[data-component="box-plot"] [data-kind-ui="bar-reveal"]')
    .first()
    .waitFor({ state: "detached" });
  evidence.push(
    "native quantitative ratios",
    "outlier geometry",
    "collapsed/missing/zero",
    "horizontal geometry",
    "keyboard tooltip/Escape",
    "all material source/preview parity",
    "320/375 widths",
    "200% text",
    "wheel and touch propagation",
    "code internal scrolling and edge chaining",
    "keyboard tabs and Select focus",
    "copy prompt and linked source parity",
    "reduced motion",
    "chart-owned entrance",
    "Line/Area compatibility",
    "no browser errors",
  );
  writeFileSync(
    "artifacts/box-plot/browser-results.json",
    JSON.stringify({ passed: evidence }, null, 2),
  );
  console.log(evidence.join("; "));
} finally {
  await browser.close();
}
