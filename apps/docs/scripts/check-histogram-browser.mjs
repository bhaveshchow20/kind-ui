import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { swipeUp } from "./touch-swipe.mjs";

const origin = "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/histogram-examples.json", "utf8"));
mkdirSync("artifacts/screenshots", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
const evidence = { layouts: [], widths: [], interactions: [], errors: [] };
try {
  for (const [width, text] of [
    [1440, 100],
    [375, 100],
    [320, 100],
    [375, 200],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => evidence.errors.push(error.message));
    await page.goto(`${origin}/docs/components/histogram/`);
    await page.locator('[data-kind-ui="histogram-bin"]').first().waitFor();
    if (text === 200) await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `page overflow at ${width}/${text}: ${overflow}`);
    const count = page.locator('[data-component="histogram"]');
    assert.equal(await count.locator('[data-kind-ui="histogram-bin"]').count(), 5);
    assert.equal(await count.locator("table tbody tr").count(), 5);
    assert.match(await count.textContent(), /36 accepted.*1 missing.*0 nonfinite.*1 outside/s);
    await page.screenshot({
      path: `artifacts/screenshots/histogram-${width}-${text}.png`,
      fullPage: true,
    });
    await page.screenshot({
      path: `artifacts/screenshots/histogram-viewport-${width}-${text}.png`,
    });
    assert.equal(await count.locator('[data-kind-ui="bar-reveal"]').count(), 0);
    evidence.layouts.push({ width, text, overflow });
    if (width === 1440) {
      const density = page.locator('[data-component="histogram-density"]');
      const widths = await density
        .locator('[data-kind-ui="histogram-bin"]')
        .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute("width"))));
      assert.equal(widths.length, 4);
      assert.ok(Math.abs(widths[1] / widths[0] - 1) < 0.01);
      assert.ok(Math.abs(widths[2] / widths[0] - 2) < 0.01);
      assert.ok(Math.abs(widths[3] / widths[0] - 4) < 0.01);
      evidence.widths = widths;
      const plot = count.locator('[role="application"]');
      await plot.focus();
      await page.keyboard.press("ArrowRight");
      const tooltip = count.locator('[data-kind-ui="chart-tooltip"]');
      await tooltip.waitFor();
      assert.match(await tooltip.textContent(), /40–80 ms.*15/s);
      await page.keyboard.press("ArrowLeft");
      assert.match(await tooltip.textContent(), /0–40 ms.*12/s);
      await tooltip.screenshot({ path: "artifacts/screenshots/histogram-tooltip.png" });
      await page.keyboard.press("Escape");
      await tooltip.waitFor({ state: "hidden" });
      await count.getByRole("tab", { name: "Preview", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction(
        () =>
          document.querySelector('[data-component="histogram"] [role="tab"][aria-selected="true"]')
            ?.textContent === "Code",
      );
      const code = count.locator(".line-code-viewport");
      const box = await code.boundingBox();
      const before = await page.evaluate(() => scrollY);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(250);
      assert.ok(await code.evaluate((n) => n.scrollTop > 100));
      assert.equal(await page.evaluate(() => scrollY), before);
      await code.evaluate((n) => {
        n.scrollTop = n.scrollHeight;
      });
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(350);
      assert.ok(await page.evaluate((prior) => scrollY > prior + 100, before));
      const material = page.locator('[data-component="histogram-materials"]');
      for (const [value, variant] of Object.entries(bundles["histogram-materials"].variants)) {
        await material.getByRole("combobox", { name: "Material" }).click();
        await page.getByRole("option", { name: variant.label, exact: true }).click();
        await material.getByRole("tab", { name: "Code", exact: true }).click();
        assert.equal(
          (await material.locator(".line-code-block pre").textContent()).trim(),
          variant.source.trim(),
        );
        await material.locator(".copy-prompt").click();
        assert.ok(
          (await page.evaluate(() => navigator.clipboard.readText())).includes(
            `/variants/${value}/example.tsx`,
          ),
        );
        await material.getByRole("tab", { name: "Preview", exact: true }).click();
        if (value !== "default")
          assert.equal(
            await material
              .locator(`[data-kind-ui="histogram-material"][data-material="${value}"]`)
              .count(),
            4,
          );
      }
      await page.evaluate(() => scrollTo(0, 0));
      await count.getByRole("tab", { name: "Preview", exact: true }).click();
      const chartBox = await count.boundingBox();
      await page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + 180);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(300);
      assert.ok(await page.evaluate(() => scrollY > 100));
      for (const selector of ["#nd-toc", '.line-props-scroll[aria-label="HistogramChart props"]']) {
        const region = page.locator(selector);
        await region.scrollIntoViewIfNeeded();
        const box = await region.boundingBox();
        const start = await page.evaluate(() => scrollY);
        await page.mouse.move(box.x + box.width / 2, box.y + Math.min(80, box.height / 2));
        await page.mouse.wheel(0, 260);
        await page.waitForTimeout(300);
        assert.ok(
          await page.evaluate((before) => scrollY > before + 100, start),
          `${selector} traps wheel`,
        );
      }
      await page.goto(`${origin}/docs/components/line/`);
      await page.locator(".recharts-line-curve").first().waitFor();
      assert.equal(await page.getByRole("heading", { name: "Line Chart", exact: true }).count(), 1);
      evidence.interactions.push(
        "keyboard tooltip/Escape, gliding tabs, variant/code/copy parity, code edge chaining, chart wheel, Line compatibility",
      );
    }
    await context.close();
  }
  const motionPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await motionPage.goto(`${origin}/docs/components/histogram/`);
  const reveal = motionPage.locator('[data-component="histogram"] [data-kind-ui="bar-reveal"]');
  await reveal.waitFor({ state: "attached" });
  const initial = Number.parseFloat(await reveal.getAttribute("height"));
  assert.ok(initial < 212, `native Bar entrance already completed: ${initial}`);
  await reveal.waitFor({ state: "detached" });
  assert.equal(
    await motionPage.locator('[data-component="histogram"] [data-kind-ui="histogram-bin"]').count(),
    5,
  );
  evidence.interactions.push(`native Bar entrance height ${initial}; reduced-motion clips absent`);
  await motionPage.close();
  const touch = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await touch.newPage();
  await page.goto(`${origin}/docs/components/histogram/`);
  await page.locator('[data-kind-ui="histogram-bin"]').first().waitFor();
  const cdp = await touch.newCDPSession(page);
  await swipeUp(cdp, { x: 180, y: 500, distance: 220 });
  assert.ok(await page.evaluate(() => scrollY > 80));
  evidence.interactions.push("mobile chart touch scroll");
  assert.deepEqual(evidence.errors, []);
  writeFileSync(
    "artifacts/histogram-browser-results.json",
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
