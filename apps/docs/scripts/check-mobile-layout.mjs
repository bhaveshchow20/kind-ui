import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { families } from "../examples/catalog.mjs";

export async function checkMobileLayout(browser, origin) {
  mkdirSync("artifacts/mobile-layout", { recursive: true });
  const evidence = [];
  for (const width of [320, 375, 390, 430, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const { id } of families) {
      await page.goto(`${origin}/docs/components/${id}/`);
      const example = page.locator(`[data-component="${id}"]`);
      await example.locator(".recharts-surface, [data-kind-ui=heatmap-grid]").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${id} page overflows at ${width}`,
      );
      const bounds = await example
        .locator(".recharts-surface, [data-kind-ui=heatmap-scroll]")
        .first()
        .evaluate((plot) => {
          // Dense native diagrams may keep their labels in an accessible pan viewport.
          for (let parent = plot.parentElement; parent; parent = parent.parentElement) {
            if (["auto", "scroll"].includes(getComputedStyle(parent).overflowX))
              return parent.getBoundingClientRect().toJSON();
            if (parent.classList.contains("chart-example")) break;
          }
          return plot.getBoundingClientRect().toJSON();
        });
      assert.ok(
        bounds.x >= 0 && bounds.x + bounds.width <= width + 1,
        `${id} plot overflows at ${width}`,
      );
      for (const material of await page
        .getByRole("combobox", { name: /^(Material|Finish)$/ })
        .all()) {
        assert.equal(
          (await material.textContent()).trim(),
          "Default",
          `${id} must initially use Default`,
        );
      }
      if (id === "line") {
        const plot = await example.locator(".recharts-cartesian-grid").boundingBox();
        const ticks = await example.locator("g.recharts-yAxis-tick-labels text").all();
        assert.ok(ticks.length > 0, "Line must retain numeric axis labels");
        for (const tick of ticks) {
          const label = await tick.boundingBox();
          assert.ok(
            label.width > 0 && label.x >= bounds.x - 1 && label.x + label.width <= plot.x,
            `Line tick must be visible at ${width}`,
          );
        }
        assert.ok(plot.x - bounds.x < 80, `Line reserves unnecessary left space at ${width}`);
        assert.ok(plot.width / bounds.width > 0.65, `Line plot is too narrow at ${width}`);
        await page.screenshot({ path: `artifacts/mobile-layout/after-${width}.png` });
        evidence.push({
          width,
          chartWidth: bounds.width,
          plotWidth: plot.width,
          leftSpace: plot.x - bounds.x,
        });
        await example
          .locator('[data-kind-ui="chart-legend-button"]')
          .first()
          .evaluate((button) => {
            button.textContent =
              "Monthly visitors with a deliberately long category label that must wrap on phones";
          });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          `Long legend overflows at ${width}`,
        );
        await page.getByRole("tab", { name: "Code", exact: true }).first().click();
        await page.getByRole("tab", { name: "Preview", exact: true }).first().click();
        assert.ok(
          (await example.locator(".recharts-cartesian-grid").boundingBox()).width >
            bounds.width * 0.65,
        );
      }
    }
    assert.deepEqual(errors, [], `Browser errors at ${width}`);
    await page.close();
  }
  writeFileSync("artifacts/mobile-layout/evidence.json", JSON.stringify(evidence, null, 2));
  console.log(
    "All chart families fit 320/375/390/430/768/1440px; Default selectors, compact axes, long legends and Code/Preview resizing passed.",
  );
}

if (process.argv[1]?.endsWith("check-mobile-layout.mjs")) {
  const browser = await chromium.launch(
    process.env.KIND_CHROMIUM_PATH ? { executablePath: process.env.KIND_CHROMIUM_PATH } : {},
  );
  try {
    await checkMobileLayout(browser, "http://127.0.0.1:6373");
  } finally {
    await browser.close();
  }
}
