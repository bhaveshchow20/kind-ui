import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "no-preference",
  });
  page.setDefaultTimeout(15000);
  await page.goto("http://127.0.0.1:6373/docs/components/area/");
  const card = page.locator('[data-component="area"]');
  const reveal = card.locator("[data-area-reveal]");
  await reveal.waitFor({ state: "attached" });
  const before = await reveal.getAttribute("width");
  assert.ok(Number.parseFloat(before) < 100, `Entrance already completed: ${before}`);
  await reveal.waitFor({ state: "detached" });
  assert.equal(await card.locator(".recharts-area-area").count(), 1);
  const plot = card.locator(".recharts-surface");
  await plot.focus();
  await page.keyboard.press("ArrowRight");
  await card.locator('[data-kind-ui="chart-tooltip"]').waitFor();
  assert.equal(await card.locator('[data-kind-ui="tooltip-motion"]').count(), 1);
  await page.keyboard.press("Escape");
  await card.locator('[data-kind-ui="chart-tooltip"]').waitFor({ state: "hidden" });
  writeFileSync(
    "artifacts/area-motion-results.json",
    JSON.stringify(
      {
        entrance: "chart-owned",
        initialWidth: before,
        nativeArea: "retained",
        keyboardTooltipMotion: "passed",
        escape: "passed",
        reducedMotion: "covered by check-area-glass",
      },
      null,
      2,
    ),
  );
  console.log("Area chart-owned entrance and keyboard tooltip motion/Escape passed.");
} finally {
  await browser.close();
}
