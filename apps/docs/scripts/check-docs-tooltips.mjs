import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { twMerge } from "tailwind-merge";

const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
const results = [];
mkdirSync("artifacts/screenshots", { recursive: true });
try {
  for (const family of ["area", "line"]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1080 },
      reducedMotion: "reduce",
    });
    page.setDefaultTimeout(15000);
    await page.goto(`http://127.0.0.1:6373/docs/components/${family}/`);
    await page.locator(`[data-component="${family}"] .recharts-surface`).waitFor();
    for (const width of [1440, 375, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1080 : 812 });
      for (const enlarged of [false, true]) {
        await page.evaluate((large) => {
          document.documentElement.style.fontSize = large ? "200%" : "";
        }, enlarged);
        for (const [id, rows] of [
          [family, 1],
          [family === "area" ? "area-stacked" : "line-comparison", 2],
        ]) {
          const card = page.locator(`[data-component="${id}"]`);
          const plot = card.locator(".recharts-surface");
          await plot.focus();
          await page.keyboard.press("Escape");
          for (let point = 0; point < 16; point++) await page.keyboard.press("ArrowLeft");
          for (let point = 0; point < 4; point++) await page.keyboard.press("ArrowRight");
          const tooltip = card.locator('[data-kind-ui="chart-tooltip"]');
          await tooltip.waitFor();
          assert.equal(
            await tooltip.locator('[data-kind-ui="chart-tooltip-label"]').textContent(),
            "May",
          );
          assert.equal(await tooltip.locator('[data-kind-ui="chart-tooltip-item"]').count(), rows);
          if (id === family) {
            assert.equal(
              await tooltip.locator('[data-kind-ui="chart-tooltip-value"]').textContent(),
              "680",
            );
          }
          const measured = await tooltip.evaluate((node) => {
            const box = node.getBoundingClientRect();
            const frame = node.closest('[data-kind-ui="tooltip-frame"]');
            const frameBox = frame.getBoundingClientRect();
            const scale = frameBox.width / frame.offsetWidth;
            const list = node.querySelector('[data-kind-ui="chart-tooltip-list"]');
            const items = [...node.querySelectorAll('[data-kind-ui="chart-tooltip-item"]')];
            const style = getComputedStyle(node);
            return {
              padding: style.padding,
              rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
              border: style.borderWidth,
              listMargin: getComputedStyle(list).margin,
              listPadding: getComputedStyle(list).padding,
              itemMargins: items.map((item) => getComputedStyle(item).margin),
              frameScrollable:
                (frame.scrollWidth <= frame.clientWidth ||
                  ["auto", "scroll"].includes(getComputedStyle(frame).overflowX)) &&
                (frame.scrollHeight <= frame.clientHeight ||
                  ["auto", "scroll"].includes(getComputedStyle(frame).overflowY)),
              valuesReachable: items.every((item) => {
                const value = item
                  .querySelector('[data-kind-ui="chart-tooltip-value"]')
                  .getBoundingClientRect();
                return (
                  value.left >= frameBox.left - frame.scrollLeft * scale - 0.5 &&
                  value.right <=
                    frameBox.left + (frame.scrollWidth - frame.scrollLeft) * scale + 0.5 &&
                  value.top >= frameBox.top - frame.scrollTop * scale - 0.5 &&
                  value.bottom <=
                    frameBox.top + (frame.scrollHeight - frame.scrollTop) * scale + 0.5
                );
              }),
              valueFits: items.every((item) => {
                const value = item.querySelector('[data-kind-ui="chart-tooltip-value"]');
                return value.scrollWidth <= value.clientWidth + 1;
              }),
              width: box.width,
              viewport: innerWidth,
            };
          });
          assert.equal(
            measured.padding,
            `${measured.rootFontSize * 0.375}px ${measured.rootFontSize * 0.5}px`,
          );
          assert.equal(measured.border, "1px");
          assert.equal(measured.listMargin, "2px 0px 0px");
          assert.equal(measured.listPadding, "0px");
          assert.ok(measured.itemMargins.every((margin) => margin === "1px 0px 0px"));
          assert.ok(
            measured.frameScrollable && measured.valuesReachable,
            JSON.stringify({ id, width, enlarged, ...measured }),
          );
          assert.ok(measured.valueFits && measured.width < measured.viewport);
          results.push({ family, id, width, enlarged, rows, ...measured });
          if (width === 375 && !enlarged) {
            await tooltip.screenshot({ path: `artifacts/screenshots/${id}-tooltip.png` });
          }
          await page.keyboard.press("Escape");
        }
      }
    }
    // Public theme tokens and Tailwind utilities retain consumer control.
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });
    const card = page.locator(`[data-component="${family}"]`);
    await card.locator(".recharts-surface").focus();
    await page.keyboard.press("ArrowRight");
    const tooltip = card.locator('[data-kind-ui="chart-tooltip"]');
    await tooltip.waitFor();
    const overriddenClasses = twMerge(await tooltip.getAttribute("class"), "p-6");
    await tooltip.evaluate((node, className) => {
      node.style.setProperty("--popover", "rgb(12, 34, 56)");
      node.className = className;
    }, overriddenClasses);
    await page.waitForTimeout(100);
    assert.deepEqual(
      await tooltip.evaluate((node) => ({
        padding: getComputedStyle(node).padding,
        background: getComputedStyle(node).backgroundColor,
      })),
      { padding: "24px", background: "rgb(12, 34, 56)" },
    );
    await page.close();
  }
  writeFileSync("artifacts/docs-tooltip-results.json", `${JSON.stringify(results, null, 2)}\n`);
  console.log(
    "Line/Area May/680 and two-row tooltips retain native spacing across desktop, narrow widths and 200% text; tokens/utilities override defaults.",
  );
} finally {
  await browser.close();
}
