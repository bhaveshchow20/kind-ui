import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "no-preference",
  });
  await page.goto(
    `${process.env.KIND_DOCS_TEST_ORIGIN || "http://127.0.0.1:6373"}/docs/components/bar/`,
  );
  const card = page.locator('[data-component="bar"]');
  const reveal = card.locator('[data-kind-ui="bar-reveal"]');
  await reveal.waitFor({ state: "attached" });
  const height = Number.parseFloat(await reveal.getAttribute("height"));
  assert.ok(Number.isFinite(height) && height < 180, `Entrance already complete: ${height}`);
  await reveal.waitFor({ state: "detached" });
  assert.equal(await card.locator(".recharts-bar-rectangle").count(), 5);
  const bar = await card.locator(".recharts-bar-rectangle path").first().boundingBox();
  await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
  const tooltip = card.locator('[data-kind-ui="chart-tooltip"]');
  await tooltip.waitFor();
  await page.waitForFunction(
    () => document.querySelectorAll('[data-component="bar"] [data-emphasis="dimmed"]').length === 4,
  );
  assert.equal(await card.locator('[data-kind-ui="tooltip-motion"]').count(), 1);
  await page.mouse.move(1100, 150);
  await card.locator(".recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await tooltip.waitFor();
  await page.keyboard.press("Escape");
  await tooltip.waitFor({ state: "hidden" });
  assert.equal(await reveal.count(), 0);
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/bar-motion-results.json",
    `${JSON.stringify(
      {
        initialHeight: height,
        entrance: "chart-owned",
        pointerEmphasis: "passed",
        tooltipMotion: "passed",
        keyboardEscape: "passed",
        reducedMotion: "covered by check-bar-browser",
      },
      null,
      2,
    )}\n`,
  );
  console.log("Bar entrance, pointer category emphasis and tooltip motion/Escape passed.");
} finally {
  await browser.close();
}
