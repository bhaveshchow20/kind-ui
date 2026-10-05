import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import { swipeUp } from "./touch-swipe.mjs";

const browser = await chromium.launch(
  process.env.KIND_CHROMIUM_PATH ? { executablePath: process.env.KIND_CHROMIUM_PATH } : {},
);
const evidence = { viewports: [], directions: [], interactions: [], scroll: [], errors: [] };
mkdirSync("artifacts/radial", { recursive: true });
const bundles = JSON.parse(readFileSync("generated/radial-examples.json", "utf8"));
const url = "http://127.0.0.1:6373/docs/components/radial/";
try {
  for (const width of [1440, 375, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 1080 },
      reducedMotion: "reduce",
      hasTouch: width < 400,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => evidence.errors.push(error.message));
    await page.goto(url);
    const rings = page.locator('[data-component="radial"]');
    await rings.locator(".recharts-radial-bar-sector").first().waitFor();
    await page.waitForTimeout(250);
    assert.equal(await rings.locator(".recharts-radial-bar-sector").count(), 3);
    assert.equal(await rings.locator('[data-kind-ui="radial-entrance-window"]').count(), 0);
    assert.equal(await rings.locator("table tbody tr").count(), 3);
    for (const label of ["Design", "Build", "Review"])
      await rings
        .locator('[data-kind-ui="radial-label"]')
        .filter({ hasText: label })
        .waitFor({ state: "visible" });
    assert.equal(
      await rings.locator('[data-kind-ui="radial-label"]').first().getAttribute("fill"),
      "white",
    );
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `Overflow at ${width}`,
    );
    await page.screenshot({ path: `artifacts/radial/${width}-preview.png` });
    const gauge = page.locator('[data-component="radial-gauge"]');
    await gauge.scrollIntoViewIfNeeded();
    await gauge
      .locator(".recharts-surface")
      .getByText("72 GB", { exact: true })
      .waitFor({ state: "visible" });
    const before = await gauge.locator(".recharts-radial-bar-sector").getAttribute("d");
    const direction = gauge.getByRole("combobox", { name: "Entrance direction" });
    await direction.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("option", { name: "Anticlockwise", exact: true }).click();
    await gauge.locator(".recharts-radial-bar-sector").waitFor();
    assert.equal(await gauge.locator(".recharts-radial-bar-sector").getAttribute("d"), before);
    await gauge.getByRole("tab", { name: "Code", exact: true }).click();
    const code = gauge.locator(".line-code-block pre");
    assert.equal(
      (await code.textContent()).trim(),
      bundles["radial-gauge"].variants.anticlockwise.source.trim(),
    );
    await gauge.getByRole("button", { name: "Copy prompt" }).click();
    const prompt = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(prompt.includes("/docs/components/radial/"));
    assert.ok(prompt.includes("/variants/anticlockwise/example.tsx"));
    await gauge.getByRole("tab", { name: "Preview", exact: true }).click();
    await page.screenshot({ path: `artifacts/radial/${width}-gauge.png` });
    const stack = page.locator('[data-component="radial-stacked"]');
    await stack.scrollIntoViewIfNeeded();
    const button = stack.getByRole("button", { name: "Committed", exact: true });
    await button.focus();
    await page.keyboard.press("Space");
    assert.equal(await stack.locator(".recharts-radial-bar-sector").count(), 1);
    await page.keyboard.press("Space");
    assert.equal(await stack.locator(".recharts-radial-bar-sector").count(), 2);
    await page.screenshot({ path: `artifacts/radial/${width}-stacked.png` });
    evidence.viewports.push({
      width,
      rings: 3,
      labels: 3,
      gaugeSummary: true,
      sourceCopyParity: true,
      reducedMotion: true,
    });
    // Real vertical wheel/touch must chain to the article over chart and table.
    for (const target of [
      rings.locator(".recharts-surface"),
      page.locator(".line-props-scroll").first(),
    ]) {
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      const start = await page.evaluate(() => scrollY);
      if (width < 400) {
        const cdp = await context.newCDPSession(page);
        await swipeUp(cdp, {
          x: box.x + box.width / 2,
          y: Math.min(box.y + box.height / 2, 800),
          distance: 220,
        });
        await cdp.detach();
      } else {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, 220);
      }
      await page.waitForTimeout(350);
      assert.ok((await page.evaluate(() => scrollY)) > start + 50, `Scroll trapped at ${width}`);
    }
    evidence.scroll.push({ width, chartAndTable: "passed" });
    if (width === 1440) {
      await rings.scrollIntoViewIfNeeded();
      await rings.getByRole("tab", { name: "Code", exact: true }).focus();
      await page.keyboard.press("ArrowLeft");
      await expect(rings.getByRole("tab", { name: "Preview", exact: true })).toBeFocused();
      await expect(rings.getByRole("tab", { name: "Preview", exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await page.keyboard.press("ArrowRight");
      await expect(rings.getByRole("tab", { name: "Code", exact: true })).toBeFocused();
      await expect(rings.getByRole("tab", { name: "Code", exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      const viewport = rings.locator(".line-code-viewport");
      await expect(viewport).toBeVisible();
      const box = await viewport.boundingBox();
      const start = await page.evaluate(() => scrollY);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(250);
      assert.ok(await viewport.evaluate((n) => n.scrollTop > 80));
      assert.equal(await page.evaluate(() => scrollY), start);
      await viewport.evaluate((n) => {
        n.scrollTop = n.scrollHeight;
      });
      await page.waitForTimeout(150);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(350);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(350);
      assert.ok((await page.evaluate(() => scrollY)) > start + 50);
      evidence.scroll.push({ codeInternalAndEdge: "passed" });
      await rings.getByRole("tab", { name: "Preview", exact: true }).click();
      const titleSize = await page
        .locator(".doc-heading h1")
        .evaluate((n) => Number.parseFloat(getComputedStyle(n).fontSize));
      await page.evaluate(() => {
        const nodes = [...document.querySelectorAll("#docs-content *")].filter(
          (n) => n instanceof HTMLElement,
        );
        window.radialTextStyles = nodes.map((n) => [n, n.style.cssText]);
        const sizes = nodes.map((n) => [
          n,
          Number.parseFloat(getComputedStyle(n).fontSize),
          Number.parseFloat(getComputedStyle(n).lineHeight),
        ]);
        for (const [node, font, line] of sizes) {
          node.style.fontSize = `${font * 2}px`;
          if (Number.isFinite(line)) node.style.lineHeight = `${line * 2}px`;
        }
      });
      assert.equal(
        await page
          .locator(".doc-heading h1")
          .evaluate((n) => Number.parseFloat(getComputedStyle(n).fontSize)),
        titleSize * 2,
      );
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: "artifacts/radial/200-percent-text.png" });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.evaluate(() => {
        for (const [node, style] of window.radialTextStyles) node.style.cssText = style;
        delete window.radialTextStyles;
      });
      const toc = page.locator("#nd-toc");
      const tocBox = await toc.boundingBox();
      await page.evaluate(() => scrollTo(0, 0));
      await page.mouse.move(tocBox.x + tocBox.width / 2, tocBox.y + 80);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(300);
      assert.ok((await page.evaluate(() => scrollY)) > 50);
      evidence.interactions.push("keyboard tabs, legend, direction, copy, 200% text, TOC wheel");
    }
    await context.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "no-preference",
  });
  await page.goto(url);
  const gauge = page.locator('[data-component="radial-gauge"]');
  await gauge.scrollIntoViewIfNeeded();
  await gauge.getByRole("combobox").click();
  await page.getByRole("option", { name: "Anticlockwise", exact: true }).click();
  const mask = gauge.locator('[data-kind-ui="radial-entrance-window"]');
  await mask.waitFor({ state: "attached" });
  assert.equal(await mask.getAttribute("data-direction"), "anticlockwise");
  const initial = await mask.getAttribute("d");
  await page.waitForTimeout(120);
  assert.notEqual(await mask.getAttribute("d"), initial);
  await mask.waitFor({ state: "detached" });
  evidence.directions.push("anticlockwise changing mask, completed native sector");
  const shape = gauge.locator(".recharts-radial-bar-sector");
  const box = await shape.boundingBox();
  await page.mouse.move(box.x + 20, box.y + box.height - 12);
  await gauge.locator('[data-kind-ui="chart-tooltip"]').waitFor({ state: "visible" });
  assert.ok(
    (await gauge.locator('[data-kind-ui="chart-tooltip"]').innerText()).includes("72 of 100 GB"),
  );
  await page.mouse.move(290, 20);
  await gauge.locator('[data-kind-ui="chart-tooltip"]').waitFor({ state: "hidden" });
  evidence.interactions.push("pointer tooltip formatter and dismissal");
  await page.goto("http://127.0.0.1:6373/docs/components/line/");
  await page.locator(".recharts-line-curve").first().waitFor();
  await page.getByRole("heading", { name: "Line Chart", exact: true }).waitFor();
  evidence.interactions.push("Line route compatibility");
  assert.deepEqual(evidence.errors, []);
  writeFileSync("artifacts/radial/results.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    "Radial scoped responsive, source/copy, motion, legend, tooltip, scroll and Line checks passed.",
  );
} finally {
  await browser.close();
}
