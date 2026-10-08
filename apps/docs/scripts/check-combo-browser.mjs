import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import { expectDimmedSeries } from "./interaction-paint.mjs";
import { swipeUp } from "./touch-swipe.mjs";

const origin = "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/combo-examples.json", "utf8"));
mkdirSync("artifacts", { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH });
const findings = [];
async function checkQuantitativeAxes(page, id, viewport) {
  const surface = page.locator(`[data-component="${id}"] .recharts-surface`);
  const axes = surface.locator("g.recharts-yAxis");
  await expect(axes).toHaveCount(id === "combo-stacked" ? 2 : 1);
  const tickGroups = surface.locator("g.recharts-yAxis-tick-labels");
  await expect(tickGroups).toHaveCount(id === "combo-stacked" ? 2 : 1);
  for (const axis of await tickGroups.all())
    await expect
      .poll(() => axis.locator("text.recharts-cartesian-axis-tick-value").count())
      .toBeGreaterThan(0);
  const labels = await surface.evaluate((svg) => {
    const outer = svg.getBoundingClientRect();
    return [...svg.querySelectorAll("g.recharts-yAxis-tick-labels")].map((axis) =>
      [...axis.querySelectorAll("text.recharts-cartesian-axis-tick-value")].map((tick) => {
        const box = tick.getBoundingClientRect();
        return {
          text: tick.textContent?.trim(),
          width: box.width,
          inset: box.left - outer.left,
          inside: box.left >= outer.left - 1 && box.right <= outer.right + 1,
        };
      }),
    );
  });
  for (const axis of labels) {
    assert.ok(axis.length > 0, `${id}: empty quantitative axis at ${viewport}`);
    assert.ok(
      axis.every((tick) => tick.inset >= 7 && tick.inside),
      `${id}: axis labels at ${viewport}: ${JSON.stringify(axis)}`,
    );
  }
  if (id === "combo-stacked") {
    assert.equal(
      labels.filter((axis) => axis.every((tick) => /^\$[\d,.]+k$/.test(tick.text))).length,
      1,
      `Missing revenue scale at ${viewport}`,
    );
    assert.equal(
      labels.filter((axis) => axis.every((tick) => /^[\d,.]+%$/.test(tick.text))).length,
      1,
      `Missing percentage scale at ${viewport}`,
    );
  } else {
    assert.ok(
      labels.every((axis) => axis.every((tick) => /^[\d,.]+$/.test(tick.text))),
      `${id}: invalid numeric scale at ${viewport}`,
    );
  }
  findings.push({ check: "individual quantitative axes", id, viewport, labels });
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    permissions: ["clipboard-read", "clipboard-write"],
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/docs/components/combo/`);
  await page.locator('[data-component="combo"] .recharts-surface').waitFor();
  assert.equal(
    await page.locator('[data-component="combo"] g.recharts-bar.kind-ui-bar-series').count(),
    1,
  );
  assert.equal(
    await page.locator('[data-component="combo"] g.recharts-area.kind-ui-area-series').count(),
    1,
  );
  assert.equal(
    await page.locator('[data-component="combo"] g.recharts-line.kind-ui-line-series').count(),
    1,
  );
  for (const [id, bundle] of Object.entries(bundles)) {
    const workbench = page.locator(`[data-component="${id}"]`);
    await workbench.locator(".recharts-surface").waitFor();
    assert.equal(
      await workbench.locator(`table[aria-label="${bundle.title} data"] tbody tr`).count(),
      bundle.dataAlternative.rows.length,
    );
    const previewHeight = await workbench
      .locator(".preview-panel")
      .evaluate((node) => node.getBoundingClientRect().height);
    await workbench.getByRole("tab", { name: "Code", exact: true }).click();
    const codeHeight = await workbench
      .locator(".code-files")
      .evaluate((node) => node.getBoundingClientRect().height);
    assert.equal(codeHeight, previewHeight);
    const code = await workbench.locator("pre").textContent();
    assert.equal(code.trim(), bundle.files[`src/examples/${id}/example.tsx`].trim());
    await workbench.locator(".line-code-viewport").evaluate((node) => {
      node.scrollTop = 60;
    });
    assert.ok(
      await workbench.locator(".line-code-viewport").evaluate((node) => node.scrollTop > 0),
    );
    await workbench.getByRole("tab", { name: "Preview", exact: true }).click();
    await checkQuantitativeAxes(page, id, "desktop after Code/Preview");
  }
  const stacked = page.locator('[data-component="combo-stacked"]');
  await stacked.scrollIntoViewIfNeeded();
  const retail = stacked.getByRole("button", { name: "Retail · USD", exact: true });
  await retail.focus();
  await page.keyboard.press("Space");
  assert.equal(await retail.getAttribute("aria-pressed"), "true");
  await expectDimmedSeries(stacked, "digital");
  assert.equal(await stacked.locator("g.recharts-bar.kind-ui-bar-series").count(), 2);
  await page.keyboard.press("Space");
  assert.equal(await retail.getAttribute("aria-pressed"), "true");
  assert.equal(await stacked.locator("g.recharts-bar.kind-ui-bar-series").count(), 2);
  const svg = stacked.locator(".recharts-surface");
  await svg.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  const tooltip = stacked.locator('[data-kind-ui="chart-tooltip"]');
  await tooltip.waitFor({ state: "visible" });
  assert.match(await tooltip.innerText(), /\$[\d,]+/);
  assert.match(await tooltip.innerText(), /\d+%/);
  assert.match(await tooltip.innerText(), /Retail/);
  assert.match(await tooltip.innerText(), /Wholesale/);
  await page.keyboard.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
  const motion = page.locator('[data-component="combo-motion"]');
  await motion.scrollIntoViewIfNeeded();
  for (const [value, variant] of Object.entries(bundles["combo-motion"].variants)) {
    await motion.getByRole("combobox", { name: "Entrance" }).click();
    await page.getByRole("option", { name: variant.label, exact: true }).click();
    assert.equal(
      await motion.locator('[data-combo-reveal], [data-kind-ui="bar-reveal"]').count(),
      0,
    );
    await motion.getByRole("tab", { name: "Code", exact: true }).click();
    assert.equal((await motion.locator("pre").textContent()).trim(), variant.source.trim());
    await motion.locator("button.copy-prompt").click();
    assert.ok(
      (await page.evaluate(() => navigator.clipboard.readText())).includes(
        `/variants/${value}/example.tsx`,
      ),
    );
    await motion.getByRole("tab", { name: "Preview", exact: true }).click();
  }
  await motion.getByRole("combobox", { name: "Entrance" }).focus();
  await page.keyboard.press("ArrowDown");
  await page.getByRole("listbox").waitFor();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("option", { name: "Together", exact: true })).toHaveAttribute(
    "data-highlighted",
    "",
  );
  await page.keyboard.press("Enter");
  assert.match(await motion.getByRole("combobox", { name: "Entrance" }).innerText(), /Together/);
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(motion.getByRole("combobox", { name: "Entrance" })).toBeFocused();
  await motion.getByRole("tab", { name: "Preview", exact: true }).focus();
  await expect(motion.getByRole("tab", { name: "Preview", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(motion.getByRole("tab", { name: "Code", exact: true })).toBeFocused();
  await expect(motion.getByRole("tab", { name: "Code", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(motion.getByRole("tab", { name: "Preview", exact: true })).toBeFocused();
  await expect(motion.getByRole("tab", { name: "Preview", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  // A vertical wheel over the plot scrolls the document.
  await page.locator('[data-component="combo"]').scrollIntoViewIfNeeded();
  const chartBox = await page.locator('[data-component="combo"] .recharts-surface').boundingBox();
  await page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + chartBox.height / 2);
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(250);
  assert.ok((await page.evaluate(() => scrollY)) > before + 100);
  // Code consumes wheel input internally and chains to the document at its edge.
  const first = page.locator('[data-component="combo"]');
  await first.getByRole("tab", { name: "Code", exact: true }).click();
  await first.scrollIntoViewIfNeeded();
  await first.locator(".line-code-viewport").evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  const codeBox = await first.locator(".line-code-viewport").boundingBox();
  await page.mouse.move(codeBox.x + codeBox.width / 2, codeBox.y + codeBox.height / 2);
  const codeEdgeBefore = await page.evaluate(() => scrollY);
  await page.waitForTimeout(200);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(350);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(350);
  assert.ok((await page.evaluate(() => scrollY)) > codeEdgeBefore + 80);
  await first.getByRole("tab", { name: "Preview", exact: true }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "artifacts/combo-desktop.png", fullPage: true });
  await stacked.scrollIntoViewIfNeeded();
  await stacked.screenshot({ path: "artifacts/combo-stacked.png" });
  for (const width of [320, 375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(200);
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `Page overflow at ${width}`,
    );
    await page.screenshot({ path: `artifacts/combo-mobile-${width}.png`, fullPage: true });
    for (const id of Object.keys(bundles)) {
      const workbench = page.locator(`[data-component="${id}"]`);
      await workbench.getByRole("tab", { name: "Code", exact: true }).click();
      await workbench.getByRole("tab", { name: "Preview", exact: true }).click();
      await checkQuantitativeAxes(page, id, `${width}px after Code/Preview`);
      const axisBounds = await page
        .locator(`[data-component="${id}"] .recharts-surface`)
        .evaluate((svg) => {
          const left = svg.getBoundingClientRect().left;
          return [...svg.querySelectorAll("text.recharts-cartesian-axis-tick-value")]
            .filter((tick) =>
              /^(?:[\d,.]+|\$[\d,.]+k|[\d,.]+%)$/.test(tick.textContent?.trim() ?? ""),
            )
            .map((tick) => ({
              label: tick.textContent,
              inset: tick.getBoundingClientRect().left - left,
            }));
        });
      assert.ok(axisBounds.length > 0, `${id}: missing numeric ticks at ${width}px`);
      assert.ok(
        axisBounds.every((tick) => tick.inset >= 7),
        `${id}: ${JSON.stringify(axisBounds)}`,
      );
      const box = await page.locator(`[data-component="${id}"] .recharts-surface`).boundingBox();
      assert.ok(
        box.width > 180 && box.x >= 0 && box.x + box.width <= width + 1,
        `${id} bounds at ${width}`,
      );
    }
  }
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  for (const id of Object.keys(bundles)) {
    await checkQuantitativeAxes(page, id, "200% text");
    const bounds = await page
      .locator(`[data-component="${id}"] .recharts-surface`)
      .evaluate((svg) => {
        const outer = svg.getBoundingClientRect();
        return [...svg.querySelectorAll("text.recharts-cartesian-axis-tick-value")]
          .filter((tick) =>
            /^(?:[\d,.]+|\$[\d,.]+k|[\d,.]+%)$/.test(tick.textContent?.trim() ?? ""),
          )
          .map((tick) => {
            const box = tick.getBoundingClientRect();
            return {
              label: tick.textContent,
              inside: box.left >= outer.left - 1 && box.right <= outer.right + 1,
            };
          });
      });
    assert.ok(bounds.length > 0, `${id}: missing numeric ticks at 200% text`);
    assert.ok(
      bounds.every((tick) => tick.inside),
      `${id}: clipped labels ${JSON.stringify(bounds)}`,
    );
  }
  await page.screenshot({ path: "artifacts/combo-text-200.png", fullPage: true });
  assert.equal(errors.length, 0, errors.join("\n"));
  findings.push(
    "Desktop, 320/375 mobile, 200% text; explicit geometry, tooltip units, legend keyboard, variant/source parity, clipboard prompt, reduced motion and vertical chart wheel passed.",
  );
  await page.goto(`${origin}/docs/components/line/`);
  await page.locator('[data-component="line"] .recharts-surface').waitFor();
  assert.equal(await page.locator('[data-component="line"] .preview-tabs [role="tab"]').count(), 2);
  assert.ok((await page.getByRole("link", { name: "Combo Chart", exact: true }).count()) > 0);
  findings.push("Line route and shell navigation smoke passed; code wheel edge chaining passed.");
  await context.close();
  const touchContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(`${origin}/docs/components/combo/`);
  await touchPage.locator('[data-component="combo"] .recharts-surface').waitFor();
  const touchBox = await touchPage
    .locator('[data-component="combo"] .recharts-surface')
    .boundingBox();
  const cdp = await touchContext.newCDPSession(touchPage);
  const touchBefore = await touchPage.evaluate(() => scrollY);
  await swipeUp(cdp, {
    x: touchBox.x + touchBox.width / 2,
    y: Math.min(760, touchBox.y + touchBox.height - 20),
    distance: 220,
  });
  await touchPage.waitForTimeout(200);
  assert.ok((await touchPage.evaluate(() => scrollY)) > touchBefore + 80);
  findings.push("Actual mobile touch swipe over the chart scrolls the document.");
  await touchContext.close();
  const animatedContext = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "no-preference",
  });
  const animated = await animatedContext.newPage();
  await animated.goto(`${origin}/docs/components/combo/`);
  const animationWorkbench = animated.locator('[data-component="combo-motion"]');
  await animationWorkbench.locator(".recharts-surface").waitFor();
  await animationWorkbench.scrollIntoViewIfNeeded();
  await animationWorkbench.getByRole("combobox", { name: "Entrance" }).click();
  await animated.getByRole("option", { name: "Together", exact: true }).click();
  await animationWorkbench.getByRole("combobox", { name: "Entrance" }).click();
  await animated.getByRole("option", { name: "Independent", exact: true }).click();
  assert.equal(await animationWorkbench.locator('[data-combo-reveal="area"]').count(), 0);
  assert.equal(await animationWorkbench.locator('[data-combo-reveal="line"]').count(), 1);
  assert.equal(await animationWorkbench.locator('[data-kind-ui="bar-reveal"]').count(), 1);
  await animated.emulateMedia({ reducedMotion: "reduce" });
  await animated.waitForTimeout(100);
  assert.equal(
    await animationWorkbench.locator('[data-combo-reveal], [data-kind-ui="bar-reveal"]').count(),
    0,
  );
  findings.push(
    "Independent family entrance presence and live reduced-motion cancellation passed.",
  );
  await animatedContext.close();
  writeFileSync("artifacts/combo-browser-results.json", `${JSON.stringify(findings, null, 2)}\n`);
  console.log(findings.join("\n"));
} finally {
  await browser.close();
}
