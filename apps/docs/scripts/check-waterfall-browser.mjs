import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { swipeUp } from "./touch-swipe.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/waterfall-examples.json", "utf8"));
mkdirSync("artifacts/waterfall", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
const evidence = { viewports: [], variants: [], keyboard: [], errors: [] };
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    permissions: ["clipboard-read", "clipboard-write"],
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  p.on("pageerror", (e) => evidence.errors.push(e.message));
  await p.goto(`${origin}/docs/components/waterfall/`);
  await p.locator(".recharts-bar-rectangle").first().waitFor();
  assert.equal(await p.locator(".line-workbench").count(), Object.keys(bundles).length + 1);
  assert.equal(await p.getByText("View data", { exact: true }).count(), 0);
  assert.equal(await p.locator('[data-kind-ui="bar-reveal"]').count(), 0);
  await p.screenshot({ path: "artifacts/waterfall/desktop.png", fullPage: true });
  await p
    .locator('[data-component="waterfall"]')
    .screenshot({ path: "artifacts/waterfall/chart-desktop.png" });
  for (const [id, b] of Object.entries(bundles)) {
    const card = p.locator(`[data-component="${id}"]`);
    assert.equal(await card.locator("table tbody tr").count(), b.dataAlternative.rows.length);
    const data = await card.locator("table tbody").textContent();
    for (const r of b.dataAlternative.rows)
      for (const k of Object.keys(b.dataAlternative.columns))
        assert.ok(data.includes(String(r[k])));
    for (const [value, v] of Object.entries(
      b.variants ?? { default: { source: b.files[`src/examples/${id}/example.tsx`] } },
    )) {
      if (value === "loading") {
        const pending = p.locator(`[data-component="${id}-loading"]`);
        assert.equal(await pending.getByRole("combobox").count(), 0);
        await pending
          .locator('[data-kind-ui="chart-loading-skeleton"]')
          .waitFor({ state: "visible" });
        await pending.getByRole("tab", { name: "Code", exact: true }).click();
        assert.equal((await pending.locator("pre").textContent()).trimEnd(), v.source.trimEnd());
        await pending.getByRole("button", { name: "Copy Text", exact: true }).click();
        assert.equal(
          (await p.evaluate(() => navigator.clipboard.readText())).trimEnd(),
          v.source.trimEnd(),
        );
        await pending.locator("button.copy-prompt").click();
        const prompt = await p.evaluate(() => navigator.clipboard.readText());
        const url = prompt.match(/Retrieve the standalone source: (.+)\./)[1];
        assert.equal((await (await context.request.get(url)).text()).trimEnd(), v.source.trimEnd());
        await pending.getByRole("tab", { name: "Preview", exact: true }).click();
        assert.equal(await card.locator('[data-kind-ui="chart-loading-skeleton"]').count(), 0);
        evidence.variants.push({ id, value, loading: "fixed preview, code and copy parity" });
        continue;
      }
      if (Object.keys(b.variants ?? {}).filter((value) => value !== "loading").length > 1) {
        await card.getByRole("combobox", { name: b.variantControl }).click();
        await p.getByRole("option", { name: v.label, exact: true }).click();
      }
      await card.getByRole("tab", { name: "Code", exact: true }).click();
      assert.equal((await card.locator("pre").textContent()).trimEnd(), v.source.trimEnd());
      await card.getByRole("button", { name: "Copy Text", exact: true }).click();
      assert.equal(
        (await p.evaluate(() => navigator.clipboard.readText())).trimEnd(),
        v.source.trimEnd(),
      );
      await card.getByRole("tab", { name: "Preview", exact: true }).click();

      if (id === "waterfall-materials" && value !== "default")
        assert.equal(
          await card.locator(`[data-kind-ui="bar-material"][data-material="${value}"]`).count(),
          1,
        );
      if (id === "waterfall-materials" && value === "default")
        assert.equal(await card.locator('[data-kind-ui="bar-material"]').count(), 0);
      evidence.variants.push({ id, value, parity: "passed" });
    }
  }
  const first = p.locator('[data-component="waterfall"]');
  const plot = first.locator(".recharts-surface");
  await plot.scrollIntoViewIfNeeded();
  await plot.focus();
  await p.waitForTimeout(100);
  await p.keyboard.press("ArrowLeft");
  await p.waitForTimeout(150);
  await p.keyboard.press("ArrowLeft");
  await p.waitForTimeout(150);
  await p.screenshot({ path: "artifacts/waterfall/tooltip.png", fullPage: false });
  evidence.keyboard.push({
    tooltip: await first.locator('[data-kind-ui="tooltip-frame"]').textContent(),
  });
  assert.match(evidence.keyboard[0].tooltip, /Change:/);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(150);
  const tooltip = first.locator(".recharts-tooltip-wrapper");
  assert.equal(await tooltip.evaluate((n) => getComputedStyle(n).visibility), "hidden");
  const box = await plot.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.wheel(0, 450);
  await p.waitForTimeout(300);
  assert.ok((await p.evaluate(() => window.scrollY)) > 100);
  evidence.scrolling = "chart wheel reaches document";
  for (const width of [375, 320]) {
    await p.setViewportSize({ width, height: 812 });
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(250);
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await p.screenshot({ path: `artifacts/waterfall/mobile-${width}.png`, fullPage: true });
    evidence.viewports.push({ width, horizontalOverflow: false });
  }
  await p.setViewportSize({ width: 720, height: 540 });
  await p.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
    window.scrollTo(0, 0);
  });
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.screenshot({ path: "artifacts/waterfall/text-200.png", fullPage: true });
  await p.evaluate(() => (document.documentElement.style.fontSize = ""));
  await p.setViewportSize({ width: 1440, height: 1080 });
  await first.scrollIntoViewIfNeeded();
  await first.getByRole("tab", { name: "Code", exact: true }).click();
  const code = first.locator(".line-code-viewport");
  const codeBox = await code.boundingBox();
  const beforeCode = await p.evaluate(() => scrollY);
  await p.mouse.move(codeBox.x + codeBox.width / 2, codeBox.y + codeBox.height / 2);
  await p.mouse.wheel(0, 220);
  await p.waitForTimeout(350);
  assert.ok(await code.evaluate((n) => n.scrollTop > 100));
  assert.equal(await p.evaluate(() => scrollY), beforeCode);
  await code.evaluate((n) => {
    n.scrollTop = n.scrollHeight;
  });
  await p.waitForTimeout(700);
  await p.mouse.wheel(0, 350);
  await p.waitForTimeout(350);
  await p.mouse.wheel(0, 350);
  await p.waitForTimeout(350);
  assert.ok((await p.evaluate(() => scrollY)) > beforeCode + 100);
  await first.getByRole("tab", { name: "Preview", exact: true }).click();
  const materialSelect = p.getByRole("combobox", { name: "Material" });
  await materialSelect.click();
  await p.keyboard.press("ArrowDown");
  await p.keyboard.press("Escape");
  assert.ok(await materialSelect.evaluate((n) => n === document.activeElement));
  for (const selector of [".line-props-scroll", "#nd-toc"]) {
    await p.evaluate(() => scrollTo(0, 0));
    const target = p.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    const bb = await target.boundingBox();
    const startScroll = await p.evaluate(() => scrollY);
    await p.mouse.move(bb.x + bb.width / 2, bb.y + Math.min(bb.height / 2, 100));
    await p.mouse.wheel(0, 300);
    await p.waitForTimeout(350);
    assert.ok((await p.evaluate(() => scrollY)) > startScroll + 100);
  }
  evidence.scrollRegions = "code internal + boundary, API table and TOC passed";
  const mobile = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const mp = await mobile.newPage();
  await mp.goto(`${origin}/docs/components/waterfall/`);
  await mp.locator(".recharts-bar-rectangle").first().waitFor();
  const cdp = await mobile.newCDPSession(mp);
  await swipeUp(cdp, { x: 190, y: 450, distance: 280 });
  await mp.waitForTimeout(400);
  assert.ok((await mp.evaluate(() => scrollY)) > 100);
  evidence.touch = "chart swipe reaches document";
  await mobile.close();
  await p.goto(`${origin}/docs/components/line/`);
  await p.locator(".recharts-line-curve").first().waitFor();
  assert.equal(await p.locator("#fd-glass-layout").count(), 1);
  assert.equal(
    await p.locator(".line-workbench").count(),
    Object.keys(JSON.parse(readFileSync("generated/line-examples.json", "utf8"))).length + 1,
  );
  evidence.lineCompatibility = "passed";
  const motion = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "no-preference",
  });
  await motion.goto(`${origin}/docs/components/waterfall/`);
  await motion.locator('[data-kind-ui="bar-reveal"]').first().waitFor({ state: "attached" });
  evidence.motion = "native chart reveal present; reduced motion absent";
  assert.deepEqual(evidence.errors, []);
} finally {
  writeFileSync("artifacts/waterfall/browser.json", JSON.stringify(evidence, null, 2));
  await browser.close();
}
