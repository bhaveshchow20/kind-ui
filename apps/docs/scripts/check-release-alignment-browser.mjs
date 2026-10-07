import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import { basePath, publicPath } from "../lib/routing.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:7175";
const bundles = JSON.parse(readFileSync("generated/all-examples.json", "utf8"));
const output = `artifacts/release-alignment${basePath ? "-prefix" : "-default"}`;
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const failedRequests = [];
const checks = [];
const families = {
  heatmap: ["heatmap", "heatmap-compact"],
  radial: ["radial", "radial-activity"],
  pie: ["pie", "pie-visibility"],
  sankey: ["sankey-config", "sankey", "sankey-finishes"],
};
try {
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400)
      failedRequests.push([response.status(), response.url()]);
  });
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [family, ids] of Object.entries(families)) {
      const response = await page.goto(origin + publicPath(`/docs/components/${family}/`));
      assert.equal(response.status(), 200);
      await page.locator("h1").first().waitFor();
      const primary = page.locator(`[data-component="${ids[0]}"]`);
      await primary
        .locator(family === "heatmap" ? "[role=grid]" : "svg.recharts-surface")
        .first()
        .waitFor();
      await page.waitForTimeout(1100);
      for (const id of ids) {
        const card = page.locator(`[data-component="${id}"]`);
        await card.scrollIntoViewIfNeeded();
        await card
          .locator(id.startsWith("heatmap") ? "[role=grid]" : "svg.recharts-surface")
          .first()
          .waitFor();
        const previewHeight = (await card.locator(".preview-panel").boundingBox()).height;
        await card.getByRole("tab", { name: "Code", exact: true }).click();
        const source = bundles[id].files[`src/examples/${id}/example.tsx`];
        assert.equal((await card.locator("pre").textContent()).trim(), source.trim(), `${id} Code`);
        await card.getByRole("button", { name: "Copy Text", exact: true }).click();
        assert.equal(
          (await page.evaluate(() => navigator.clipboard.readText())).trim(),
          source.trim(),
          `${id} copy`,
        );
        await card.getByRole("button", { name: "Copy prompt", exact: true }).click();
        const prompt = await page.evaluate(() => navigator.clipboard.readText());
        assert.ok(prompt.includes(origin + publicPath(`/docs/components/${family}/`)));
        assert.ok(prompt.includes("Install @kind-ui/charts"));
        assert.ok(!prompt.includes(".tgz"));
        assert.ok(!prompt.includes("sourceCommit"));
        assert.equal(
          Math.round((await card.locator(".code-files").boundingBox()).height),
          Math.round(previewHeight),
          `${id} panel parity`,
        );
        const markdown = await context.request.get(
          origin + publicPath(`/markdown/components/${family}.md`),
        );
        assert.equal(markdown.status(), 200);
        assert.ok((await markdown.text()).includes(source), `${id} Markdown parity`);
        await card.getByRole("tab", { name: "Preview", exact: true }).click();
      }
      if (family === "heatmap") {
        const compact = page.locator('[data-component="heatmap-compact"]');
        const grid = compact.getByRole("grid");
        assert.equal(await grid.locator("td").count(), 182);
        assert.equal(await grid.getAttribute("data-cell-sizing"), "fixed");
        assert.equal(await grid.getAttribute("data-row-labels"), "hidden");
        const cell = grid.locator("td").first();
        const size = await cell.boundingBox();
        assert.ok(
          Math.abs(size.width - 12) < 1 && Math.abs(size.height - 12) < 1,
          JSON.stringify(size),
        );
        assert.equal(
          await cell.evaluate((node) =>
            node.headers.split(" ").every((id) => document.getElementById(id)?.tagName === "TH"),
          ),
          true,
        );
        await cell.focus();
        await page.keyboard.press("End");
        assert.equal(await grid.locator("td:focus").getAttribute("aria-label"), "Mon, Week 26: 0");
        await page.keyboard.press("Control+End");
        assert.equal(await grid.locator("td:focus").getAttribute("aria-label"), "Sun, Week 26: 1");
        assert.equal(await compact.getByRole("tooltip").textContent(), "Sun, Week 26: 1");
        if (width === 320)
          assert.ok(
            await compact
              .locator('[data-kind-ui="heatmap-scroll"]')
              .evaluate((node) => node.scrollWidth > node.clientWidth && node.scrollLeft > 0),
          );
      }
      if (family === "radial") {
        const activity = page.locator('[data-component="radial-activity"]');
        assert.equal(await activity.locator(".recharts-radial-bar-sector").count(), 3);
        assert.equal(await activity.locator('[data-kind-ui="radial-entrance-window"]').count(), 0);
        assert.deepEqual(await activity.locator("dl dd").allTextContents(), [
          "350 kcal",
          "30 min",
          "9 hours",
        ]);
        assert.deepEqual(
          await activity.locator('[data-kind-ui="chart-legend-item"]').allTextContents(),
          ["Move", "Exercise", "Stand"],
        );
        await activity.getByRole("application").focus();
        await page.keyboard.press("ArrowRight");
        const tooltip = activity.locator('[data-kind-ui="chart-tooltip"]');
        await tooltip.waitFor();
        assert.match(await tooltip.textContent(), /350 kcal|30 min|9 hours/);
        assert.equal(await activity.locator('[data-kind-ui="radial-label"]').count(), 0);
      }
      if (family === "pie") {
        const selected = page.locator('[data-component="pie-visibility"]');
        const fills = () =>
          selected
            .locator('[data-kind-ui="pie-sector"]')
            .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill));
        const before = await fills();
        assert.equal(before.length, 4);
        const toggle = selected.getByRole("button", { name: "Engineering", exact: true });
        await toggle.click();
        assert.equal(await selected.locator('[data-kind-ui="pie-sector"]').count(), 3);
        assert.deepEqual(await fills(), [before[0], before[2], before[3]]);
        await toggle.click();
        assert.deepEqual(await fills(), before);
      }
      if (family === "sankey") {
        const configured = page.locator('[data-component="sankey-config"]');
        assert.deepEqual(
          await configured.locator('[data-kind-ui="chart-legend-item"]').allTextContents(),
          ["Solar", "Wind", "Homes", "Industry"],
        );
        const strokes = await configured
          .locator(".recharts-sankey-links path")
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("stroke")));
        assert.deepEqual(strokes.sort(), ["#d29319", "#d29319", "#159c91", "#159c91"].sort());
        const selection = page.locator('[data-component="sankey"]');
        const stops = await selection
          .locator("linearGradient stop")
          .evaluateAll((nodes) => nodes.slice(0, 2).map((node) => node.getAttribute("stop-color")));
        assert.deepEqual(stops, ["#d29319", "#8865ce"]);
      }
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${family} page overflow at${width}`,
      );
      await page.screenshot({ path: `${output}/${family}-${width}.png` });
      checks.push({ family, width, sourceCodeCopyMarkdownParity: true, panelHeightParity: true });
    }
  }
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(origin + publicPath("/docs/guides/customization/"));
    const pie = page.locator('[data-component="pie-interaction"]');
    await pie.scrollIntoViewIfNeeded();
    await expect(pie.locator('[data-kind-ui="pie-sector"]')).toHaveCount(2);
    await expect(pie.locator('[data-kind-ui="pie-halo"]')).toHaveCount(0);
    await expect(pie.locator('[data-kind-ui="chart-tooltip"]')).toContainText("Service");
    const other = pie.getByRole("button", { name: "Other", exact: true });
    await other.click();
    await expect(other).toHaveAttribute("aria-pressed", "true");
    await expect(pie.locator('[data-kind-ui="pie-sector"]')).toHaveCount(2);
    await pie.getByRole("button", { name: "Highlight service", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(pie.getByRole("button", { name: "Service", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await pie.getByRole("application").focus();
    await page.keyboard.press("Escape");
    await expect(
      pie.locator('[data-kind-ui="chart-legend-button"][aria-pressed="true"]'),
    ).toHaveCount(0);
    const presentation = page.locator('[data-component="combo-presentation"]');
    await presentation.scrollIntoViewIfNeeded();
    await presentation.locator("svg.recharts-surface").first().waitFor();
    await expect(presentation.locator('[data-kind-ui="chart-icon"]')).toHaveCount(1);
    const target = presentation.getByRole("button", { name: "Target", exact: true });
    await target.click();
    await expect(target).toHaveAttribute("aria-pressed", "true");
    for (const id of ["combo-presentation", "pie-interaction"]) {
      const card = page.locator(`[data-component="${id}"]`);
      await card.scrollIntoViewIfNeeded();
      const height = (await card.locator(".chart-example").boundingBox()).height;
      const values =
        id === "pie-interaction" ? ["selective-glow", "loading", "ready"] : ["loading", "ready"];
      for (const value of values) {
        const option = bundles[id].variants[value];
        await card.getByRole("combobox", { name: "State", exact: true }).click();
        await page.getByRole("option", { name: option.label, exact: true }).click();
        const skeleton = card.locator('[data-kind-ui="chart-loading-skeleton"]');
        if (value === "loading") {
          await expect(skeleton).toBeVisible();
          await expect(card.locator('[data-kind-ui="chart-loading-status"]')).toContainText(
            id === "combo-presentation" ? "Loading monthly production" : "Loading allocation",
          );
        } else {
          await expect(skeleton).toHaveCount(0);
          await expect(card.locator('[data-kind-ui="chart-loading-status"]')).toHaveText("");
        }
        if (id === "pie-interaction")
          await expect(card.locator('[data-kind-ui="pie-halo"]')).toHaveCount(
            value === "selective-glow" ? 1 : 0,
          );
        assert.ok(
          Math.abs((await card.locator(".chart-example").boundingBox()).height - height) < 2,
          `${id} retains loading layout`,
        );
        await card.getByRole("tab", { name: "Code", exact: true }).click();
        assert.equal(
          (await card.locator("pre").textContent()).trim(),
          option.source.trim(),
          `${id} ${value} source parity`,
        );
        await card.getByRole("tab", { name: "Preview", exact: true }).click();
      }
    }
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `customization overflow at ${width}`,
    );
    await page.screenshot({ path: `${output}/customization-${width}.png` });
    checks.push({
      family: "customization",
      width,
      loadingLayout: true,
      variantSourceParity: true,
      legendAndMarkFocus: true,
      initialPiePin: true,
      selectiveGlow: true,
    });
  }
  const provenance = await context.request.get(origin + publicPath("/package-provenance.json"));
  assert.equal(provenance.status(), 404, "Internal provenance must not be public");
  const download = await context.request.get(
    origin + publicPath("/examples/package/kind-ui-charts-0.2.0.tgz"),
  );
  assert.equal(download.status(), 404, "Local validation archive must not be public");
  assert.equal(
    createHash("sha256").update(readFileSync("vendor/kind-ui-charts-0.2.0.tgz")).digest("hex"),
    JSON.parse(readFileSync("vendor/provenance.json", "utf8")).sha256,
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(failedRequests, []);
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ workers: 1, origin, basePath, checks, errors, failedRequests }, null, 2),
  );
  await context.close();
} finally {
  await browser.close();
}
console.log(
  "Release alignment: affected source/copy, native panels, compact grid, rings and identity paint checks passed.",
);
