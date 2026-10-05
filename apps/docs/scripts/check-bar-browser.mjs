import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { swipeUp } from "./touch-swipe.mjs";

const origin = process.env.KIND_DOCS_TEST_ORIGIN || "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/bar-examples.json", "utf8"));
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);
const evidence = { variants: [], viewports: [], keyboard: [], scrolling: [], errors: [] };
mkdirSync("artifacts/screenshots", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  await page.goto(`${origin}/docs/components/bar/`);
  await page.locator('[data-component="bar"] .recharts-bar-rectangle').first().waitFor();
  assert.equal(await page.locator(".line-workbench").count(), 4);
  assert.equal(await page.locator("#fd-glass-layout").count(), 1);
  assert.equal(await page.locator(".doc-footer").count(), 0);
  assert.equal(await page.getByText("View data", { exact: true }).count(), 0);
  assert.equal(await page.getByRole("heading", { name: "Basic", exact: true }).count(), 0);
  assert.equal(await page.locator('[data-kind-ui="bar-reveal"]').count(), 0);
  const geometries = {};
  for (const [id, bundle] of Object.entries(bundles)) {
    const card = page.locator(`[data-component="${id}"]`);
    for (const [value, variant] of Object.entries(
      bundle.variants ?? { default: { source: bundle.files[`src/examples/${id}/example.tsx`] } },
    )) {
      if (bundle.variants) {
        // Select with keyboard to exercise the shared Radix control.
        await card.getByRole("combobox", { name: bundle.variantControl }).focus();
        await page.keyboard.press("Space");
        await page.getByRole("option", { name: variant.label, exact: true }).click();
      }
      await card.getByRole("tab", { name: "Code", exact: true }).click();
      assert.equal(await card.locator("figcaption").textContent(), "example.tsx");
      assert.equal((await card.locator("pre").textContent()).trimEnd(), variant.source.trimEnd());
      await card.getByRole("button", { name: "Copy Text", exact: true }).click();
      assert.equal(
        (await page.evaluate(() => navigator.clipboard.readText())).trimEnd(),
        variant.source.trimEnd(),
      );
      assert.ok(
        await card.locator(".line-code-viewport").evaluate((n) => n.scrollHeight > n.clientHeight),
      );
      await card.getByRole("tab", { name: "Preview", exact: true }).click();
      await card.locator(".recharts-bar-rectangle").first().waitFor();
      await card.getByRole("button", { name: /Copy prompt|Copied/ }).click();
      const prompt = await page.evaluate(() => navigator.clipboard.readText());
      assert.ok(prompt.includes("/docs/components/bar/"));
      const url = prompt.match(/Retrieve the standalone source: (.+)\./)[1];
      assert.equal(
        (await (await context.request.get(url)).text()).trimEnd(),
        variant.source.trimEnd(),
      );
      const geometry = await card
        .locator(".recharts-bar-rectangle path")
        .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d")));
      assert.ok(geometry.length >= 5 && geometry.every((d) => d && !d.includes("NaN")));
      if (id === "bar-comparison") geometries[value] = geometry;
      if (id === "bar-materials") {
        assert.equal(
          await card.locator('[data-kind-ui="bar-material"]').count(),
          value === "plain" ? 0 : 1,
        );
        if (value !== "plain")
          assert.equal(
            await card.locator('[data-kind-ui="bar-material"]').getAttribute("data-material"),
            value,
          );
      }
      evidence.variants.push({ id, value, sourceCopy: "exact", geometryCount: geometry.length });
    }
    await card.getByRole("tab", { name: "Preview", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await card.locator('[role="tab"][data-state="active"]').filter({ hasText: "Code" }).waitFor();
    assert.equal(
      await card.getByRole("tab", { name: "Code", exact: true }).getAttribute("aria-selected"),
      "true",
    );
    await page.keyboard.press("Home");
    await card
      .locator('[role="tab"][data-state="active"]')
      .filter({ hasText: "Preview" })
      .waitFor();
    assert.equal(
      await card.getByRole("tab", { name: "Preview", exact: true }).getAttribute("aria-selected"),
      "true",
    );
    const rows = card.locator("table.sr-only tbody tr");
    assert.equal(await rows.count(), bundle.dataAlternative.rows.length);
  }
  assert.notDeepEqual(geometries.grouped, geometries.stacked);
  const comparison = page.locator('[data-component="bar-comparison"]');
  assert.equal(await comparison.locator(".recharts-bar-rectangle").count(), 10);
  const digital = comparison.getByRole("button", { name: "Digital", exact: true });
  await digital.focus();
  await page.keyboard.press("Enter");
  assert.equal(await digital.getAttribute("aria-pressed"), "false");
  assert.equal(await comparison.locator(".recharts-bar-rectangle").count(), 5);
  for (const name of ["Code", "Preview"])
    await comparison.getByRole("tab", { name, exact: true }).click();
  assert.equal(await digital.getAttribute("aria-pressed"), "false");
  await digital.focus();
  await page.keyboard.press("Space");
  assert.equal(await digital.getAttribute("aria-pressed"), "true");
  const first = page.locator('[data-component="bar"]');
  await first.locator(".recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await first.locator('[data-kind-ui="chart-tooltip"]').waitFor();
  const marks = first.locator('[data-kind-ui="emphasis-mark"]');
  await page.waitForFunction(
    () => document.querySelectorAll('[data-component="bar"] [data-emphasis="dimmed"]').length === 4,
  );
  assert.equal(await marks.count(), 5);
  const tooltip = first.locator('[data-kind-ui="chart-tooltip"]');
  assert.ok(await tooltip.innerText());
  await page.screenshot({ path: "artifacts/screenshots/bar-tooltip-desktop.png" });
  await page.keyboard.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
  evidence.keyboard.push(
    "Radix Select, tabs, controlled legend Enter/Space, tooltip ArrowRight/Escape, category emphasis",
  );
  await page.getByRole("heading", { name: "Bar Chart", exact: true }).click();
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1080 : 812 });
    for (const enlarged of [false, true]) {
      await page.evaluate((large) => {
        document.documentElement.style.fontSize = large ? "200%" : "";
      }, enlarged);
      await page.waitForTimeout(500);
      const stats = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
        cards: [...document.querySelectorAll(".line-workbench .recharts-surface")].map((svg) => {
          const b = svg.getBoundingClientRect();
          return {
            width: b.width,
            overlaps: [".recharts-xAxis", ".recharts-yAxis"].flatMap((selector) => {
              const labels = [
                ...svg.querySelectorAll(`${selector} .recharts-cartesian-axis-tick-value`),
              ];
              return labels.flatMap((label, index) =>
                labels
                  .slice(index + 1)
                  .filter((peer) => {
                    const a = label.getBoundingClientRect(),
                      c = peer.getBoundingClientRect();
                    return (
                      Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 &&
                      Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1
                    );
                  })
                  .map((peer) => `${label.textContent}/${peer.textContent}`),
              );
            }),
            clipped: [...svg.querySelectorAll(".recharts-cartesian-axis-tick-value")]
              .filter((t) => {
                const r = t.getBoundingClientRect();
                return (
                  r.left < b.left - 0.5 ||
                  r.right > b.right + 0.5 ||
                  r.top < b.top - 0.5 ||
                  r.bottom > b.bottom + 0.5
                );
              })
              .map((t) => t.textContent),
          };
        }),
      }));
      assert.ok(
        stats.page <= stats.viewport + 2,
        `Page overflow ${width} enlarged=${enlarged}: ${JSON.stringify(stats)}`,
      );
      assert.ok(
        stats.cards.every((c) => c.width > 80 && c.clipped.length === 0 && c.overlaps.length === 0),
        JSON.stringify(stats),
      );
      await first.locator(".recharts-surface").focus();
      await page.keyboard.press("ArrowRight");
      await tooltip.waitFor();
      const spacing = await tooltip.evaluate((node) => ({
        padding: getComputedStyle(node).padding,
        listMargin: getComputedStyle(node.querySelector('[data-kind-ui="chart-tooltip-list"]'))
          .margin,
        valueFits: [...node.querySelectorAll('[data-kind-ui="chart-tooltip-value"]')].every(
          (value) => value.scrollWidth <= value.clientWidth + 1,
        ),
        width: node.getBoundingClientRect().width,
        viewport: innerWidth,
      }));
      assert.equal(spacing.padding, "6px 8px");
      assert.equal(spacing.listMargin, "2px 0px 0px");
      assert.ok(spacing.valueFits && spacing.width < spacing.viewport);
      await page.keyboard.press("Escape");
      await tooltip.waitFor({ state: "hidden" });
      await page.getByRole("heading", { name: "Bar Chart", exact: true }).click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `artifacts/screenshots/bar-${width}${enlarged ? "-text200" : ""}.png`,
        fullPage: true,
      });
      evidence.viewports.push({ width, enlarged, ...stats });
    }
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.setViewportSize({ width: 1440, height: 1080 });
  for (const selector of [
    '[data-component="bar"] .recharts-surface',
    ".line-props-scroll",
    "#nd-toc",
  ]) {
    const target = page.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    await page.mouse.move(
      box.x + Math.min(box.width / 2, 100),
      Math.max(120, Math.min(800, box.y + 60)),
    );
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 260);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => scrollY);
    assert.ok(after > before + 60, `${selector} wheel trapped`);
    evidence.scrolling.push({ selector, before, after });
  }
  await page.evaluate(() => scrollTo(0, 0));
  await first.getByRole("tab", { name: "Code", exact: true }).click();
  const code = first.locator(".line-code-viewport");
  const box = await code.boundingBox();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(box.x + box.width / 2, box.y + 100);
  await page.mouse.wheel(0, 240);
  await page.waitForTimeout(300);
  assert.ok(await code.evaluate((n) => n.scrollTop > 100));
  assert.equal(await page.evaluate(() => scrollY), before);
  await code.evaluate((n) => {
    n.scrollTop = n.scrollHeight;
  });
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);
  assert.ok((await page.evaluate(() => scrollY)) > before + 60, "Code boundary traps wheel");
  evidence.scrolling.push({ codeInternalAndBoundary: true });
  const mobile = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const touch = await mobile.newPage();
  await touch.goto(`${origin}/docs/components/bar/`);
  await touch.locator(".recharts-bar-rectangle").first().waitFor();
  const cdp = await mobile.newCDPSession(touch);
  for (const selector of ['[data-component="bar"] .recharts-surface', ".line-props-scroll"]) {
    const target = touch.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    const b = await target.boundingBox();
    const prior = await touch.evaluate(() => scrollY);
    await swipeUp(cdp, { x: 200, y: Math.max(160, Math.min(650, b.y + 80)), distance: 180 });
    await touch.waitForTimeout(300);
    assert.ok((await touch.evaluate(() => scrollY)) > prior + 40, `${selector} touch trapped`);
    evidence.scrolling.push({ selector, touch: true });
  }
  assert.deepEqual(evidence.errors, []);
  writeFileSync("artifacts/bar-browser-results.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    "Bar variants, copy parity, reduced motion, keyboard, layouts and real wheel/touch passed.",
  );
} finally {
  await browser.close();
}
