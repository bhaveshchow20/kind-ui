import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { swipeUp } from "./touch-swipe.mjs";

mkdirSync("artifacts/radar", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const errors = [];
const evidence = {};
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:6373/docs/components/radar/");
  const primary = page.locator('[data-component="radar"]');
  await primary.locator(".recharts-radar-polygon path").first().waitFor();
  const window = primary.locator('[data-kind-ui="radar-entrance-window"]');
  if (await window.count()) {
    const initial = Number(await window.first().getAttribute("r"));
    assert.ok(initial >= 0);
    await window.first().waitFor({ state: "detached" });
    evidence.entrance = "center-out circle observed and completed";
  } else throw new Error("Entrance mask was not observed");
  assert.equal(await primary.locator(".recharts-radar-polygon path").count(), 2);
  assert.equal(await primary.locator("tbody tr").count(), 6);
  assert.equal(await primary.getByRole("button", { name: /Highlight/ }).count(), 2);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "artifacts/radar/desktop.png", fullPage: true });
  await page.screenshot({ path: "artifacts/radar/desktop-viewport.png" });

  const selection = page.locator('[data-component="radar-selection"]');
  await selection.scrollIntoViewIfNeeded();
  const studio = selection.getByRole("button", { name: "Studio", exact: true });
  const field = selection.getByRole("button", { name: "Field", exact: true });
  await studio.focus();
  await page.keyboard.press("Enter");
  assert.equal(await studio.getAttribute("aria-pressed"), "true");
  assert.equal(await field.getAttribute("aria-pressed"), "false");
  await page.mouse.move(0, 0);
  assert.equal(await studio.getAttribute("aria-pressed"), "true");
  await page.keyboard.press("Space");
  assert.equal(await studio.getAttribute("aria-pressed"), "false");
  await field.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  assert.equal(await field.getAttribute("aria-pressed"), "false");
  // Click within the outer Field polygon, clear, then inspect a native spoke.
  const path = selection.locator(
    '[data-kind-ui="series-interaction"][data-series="field"] .recharts-radar-polygon path',
  );
  await path.click({ position: { x: 50, y: 30 }, force: true });
  assert.equal(await field.getAttribute("aria-pressed"), "true");
  const surface = selection.locator(".recharts-surface");
  const box = await surface.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.27);
  await selection.locator('[data-kind-ui="chart-tooltip"]').waitFor();
  const tooltip = selection.locator('[data-kind-ui="chart-tooltip"]');
  assert.match(await tooltip.textContent(), /Studio/);
  assert.match(await tooltip.textContent(), /Field/);
  assert.equal(await field.getAttribute("aria-pressed"), "true");
  await field.focus();
  await page.keyboard.press("Escape");
  evidence.selection = "Enter, Space, Escape and polygon click; spoke tooltip retains both series";

  const material = page.locator('[data-component="radar-materials"]');
  await material.scrollIntoViewIfNeeded();
  await material.getByRole("combobox", { name: "Material" }).click();
  await page.getByRole("option", { name: "Clay", exact: true }).click();
  await material.getByRole("tab", { name: "Code", exact: true }).click();
  assert.match(await material.locator("pre").textContent(), /appearance = "clay"/);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await material.getByRole("button", { name: "Copy Text", exact: true }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const bundle = JSON.parse(readFileSync("generated/radar-examples.json", "utf8"));
  assert.equal(copied.trim(), bundle["radar-materials"].variants.clay.source.trim());
  await material.getByRole("button", { name: "Copy prompt", exact: true }).click();
  assert.match(
    await page.evaluate(() => navigator.clipboard.readText()),
    /radar-materials\/variants\/clay\/example.tsx/,
  );
  const viewport = material.locator(".line-code-viewport");
  const dimensions = await viewport.evaluate((node) => ({
    height: node.clientHeight,
    scroll: node.scrollHeight,
  }));
  assert.ok(dimensions.scroll > dimensions.height);
  await viewport.hover();
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(200);
  assert.ok((await viewport.evaluate((node) => node.scrollTop)) > 0);
  await viewport.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  const before = await page.evaluate(() => scrollY);
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollHeight - innerHeight > scrollY + 350),
  );
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(200);
  // Exercise the boundary handoff across two wheel events, as Line and Area do.
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(200);
  assert.ok((await page.evaluate(() => scrollY)) > before);
  evidence.code = "Clay source parity, internal overflow and edge wheel chaining";

  for (const width of [320, 375]) {
    const mobile = await browser.newPage({
      viewport: { width, height: 812 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    await mobile.goto("http://127.0.0.1:6373/docs/components/radar/");
    await mobile.locator(".recharts-radar-polygon path").first().waitFor();
    assert.equal(await mobile.locator('[data-kind-ui="radar-entrance-window"]').count(), 0);
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const initial = await mobile.evaluate(() => scrollY);
    const cdp = await mobile.context().newCDPSession(mobile);
    await swipeUp(cdp, { x: width / 2, y: 510, distance: 200 });
    await mobile.waitForTimeout(400);
    assert.ok((await mobile.evaluate(() => scrollY)) > initial);
    await mobile.evaluate(() => scrollTo(0, 0));
    await mobile.mouse.move(0, 0);
    await mobile.waitForTimeout(250);
    await mobile.screenshot({ path: `artifacts/radar/mobile-${width}.png`, fullPage: true });
    await mobile.close();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:6373/docs/components/radar/");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await page.locator(".recharts-radar-polygon path").first().waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.equal(await page.locator('[data-kind-ui="radar-entrance-window"]').count(), 0);
  await page.screenshot({ path: "artifacts/radar/text-200.png", fullPage: true });
  await page.screenshot({ path: "artifacts/radar/text-200-viewport.png" });
  await page.goto("http://127.0.0.1:6373/docs/components/line/");
  await page.locator(".recharts-line-curve").first().waitFor();
  assert.ok(await page.getByRole("link", { name: "Radar Chart", exact: true }).count());
  assert.deepEqual(errors, []);
  evidence.mobile = "320/375 touch scrolling and reduced motion; 200% text no document overflow";
  evidence.line = "Line route and Radar sidebar registration remain usable";
  writeFileSync("artifacts/radar/results.json", JSON.stringify(evidence, null, 2));
  console.log("Scoped Radar browser checks passed.");
} finally {
  await browser.close();
}
