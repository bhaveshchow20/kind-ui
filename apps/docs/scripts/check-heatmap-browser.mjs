import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { swipeUp } from "./touch-swipe.mjs";

const origin = "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/heatmap-examples.json", "utf8"));
mkdirSync("artifacts/heatmap", { recursive: true });
const browser = await chromium.launch({
  ...(process.env.KIND_DOCS_CHROMIUM ? { executablePath: process.env.KIND_DOCS_CHROMIUM } : {}),
});
const evidence = [];
try {
  for (const width of [1440, 375, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
      hasTouch: true,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/docs/components/heatmap/`);
    const primary = page.locator('[data-component="heatmap"]');
    const grid = primary.locator('[data-kind-ui="heatmap-grid"]');
    await grid.waitFor();
    assert.equal(await grid.locator("td").count(), 24);
    assert.equal(await grid.locator('td[data-missing="true"]').count(), 2);
    assert.equal(await grid.locator('td[tabindex="0"]').count(), 1);
    assert.equal(await primary.locator("table.sr-only").count(), 1);
    assert.equal(await primary.locator('[data-kind-ui="heatmap-data-table"]').count(), 1);
    await page.screenshot({ path: `artifacts/heatmap/initial-${width}.png` });
    const cell = grid.locator("td").first();
    const target = await cell.boundingBox();
    await page.touchscreen.tap(target.x + target.width / 2, target.y + target.height / 2);
    await cell.focus();
    const tooltip = primary.getByRole("tooltip");
    await tooltip.waitFor({ state: "visible" });
    assert.equal(await tooltip.textContent(), "Mon, 08:00: 12");
    await cell.hover();
    assert.equal(await tooltip.textContent(), "Mon, 08:00: 12");
    await page.waitForTimeout(80);
    await primary.screenshot({ path: `artifacts/heatmap/tooltip-${width}.png` });
    const tooltipBox = await tooltip.boundingBox();
    const usageBox = await page.locator("h2#usage").boundingBox();
    assert.ok(tooltipBox.y + tooltipBox.height < usageBox.y, "Tooltip must remain above Usage");
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("td:focus").getAttribute("aria-label"), "Mon, 10:00: 34");
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.locator("td:focus").getAttribute("aria-label"), "Tue, 10:00: 42");
    await page.keyboard.press("End");
    assert.equal(await page.locator("td:focus").getAttribute("aria-label"), "Tue, 18:00: 0");
    await page.keyboard.press("Control+End");
    assert.equal(
      await page.locator("td:focus").getAttribute("aria-label"),
      "Thu, 18:00: No report",
    );
    await page.keyboard.press("Escape");
    await tooltip.waitFor({ state: "hidden", timeout: 1000 });
    await page.keyboard.press("Control+Home");
    await page.keyboard.press("Tab");
    assert.equal(await grid.locator("td:focus").count(), 0);
    await page.screenshot({ path: `artifacts/heatmap/${width}.png` });
    const viewport = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    assert.ok(viewport.document <= viewport.viewport, JSON.stringify(viewport));
    const scroll = primary.locator('[data-kind-ui="heatmap-scroll"]').first();
    if (width < 400) {
      assert.ok(await scroll.evaluate((node) => node.scrollWidth > node.clientWidth));
      await scroll.evaluate((node) => {
        node.scrollLeft = 120;
      });
      assert.ok(await scroll.evaluate((node) => node.scrollLeft > 0));
    }
    const bounds = await scroll.boundingBox();
    await page.mouse.move(bounds.x + 20, bounds.y + 20);
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 250);
    await page.waitForTimeout(350);
    assert.ok(
      (await page.evaluate(() => scrollY)) > before,
      "Wheel over table must scroll article",
    );
    if (width < 400) {
      await primary.scrollIntoViewIfNeeded();
      const tableBounds = await scroll.boundingBox();
      const beforeTouch = await page.evaluate(() => scrollY);
      const cdp = await context.newCDPSession(page);
      await swipeUp(cdp, {
        x: tableBounds.x + 50,
        y: tableBounds.y + tableBounds.height / 2,
        distance: 180,
      });
      await page.waitForTimeout(400);
      assert.ok(
        (await page.evaluate(() => scrollY)) > beforeTouch,
        "Touch over the matrix must scroll the article",
      );
      await cdp.detach();
    }
    const signed = page.locator('[data-component="heatmap-diverging"]');
    await signed.scrollIntoViewIfNeeded();
    assert.equal(await signed.locator('[data-kind-ui="heatmap-grid"] td').count(), 16);
    assert.equal(
      await signed
        .locator('[data-kind-ui="heatmap-zero-marker"]')
        .evaluate((node) => node.style.left),
      "50%",
    );
    assert.equal(
      await signed
        .locator('td[aria-label="North, Jun: 0%"]')
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      "rgb(255, 247, 237)",
    );
    await signed.locator('[data-kind-ui="heatmap-grid"] td').first().focus();
    await page.waitForTimeout(80);
    const signedLayout = await signed.evaluate((node) => ({
      tooltip: node.querySelector('[role="tooltip"]').getBoundingClientRect().bottom,
      next: node.nextElementSibling.getBoundingClientRect().top,
    }));
    assert.ok(
      signedLayout.tooltip < signedLayout.next,
      "Signed tooltip must remain above following prose",
    );
    await page.keyboard.press("Escape");
    await signed.screenshot({ path: `artifacts/heatmap/signed-${width}.png` });
    const material = page.locator('[data-component="heatmap-materials"]');
    await material.scrollIntoViewIfNeeded();
    for (const value of ["paper", "plain", "clay", "glow"]) {
      const label = value[0].toUpperCase() + value.slice(1);
      await material.getByRole("combobox", { name: "Material" }).click();
      await page.getByRole("option", { name: label, exact: true }).click();
      assert.equal(await material.locator(`td[data-material="${value}"]`).count(), 22);
      assert.equal(await material.locator('td[data-missing="true"][data-material]').count(), 0);
      await material.getByRole("tab", { name: "Code", exact: true }).click();
      const code = material.locator("pre");
      assert.equal(
        (await code.textContent()).trim(),
        bundles["heatmap-materials"].variants[value].source.trim(),
      );
      await material.locator("button.copy-prompt").click();
      const prompt = await page.evaluate(() => navigator.clipboard.readText());
      assert.ok(prompt.includes(`/docs/components/heatmap/`));
      assert.ok(prompt.includes(`/variants/${value}/example.tsx`));
      const viewport = material.locator(".line-code-viewport");
      await viewport.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      if (value === "glow") {
        await viewport.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        const bounds = await viewport.boundingBox();
        await page.mouse.move(bounds.x + 5, bounds.y - 25);
        await page.waitForTimeout(700);
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        const before = await page.evaluate(() => scrollY);
        await page.mouse.wheel(0, 180);
        await page.waitForTimeout(350);
        await page.mouse.wheel(0, 180);
        await page.waitForTimeout(350);
        assert.ok(
          (await page.evaluate(() => scrollY)) > before,
          `Code must chain: ${JSON.stringify({ before, after: await page.evaluate(() => scrollY), bounds, viewport: await viewport.evaluate((node) => ({ top: node.scrollTop, max: node.scrollHeight - node.clientHeight, behavior: getComputedStyle(node).overscrollBehavior, at: document.elementFromPoint(node.getBoundingClientRect().x + node.clientWidth / 2, node.getBoundingClientRect().y + node.clientHeight / 2)?.tagName })) })}`,
        );
      }
      await material.getByRole("tab", { name: "Preview", exact: true }).click();
    }
    await material.screenshot({ path: `artifacts/heatmap/materials-${width}.png` });
    assert.deepEqual(errors, []);
    evidence.push({
      width,
      matrix: "passed",
      keyboard: "passed",
      materials: "passed",
      copiedSource: "passed",
      wheel: "passed",
      touch: "passed",
      signedScale: "passed",
      errors,
    });
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.goto(`${origin}/docs/components/heatmap/`);
  await page.locator('[data-kind-ui="heatmap-grid"]').first().waitFor();
  await page.waitForTimeout(1000);
  assert.equal(
    await page
      .locator('[data-component="heatmap"] td')
      .first()
      .evaluate((node) => getComputedStyle(node).opacity),
    "1",
  );
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await page.waitForTimeout(100);
  await page.screenshot({ path: "artifacts/heatmap/text-200.png" });
  const enlarged = page.locator('[data-component="heatmap"]');
  await enlarged.locator('[data-kind-ui="heatmap-grid"] td').first().focus();
  await enlarged.getByRole("tooltip").waitFor({ state: "visible" });
  await page.waitForTimeout(100);
  const enlargedLayout = await enlarged.evaluate((node) => ({
    tooltip: node.querySelector('[role="tooltip"]').getBoundingClientRect().bottom,
    next: node.nextElementSibling.getBoundingClientRect().top,
  }));
  assert.ok(enlargedLayout.tooltip < enlargedLayout.next, "200% text must retain tooltip space");
  await enlarged.screenshot({ path: "artifacts/heatmap/matrix-text-200.png" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto(`${origin}/docs/components/line/`);
  await page.locator(".recharts-line-curve").first().waitFor();
  await page.goto(`${origin}/docs/components/area/`);
  await page.locator(".recharts-area-area").first().waitFor();
  evidence.push({ motionFinal: "passed", text200: "passed", lineAreaShell: "passed" });
  await context.close();
  writeFileSync("artifacts/heatmap/browser-results.json", `${JSON.stringify(evidence, null, 2)}\n`);
} finally {
  await browser.close();
}
console.log(
  "Heatmap responsive, keyboard, source selection, motion, wheel and shell checks passed.",
);
