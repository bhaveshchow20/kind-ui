import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { assertToc } from "./docs-browser-contracts.mjs";
import { expectDimmedSeries } from "./interaction-paint.mjs";

const bundles = JSON.parse(readFileSync("generated/area-examples.json", "utf8"));
const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
const evidence = { variants: [], viewports: [], keyboard: [], errors: [] };
const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    permissions: ["clipboard-read", "clipboard-write"],
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  p.setDefaultTimeout(15000);
  p.on("pageerror", (e) => evidence.errors.push(e.message));
  await p.goto(`${origin}/docs/components/area/`);
  await p.locator(".recharts-area-area").first().waitFor();
  assert.equal(await p.locator(".line-workbench").count(), Object.keys(bundles).length + 1);
  assert.equal(await p.getByText("View data", { exact: true }).count(), 0);
  assert.equal(await p.getByRole("combobox", { name: "Choose component" }).count(), 0);
  assert.equal(await p.locator("#fd-glass-layout").count(), 1);
  assert.equal(await p.locator(".doc-footer").count(), 0);
  assert.equal(await p.getByRole("heading", { name: "Basic", exact: true }).count(), 0);
  assert.equal(await p.locator("[data-area-reveal]").count(), 0);
  await assertToc(p, [
    "Usage",
    "Curve types",
    "Stacked series",
    "Materials",
    "Loading State",
    "API reference",
    "Shared components",
  ]);
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
      assert.equal(await card.locator("figcaption").textContent(), "example.tsx");
      assert.equal((await card.locator("pre").textContent()).trimEnd(), variant.source.trimEnd());
      await card.getByRole("button", { name: "Copy Text", exact: true }).click();
      assert.equal(
        (await p.evaluate(() => navigator.clipboard.readText())).trimEnd(),
        variant.source.trimEnd(),
      );
      assert.ok(
        await card.locator(".line-code-viewport").evaluate((n) => n.scrollHeight > n.clientHeight),
      );
      await card.getByRole("tab", { name: "Preview", exact: true }).click();

      await card.locator(".recharts-area-area").first().waitFor();
      await card.locator("button.copy-prompt").click();
      const prompt = await p.evaluate(() => navigator.clipboard.readText());
      assert.ok(prompt.includes("/docs/components/area/"));
      const selectedUrl = prompt.match(/Retrieve the standalone source: (.+)\./)[1];
      assert.equal(
        (await (await context.request.get(selectedUrl)).text()).trimEnd(),
        variant.source.trimEnd(),
      );
      const path = await card.locator(".recharts-area-area").first().getAttribute("d");
      assert.ok(path && !path.includes("NaN"));
      if (id === "area-materials") {
        assert.equal(
          await card.evaluate(
            (n) =>
              n.querySelector('[data-kind-ui="area-material"]')?.getAttribute("data-material") ??
              null,
          ),
          value === "default" ? null : value,
        );
      }
      evidence.variants.push({ id, value, copy: "exact", internalScroll: true, path });
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
  assert.equal(
    new Set(evidence.variants.filter((v) => v.id === "area-curves").map((v) => v.path)).size,
    3,
  );
  const comparison = p.locator('[data-component="area-stacked"]');
  assert.equal(await comparison.locator(".recharts-area-area").count(), 2);
  await comparison.getByRole("button", { name: "Mobile", exact: true }).click();
  assert.equal(await comparison.locator(".recharts-area-area").count(), 2);
  await expectDimmedSeries(comparison, "desktop");
  for (const name of ["Code", "Preview", "Code", "Preview"])
    await comparison.getByRole("tab", { name, exact: true }).click();
  assert.equal(
    await comparison
      .getByRole("button", { name: "Mobile", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await comparison.getByRole("button", { name: "Mobile", exact: true }).click();
  await comparison.getByRole("button", { name: "Mobile", exact: true }).focus();
  await p.keyboard.press("Enter");
  assert.equal(
    await comparison
      .getByRole("button", { name: "Mobile", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await p.keyboard.press("Space");
  assert.equal(
    await comparison
      .getByRole("button", { name: "Mobile", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  const plot = p.locator('[data-component="area"] .recharts-surface');
  await plot.focus();
  await p.keyboard.press("ArrowRight");
  await p.locator('[data-component="area"] [data-kind-ui="chart-tooltip"]').waitFor();
  await p.keyboard.press("Escape");
  evidence.keyboard.push("Legend Enter/Space and tooltip ArrowRight/Escape");
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
    await p.evaluate(() => document.activeElement?.blur());
    if (width === 1440 || width === 375)
      await p.screenshot({
        path: `artifacts/screenshots/area-${width === 1440 ? "desktop" : "mobile"}-final.png`,
      });
  }
  await p.setViewportSize({ width: 1440, height: 1080 });
  await p.locator("#nd-sidebar").getByRole("link", { name: "Installation", exact: true }).click();
  await p.waitForURL("**/docs/installation/");
  await p.goBack();
  await p.waitForURL("**/docs/components/area/");
  await p.getByRole("button", { name: "Search", exact: false }).first().click();
  await p.getByRole("dialog").getByRole("combobox").fill("Area");
  await p.getByRole("dialog").getByText("Area Chart", { exact: true }).first().waitFor();
  await p.keyboard.press("Escape");
  await context.close();
  assert.deepEqual(evidence.errors, []);
  writeFileSync("artifacts/glass-area-results.json", JSON.stringify(evidence, null, 2));
  console.log(
    "All Area variants, native code/copy, keyboard tabs, repeated switches, mobile/200% tick bounds, native navigation/history/search passed.",
  );
} finally {
  await browser.close();
}
