import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { expectDimmedSeries } from "./interaction-paint.mjs";

const bundles = JSON.parse(readFileSync("generated/line-examples.json", "utf8"));
const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
const evidence = { variants: [], viewports: [], errors: [] };
const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    permissions: ["clipboard-read", "clipboard-write"],
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  p.on("pageerror", (e) => evidence.errors.push(e.message));
  await p.goto(`${origin}/docs/components/line/`);
  await p.locator(".recharts-line-curve").first().waitFor();
  assert.equal(await p.locator(".line-workbench").count(), Object.keys(bundles).length + 1);
  assert.equal(await p.getByText("View data", { exact: true }).count(), 0);
  assert.equal(await p.getByRole("combobox", { name: "Choose component" }).count(), 0);
  assert.equal(await p.locator("#fd-glass-layout").count(), 1);
  for (const [id, bundle] of Object.entries(bundles)) {
    const card = p.locator(`[data-component="${id}"]`);
    for (const [value, variant] of Object.entries(
      bundle.variants ?? { default: { source: bundle.files[`src/examples/${id}/example.tsx`] } },
    )) {
      if (value === "loading") {
        const pending = p.locator(`[data-component="${id}-loading"]`);
        assert.equal(await pending.getByRole("combobox").count(), 0);
        await pending
          .locator('[data-kind-ui="chart-loading-skeleton"]')
          .waitFor({ state: "visible" });
        await pending.getByRole("tab", { name: "Code", exact: true }).click();
        assert.equal(
          (await pending.locator("pre").textContent()).trimEnd(),
          variant.source.trimEnd(),
        );
        await pending.getByRole("button", { name: "Copy Text", exact: true }).click();
        assert.equal(
          (await p.evaluate(() => navigator.clipboard.readText())).trimEnd(),
          variant.source.trimEnd(),
        );
        await pending.locator("button.copy-prompt").click();
        const prompt = await p.evaluate(() => navigator.clipboard.readText());
        const url = prompt.match(/Retrieve the standalone source: (.+)\./)[1];
        assert.equal(
          (await (await context.request.get(url)).text()).trimEnd(),
          variant.source.trimEnd(),
        );
        await pending.getByRole("tab", { name: "Preview", exact: true }).click();
        assert.equal(await card.locator('[data-kind-ui="chart-loading-skeleton"]').count(), 0);
        evidence.variants.push({ id, value, loading: "fixed preview, code and copy parity" });
        continue;
      }
      if (Object.keys(bundle.variants ?? {}).filter((value) => value !== "loading").length > 1) {
        await card.getByRole("combobox", { name: bundle.variantControl }).click();
        await p.getByRole("option", { name: variant.label, exact: true }).click();
      }
      await card.getByRole("tab", { name: "Code", exact: true }).click();
      assert.equal(
        await card
          .getByRole("tabpanel", { name: "Code", exact: true })
          .locator("figcaption")
          .textContent(),
        "example.tsx",
      );
      assert.equal((await card.locator("pre").textContent()).trimEnd(), variant.source.trimEnd());
      await card.getByRole("button", { name: "Copy Text", exact: true }).click();
      assert.equal(
        (await p.evaluate(() => navigator.clipboard.readText())).trimEnd(),
        variant.source.trimEnd(),
      );
      await card.locator("button.copy-prompt").click();
      const prompt = await p.evaluate(() => navigator.clipboard.readText());
      assert.ok(prompt.includes("/docs/components/line/"));
      const selectedUrl = prompt.match(/Retrieve the standalone source: (.+)\./)[1];
      assert.equal(
        (await (await context.request.get(selectedUrl)).text()).trimEnd(),
        variant.source.trimEnd(),
      );
      assert.ok(
        await card.locator(".line-code-viewport").evaluate((n) => n.scrollHeight > n.clientHeight),
      );
      await card.getByRole("tab", { name: "Preview", exact: true }).click();

      await card.locator(".recharts-line-curve").first().waitFor();
      evidence.variants.push({ id, value, copy: "exact", internalScroll: true });
    }
    await card.getByRole("tab", { name: "Preview", exact: true }).focus();
    await p.keyboard.press("ArrowRight");
    await p.waitForFunction(
      (id) =>
        document.querySelector(`[data-component="${id}"] [role="tab"][aria-selected="true"]`)
          ?.textContent === "Code",
      id,
    );
    await p.keyboard.press("Home");
  }
  const comparison = p.locator('[data-component="line-comparison"]');
  await comparison.getByRole("button", { name: "Target", exact: true }).click();
  for (const name of ["Code", "Preview", "Code", "Preview"])
    await comparison.getByRole("tab", { name, exact: true }).click();
  assert.equal(
    await comparison
      .getByRole("button", { name: "Target", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await expectDimmedSeries(comparison, "actual");
  await comparison.getByRole("button", { name: "Target", exact: true }).click();
  for (const width of [1440, 375, 320]) {
    await p.setViewportSize({ width, height: width === 1440 ? 1080 : 812 });
    await p.waitForTimeout(1000);
    for (const enlarged of [false, true]) {
      await p.evaluate(
        (large) => (document.documentElement.style.fontSize = large ? "200%" : ""),
        enlarged,
      );
      await p.waitForTimeout(1000);
      const stats = await p.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
        cards: [...document.querySelectorAll(".line-workbench .chart-example")].map((n) => {
          const svg = n.querySelector(".recharts-surface");
          const b = svg.getBoundingClientRect();
          return {
            width: b.width,
            clipped: [...svg.querySelectorAll(".recharts-cartesian-axis-tick-value")]
              .filter((t) => {
                const r = t.getBoundingClientRect();
                return (
                  r.left < b.left - 0.5 ||
                  r.right > b.right + 0.5 ||
                  r.top < b.top - 0.5 ||
                  r.bottom > b.bottom + 0.5
                );
              })
              .map((t) => t.textContent),
          };
        }),
      }));
      assert.ok(stats.page <= stats.viewport + 2, JSON.stringify(stats));
      assert.ok(
        stats.cards.every((c) => c.width < width && c.clipped.length === 0),
        JSON.stringify(stats),
      );
      evidence.viewports.push({ width, enlarged, ...stats });
    }
    await p.evaluate(() => (document.documentElement.style.fontSize = ""));
    await p.evaluate(() => window.scrollTo(0, 0));
    if (width === 1440 || width === 375)
      await p.screenshot({
        path: `artifacts/screenshots/line-${width === 1440 ? "desktop" : "mobile"}-final.png`,
      });
  }
  await p.setViewportSize({ width: 1440, height: 1080 });
  await p.locator("#nd-sidebar").getByRole("link", { name: "Installation", exact: true }).click();
  await p.waitForURL("**/docs/installation/");
  await p.goBack();
  await p.waitForURL("**/docs/components/line/");
  await p.getByRole("button", { name: "Search", exact: false }).first().click();
  await p.getByRole("dialog").getByRole("combobox").fill("Line");
  await p.getByRole("dialog").getByText("Line Chart", { exact: true }).first().waitFor();
  await p.keyboard.press("Escape");
  await context.close();
  assert.deepEqual(evidence.errors, []);
  writeFileSync("artifacts/glass-line-results.json", JSON.stringify(evidence, null, 2));
  console.log(
    "All Line variants, native code/copy, keyboard tabs, repeated switches, mobile/200% tick bounds, native navigation/history/search passed.",
  );
} finally {
  await browser.close();
}
