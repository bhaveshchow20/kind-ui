import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { assertToc } from "./docs-browser-contracts.mjs";
import { swipeUp } from "./touch-swipe.mjs";

const b = await chromium.launch();
const evidence = { wheel: [], touch: [], navigation: [], errors: [] };
const context = await b.newContext({
  viewport: { width: 1440, height: 1080 },
  reducedMotion: "no-preference",
});
const p = await context.newPage();
p.on("pageerror", (e) => evidence.errors.push(e.message));
const url = `${process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373"}/docs/components/line/`;
try {
  await p.goto(url);
  await p.locator(".recharts-line-curve").first().waitFor();
  await p.waitForTimeout(900);
  assert.ok(
    (await p
      .locator("#nd-sidebar")
      .getByRole("button", { name: "Components", exact: true })
      .count()) >= 1,
  );
  const sidebar = p.locator("#nd-sidebar");
  const toc = p.locator("#nd-toc");
  assert.equal(await toc.locator("h3").textContent(), "On this page");
  await assertToc(p, [
    "Usage",
    "Curve types",
    "Multiple series",
    "Dots and labels",
    "Materials",
    "API reference",
    "Shared components",
    "Presentation options",
  ]);
  assert.equal(
    await toc
      .locator("a")
      .first()
      .evaluate((n) => getComputedStyle(n.querySelector("span")).opacity),
    "1",
  );
  for (const [label, x, y] of [
    ["left-content", 320, 350],
    ["graph-center", 750, 475],
    ["right-TOC", 1280, 135],
  ]) {
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(150);
    const before = await p.evaluate(() => scrollY);
    await p.mouse.move(x, y);
    await p.mouse.wheel(0, 260);
    await p.waitForTimeout(400);
    const after = await p.evaluate(() => scrollY);
    assert.ok(after > before + 100, `${label} wheel trapped: ${after}`);
    assert.ok(
      await p
        .locator(".line-workbench .preview-panel")
        .first()
        .evaluate((n) => n.scrollTop === 0 && getComputedStyle(n).overflowY === "visible"),
    );
    evidence.wheel.push({ label, before, after });
  }
  const top1 = await toc.evaluate((n) => n.getBoundingClientRect().top);
  await p.evaluate(() => scrollTo(0, 1600));
  await p.waitForTimeout(150);
  const top2 = await toc.evaluate((n) => n.getBoundingClientRect().top);
  assert.ok(Math.abs(top1 - top2) < 1);
  evidence.navigation.push({ stickyTOC: top2 });
  await p.evaluate(() => scrollTo(0, 0));
  const card = p.locator('[data-component="line"]');
  await card.getByRole("tab", { name: "Code", exact: true }).click();
  const code = card.locator(".line-code-viewport");
  const box = await code.boundingBox();
  const pageBefore = await p.evaluate(() => scrollY);
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.wheel(0, 200);
  await p.waitForTimeout(300);
  assert.ok((await code.evaluate((n) => n.scrollTop)) > 100);
  assert.equal(await p.evaluate(() => scrollY), pageBefore);
  await code.evaluate((n) => (n.scrollTop = n.scrollHeight));
  await p.mouse.move(1160, 400);
  await p.waitForTimeout(700);
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.wheel(0, 300);
  await p.waitForTimeout(300);
  await p.mouse.wheel(0, 300);
  await p.waitForTimeout(300);
  assert.ok((await p.evaluate(() => scrollY)) > pageBefore + 100);
  evidence.wheel.push({ label: "code-internal-and-boundary", passed: true });
  await p.evaluate(() => scrollTo(0, 0));
  await card.getByRole("tab", { name: "Preview", exact: true }).click();
  await sidebar.getByRole("button", { name: "Components", exact: true }).first().click();
  await p.getByRole("link", { name: "Guides", exact: true }).click();
  await p.waitForURL("**/docs/guides/materials/");
  await p.goBack();
  await p.waitForURL("**/docs/components/line/");
  await sidebar.getByRole("button", { name: "Search", exact: false }).click();
  await p.getByRole("dialog").getByRole("combobox").fill("line");
  await p.getByRole("dialog").getByText("Line Chart", { exact: true }).first().waitFor();
  await p.keyboard.press("Escape");
  await sidebar.getByRole("button", { name: "Toggle Theme", exact: false }).click();
  await p.waitForFunction(() => document.documentElement.classList.contains("dark"));
  const curve = p.locator('[data-component="line-smooth"]');
  await curve.scrollIntoViewIfNeeded();
  const select = curve.getByRole("combobox", { name: "Curve" });
  await select.click();
  await p.keyboard.press("ArrowDown");
  await p.keyboard.press("Escape");
  assert.ok(await select.evaluate((n) => n === document.activeElement));
  await curve.screenshot({
    path: "artifacts/screenshots/line-curve-final.png",
  });
  evidence.navigation.push({
    sidebarDropdown: true,
    search: true,
    theme: true,
    selectEscapeFocus: true,
  });
  await p.evaluate(() => scrollTo(0, 0));
  await p.screenshot({
    path: "artifacts/screenshots/line-desktop-final.png",
  });
  await context.close();
  const mobile = await b.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const m = await mobile.newPage();
  await m.goto(url);
  await m.locator(".recharts-line-curve").first().waitFor();
  await m.waitForTimeout(400);
  const cdp = await mobile.newCDPSession(m);
  await swipeUp(cdp, {
    x: 210,
    y: 450,
    distance: 250,
  });
  await m.waitForTimeout(300);
  const touchScroll = await m.evaluate(() => scrollY);
  assert.ok(touchScroll > 100);
  evidence.touch.push({ graphSwipe: touchScroll });
  await m.evaluate(() => scrollTo(0, 0));
  await m.getByRole("button", { name: "Open Sidebar", exact: true }).click();
  await m.waitForTimeout(300);
  assert.equal(
    await m.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Close Sidebar",
  );
  await m.keyboard.press("Escape");
  await m.waitForTimeout(300);
  assert.equal(
    await m
      .getByRole("button", { name: "Open Sidebar", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(
    await m.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Open Sidebar",
  );
  await m.getByRole("button", { name: "Open Sidebar", exact: true }).click();
  await m.getByRole("button", { name: "Search", exact: false }).click();
  await m.getByRole("dialog").getByRole("combobox").fill("line");
  await m.getByRole("dialog").getByText("Line Chart", { exact: true }).first().waitFor();
  await m.keyboard.press("Escape");
  await m.getByRole("button", { name: "Close Sidebar", exact: true }).click();
  await m.waitForTimeout(300);
  await m.screenshot({
    path: "artifacts/screenshots/line-mobile-final.png",
  });
  await mobile.close();
  assert.deepEqual(evidence.errors, []);
  writeFileSync("artifacts/v7-scroll-results.json", JSON.stringify(evidence, null, 2));
  console.log(
    "Real wheel over content/plot/TOC, code scroll + edge chaining, sticky TOC, native sidebar/dropdown/search/theme, Radix focus and mobile touch passed.",
  );
} finally {
  await b.close();
}
