import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { swipeUp } from "./touch-swipe.mjs";

const origin = "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/scatter-examples.json", "utf8"));
const browser = await chromium.launch(
  process.env.KIND_DOCS_BROWSER_EXECUTABLE
    ? { executablePath: process.env.KIND_DOCS_BROWSER_EXECUTABLE }
    : {},
);
const evidence = { variants: [], layouts: [], interaction: [], scroll: [], errors: [] };
mkdirSync("artifacts/screenshots", { recursive: true });
const mark = ".recharts-scatter-symbol path:not(defs path)";
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  await page.goto(`${origin}/docs/components/scatter/`);
  const scatter = page.locator('[data-component="scatter"]');
  const bubble = page.locator('[data-component="scatter-bubble"]');
  await scatter.locator(mark).first().waitFor();
  assert.equal(await page.locator(".line-workbench").count(), 3);
  assert.equal(await page.locator("#fd-glass-layout").count(), 1);
  assert.equal(await page.getByText("View data", { exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Download", exact: true }).count(), 0);
  assert.equal(await page.locator(".doc-footer").count(), 0);
  assert.equal(await scatter.locator(mark).count(), 8);
  assert.equal(await scatter.locator('[data-legend-shape="circle"]').count(), 1);
  assert.equal(await scatter.locator('[data-legend-shape="diamond"]').count(), 1);
  assert.equal(await scatter.locator(".sr-only tbody tr").count(), 8);
  assert.equal(await bubble.locator(".sr-only tbody tr").count(), 6);
  for (const [id, bundle] of Object.entries(bundles)) {
    const card = page.locator(`[data-component="${id}"]`);
    for (const [value, option] of Object.entries(
      bundle.variants ?? { default: { source: bundle.files[`src/examples/${id}/example.tsx`] } },
    )) {
      if (bundle.variants) {
        await card.getByRole("combobox", { name: bundle.variantControl }).click();
        await page.getByRole("option", { name: option.label, exact: true }).click();
      }
      await card.getByRole("tab", { name: "Code", exact: true }).click();
      assert.equal(await card.locator("figcaption").textContent(), "example.tsx");
      assert.equal((await card.locator("pre").textContent()).trimEnd(), option.source.trimEnd());
      await card.getByRole("button", { name: "Copy Text", exact: true }).click();
      assert.equal(
        (await page.evaluate(() => navigator.clipboard.readText())).trimEnd(),
        option.source.trimEnd(),
      );
      assert.ok(
        await card
          .locator(".line-code-viewport")
          .evaluate((node) => node.scrollHeight > node.clientHeight),
      );
      await card.getByRole("tab", { name: "Preview", exact: true }).click();
      await card.locator(mark).first().waitFor();
      await card.getByRole("button", { name: /Copy prompt|Copied/ }).click();
      const prompt = await page.evaluate(() => navigator.clipboard.readText());
      assert.ok(prompt.includes("/docs/components/scatter/"));
      const url = prompt.match(/Retrieve the standalone source: (.+)\./)[1];
      assert.equal(
        (await (await context.request.get(url)).text()).trimEnd(),
        option.source.trimEnd(),
      );
      if (id === "scatter-materials") {
        assert.equal(
          (await card.locator('[data-kind-ui="scatter-material"]').count())
            ? await card
                .locator('[data-kind-ui="scatter-material"]')
                .first()
                .getAttribute("data-material")
            : null,
          value === "plain" ? null : value,
        );
      }
      evidence.variants.push({ id, value, sourceAndCopy: "exact" });
    }
    await card.getByRole("tab", { name: "Preview", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      (id) =>
        document.querySelector(`[data-component="${id}"] [role="tab"][aria-selected="true"]`)
          ?.textContent === "Code",
      id,
    );
    assert.equal(
      await card.getByRole("tab", { name: "Code", exact: true }).getAttribute("aria-selected"),
      "true",
    );
    await page.keyboard.press("Home");
    await page.waitForFunction(
      (id) =>
        document.querySelector(`[data-component="${id}"] [role="tab"][aria-selected="true"]`)
          ?.textContent === "Preview",
      id,
    );
  }
  const weekend = scatter.getByRole("button", { name: "Weekend", exact: true });
  await weekend.focus();
  await page.keyboard.press("Space");
  assert.equal(await weekend.getAttribute("aria-pressed"), "false");
  assert.equal(await scatter.locator(mark).count(), 4);
  await page.keyboard.press("Enter");
  assert.equal(await scatter.locator(mark).count(), 8);
  await scatter.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await scatter.locator('[data-kind-ui="chart-tooltip"]').waitFor();
  assert.match(await scatter.locator('[data-kind-ui="chart-tooltip"]').innerText(), /weekday/);
  await page.keyboard.press("Escape");
  const bubbles = bubble.locator(mark);
  assert.equal(await bubbles.count(), 6);
  const sizes = await bubbles.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  assert.equal(new Set(sizes).size, 5);
  assert.equal(sizes[4], sizes[5]);
  for (const [index, expected] of [
    [4, /Classify[\s\S]*0k/],
    [5, /Extract[\s\S]*No data/],
  ]) {
    await bubbles.nth(index).hover();
    await page.waitForTimeout(150);
    assert.match(await bubble.locator('[data-kind-ui="chart-tooltip"]').innerText(), expected);
  }
  evidence.interaction.push(
    "Legend Enter/Space; first-series arrows/Escape; raw zero/missing with equal native minimum geometry",
  );
  await page.mouse.move(0, 0);
  const material = page.locator('[data-component="scatter-materials"]');
  await material.getByRole("combobox", { name: "Material" }).click();
  await page.getByRole("option", { name: "Clay", exact: true }).click();
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1080 : 812 });
    for (const enlarged of [false, true]) {
      await page.evaluate((large) => {
        document.documentElement.style.fontSize = large ? "200%" : "";
      }, enlarged);
      await page.waitForTimeout(500);
      const stats = await page.locator(".chart-example .recharts-surface").evaluateAll((svgs) =>
        svgs.map((svg) => {
          const bounds = svg.getBoundingClientRect();
          const ticks = [...svg.querySelectorAll(".recharts-cartesian-axis-tick-value")];
          const clipped = ticks
            .filter((node) => {
              const rect = node.getBoundingClientRect();
              return (
                rect.left < bounds.left - 0.5 ||
                rect.right > bounds.right + 0.5 ||
                rect.top < bounds.top - 0.5 ||
                rect.bottom > bounds.bottom + 0.5
              );
            })
            .map((node) => node.textContent);
          const overlaps = [...svg.querySelectorAll(".recharts-xAxis")].flatMap((axis) => {
            const values = [...axis.querySelectorAll(".recharts-cartesian-axis-tick-value")]
              .map((node) => ({ text: node.textContent, rect: node.getBoundingClientRect() }))
              .sort((a, b) => a.rect.left - b.rect.left);
            return values
              .slice(1)
              .filter((value, index) => values[index].rect.right > value.rect.left)
              .map((value) => value.text);
          });
          return { clipped, overlaps, width: bounds.width };
        }),
      );
      assert.ok(
        stats.every((item) => !item.clipped.length && !item.overlaps.length),
        JSON.stringify({ width, enlarged, stats }),
      );
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        width: innerWidth,
      }));
      await page.screenshot({
        path: `artifacts/screenshots/scatter-${width}${enlarged ? "-text200" : ""}.png`,
        fullPage: !enlarged,
      });
      assert.ok(
        dimensions.scroll <= dimensions.width + 1,
        JSON.stringify({ width, enlarged, dimensions }),
      );
      await page.evaluate(() => {
        scrollTo(0, 0);
        document.activeElement?.blur();
      });
      await page.screenshot({
        path: `artifacts/screenshots/scatter-${width}${enlarged ? "-text200" : ""}.png`,
        fullPage: true,
      });
      evidence.layouts.push({ width, enlarged, stats });
    }
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
    scrollTo(0, 0);
  });
  await page.setViewportSize({ width: 1440, height: 1080 });
  for (const target of [
    scatter.locator(".chart-example"),
    page.locator("#nd-toc"),
    page.locator(".doc-heading"),
  ]) {
    await page.evaluate(() => scrollTo(0, 0));
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 120));
    await page.mouse.wheel(0, 260);
    await page.waitForTimeout(300);
    assert.ok(await page.evaluate(() => scrollY > 100));
  }
  await page.evaluate(() => scrollTo(0, 0));
  await scatter.getByRole("tab", { name: "Code", exact: true }).click();
  const code = scatter.locator(".line-code-viewport");
  const box = await code.boundingBox();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(200);
  assert.ok(await code.evaluate((node) => node.scrollTop > 100));
  assert.equal(await page.evaluate(() => scrollY), before);
  await code.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => scrollY > 100));
  evidence.scroll.push("Chart/article/TOC wheel; internal code scroll and edge chaining");
  await page.evaluate(() => scrollTo(0, 0));
  await scatter.getByRole("tab", { name: "Preview", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await scatter.locator(mark).first().waitFor();
  assert.equal(await page.locator('[data-kind-ui="line-frame"][data-motion="on"]').count(), 3);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('[data-kind-ui="line-frame"][data-motion="off"]').count(), 3);
  await page.goto(`${origin}/docs/components/line/`);
  await page.locator(".recharts-line-curve").first().waitFor();
  assert.equal(await page.locator(".line-workbench").count(), 5);
  assert.equal(await page.locator("#fd-glass-layout").count(), 1);
  await context.close();
  const mobile = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const phone = await mobile.newPage();
  await phone.goto(`${origin}/docs/components/scatter/`);
  await phone.locator(mark).first().waitFor();
  const cdp = await mobile.newCDPSession(phone);
  await swipeUp(cdp, { x: 200, y: 500, distance: 300 });
  await phone.waitForTimeout(400);
  assert.ok(await phone.evaluate(() => scrollY > 100));
  evidence.scroll.push("Real mobile touch scroll over chart");
  await mobile.close();
  assert.deepEqual(evidence.errors, []);
  writeFileSync("artifacts/scatter-browser-results.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    "Scatter numeric geometry, variants/copy, legend/tooltip keyboard, responsive/200% ticks, reduced motion, scroll and Line shell checks passed.",
  );
} finally {
  await browser.close();
}
