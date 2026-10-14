import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import { referenceTitle } from "../lib/api-reference.mjs";
import { publicPath } from "../lib/routing.mjs";
import { candidatePromptSource } from "./prompt-source.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
const bundles = {
  treemap: JSON.parse(readFileSync("generated/treemap-examples.json", "utf8")).treemap,
};
const api = JSON.parse(readFileSync("generated/api.json", "utf8"));
const rootReference = "TreemapRootReference";
const artifactDirectory = "artifacts/treemap";
mkdirSync(artifactDirectory, { recursive: true });
const executable = process.env.KIND_DOCS_CHROMIUM || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(executable ? { executablePath: executable } : {});
const evidence = {
  previews: [],
  variants: [],
  inspection: [],
  layouts: [],
  navigation: [],
  errors: [],
};
const tileSelector = '[data-kind-ui="treemap-tile"]';
const tile = (card, id) => card.locator(`${tileSelector}[data-node-id="${id}"]`);
const chart = (card) => card.locator('[data-kind-ui="treemap"]');
const pageURL = new URL(publicPath("/docs/components/treemap/"), origin).href;
const geometry = (card) =>
  card.locator(tileSelector).evaluateAll((nodes) =>
    nodes
      .map((node) => ({
        id: node.getAttribute("data-node-id"),
        left: node.style.left,
        top: node.style.top,
        width: node.style.width,
        height: node.style.height,
      }))
      .sort((a, b) => (a.id ?? "").localeCompare(b.id ?? "")),
  );
const colors = (card) =>
  card.locator(tileSelector).evaluateAll((nodes) =>
    nodes
      .map((node) => ({
        id: node.getAttribute("data-node-id"),
        paint: getComputedStyle(node).backgroundColor,
      }))
      .sort((a, b) => (a.id ?? "").localeCompare(b.id ?? "")),
  );

async function checkSource(page, context, card, id, variant) {
  const bundle = bundles[id];
  const source = variant
    ? bundle.variants[variant].source
    : bundle.files[`src/examples/${id}/example.tsx`];
  await card.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(card.locator(".line-code-block pre")).toBeVisible();
  assert.equal(
    (await card.locator(".line-code-block pre").textContent()).trimEnd(),
    source.trimEnd(),
  );
  await card.getByRole("button", { name: "Copy Text", exact: true }).click();
  assert.equal(
    (await page.evaluate(() => navigator.clipboard.readText())).trimEnd(),
    source.trimEnd(),
  );
  await card.locator("button.copy-prompt").click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(prompt.includes("https://kindui.dev/charts/docs/components/treemap/"));
  assert.ok(prompt.includes(`Selected example: ${id}${variant ? ` (${variant})` : ""}`));
  assert.doesNotMatch(prompt, /https?:\/\/(?:localhost|127\.0\.0\.1)/);
  const sourceURL = prompt.match(/Retrieve the standalone source: (.+)\./)?.[1];
  assert.ok(sourceURL, "Copy prompt must identify the selected standalone source");
  const response = await context.request.get(candidatePromptSource(sourceURL, origin));
  assert.equal(response.status(), 200);
  assert.equal((await response.text()).trimEnd(), source.trimEnd());
  if (id === "treemap") {
    assert.match(source, /period\?: "current" \| "previous"/);
    if (variant === "loading") {
      assert.ok(source.includes("loading = true"));
      assert.ok(source.includes('period = "current"'));
    } else {
      assert.ok(source.includes("loading = false"));
      assert.ok(source.includes(`period = "${variant}"`));
    }
  }
  await card.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(chart(card)).toBeVisible();
  evidence.variants.push({ id, variant: variant ?? "default", codeCopyPromptSource: "passed" });
}

async function checkAlternatives(page) {
  for (const [id, bundle] of Object.entries(bundles)) {
    const alternative = bundle.dataAlternative;
    assert.ok(alternative?.rows.length, `${id}: generated plotted values are required`);
    const external = page.locator(`.treemap-data-alternative[data-example="${id}"]`);
    await expect(external).toHaveCount(1);
    await expect(external.locator("summary")).toHaveCount(0);
    const table = external.getByRole("table", { name: alternative.caption, exact: true });
    await expect(table).toHaveCount(1);
    assert.equal(
      await table.evaluate((node) => node.closest('[data-kind-ui="treemap"]') === null),
      true,
      `${id}: the canonical data alternative must be outside the graph`,
    );
    await expect(table.locator("tbody tr")).toHaveCount(alternative.rows.length);
    const keys = Object.keys(alternative.columns);
    for (const [index, row] of alternative.rows.entries()) {
      const cells = await table.locator("tbody tr").nth(index).locator("th, td").allTextContents();
      assert.deepEqual(
        cells.map((value) => value.trim()),
        keys.map((key) => String(row[key])),
        `${id}: alternative row ${row.id} differs from generated data`,
      );
    }
  }
}

async function checkBounds(page, width, theme) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(1);
  for (const id of Object.keys(bundles)) {
    const card = page.locator(`[data-component="${id}"]`);
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator(tileSelector).first()).toBeVisible();
    const violations = await card.evaluate((element) => {
      const plot = element.querySelector('[data-kind-ui="treemap"]');
      if (!plot) return ["Missing plot"];
      const bounds = plot.getBoundingClientRect();
      const marks = [
        ...plot.querySelectorAll('[data-kind-ui="treemap-tile"], [data-kind-ui="treemap-group"]'),
      ];
      return marks.flatMap((mark) => {
        const box = mark.getBoundingClientRect();
        return box.left < bounds.left - 1 ||
          box.top < bounds.top - 1 ||
          box.right > bounds.right + 1 ||
          box.bottom > bounds.bottom + 1
          ? [mark.getAttribute("data-node-id")]
          : [];
      });
    });
    assert.deepEqual(violations, [], `${id}: marks escape the ${width}px ${theme} plot`);
    assert.equal(
      await card
        .locator('[data-kind-ui="treemap-label"]')
        .evaluateAll((nodes) =>
          nodes.every((node) => getComputedStyle(node).overflow === "hidden"),
        ),
      true,
    );
    // The reduced-motion theme transition settles on the next rendering frame.
    await expect
      .poll(() => chart(card).evaluate((node) => node.getAnimations().length), {
        message: "Reduced-motion examples should not animate",
      })
      .toBe(0);
  }
  evidence.layouts.push({
    width,
    theme,
    pageContainment: "passed",
    plotContainment: "passed",
    reducedMotion: "passed",
  });
}

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") evidence.errors.push(message.text());
  });
  const response = await page.goto(pageURL);
  assert.equal(response?.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(`[data-component="treemap"] ${tileSelector}`).first()).toBeVisible();
  await expect(page.locator(".line-workbench")).toHaveCount(5);
  for (const id of Object.keys(bundles)) {
    const card = page.locator(`[data-component="${id}"]`);
    await card.scrollIntoViewIfNeeded();
    await expect(chart(card)).toBeVisible();
    await expect(card.locator('[data-kind-ui="treemap-tiles"]')).toHaveCount(1);
    await expect(card.locator('[data-kind-ui="treemap-groups"]')).toHaveCount(0);
    await expect(card.locator('[data-kind-ui="treemap-group-header"]')).toHaveCount(0);
    await expect(
      card.locator(
        id === "treemap"
          ? '[data-kind-ui="chart-legend"]'
          : '[data-kind-ui="treemap-color-legend"]',
      ),
    ).toBeVisible();
    await expect(card.locator('[data-kind-ui="treemap-data-table"]')).toHaveCount(0);
    if (id !== "treemap") await checkSource(page, context, card, id);
    evidence.previews.push({ id, graphOnly: true, explicitParts: "passed" });
  }

  const pending = page.locator('[data-component="treemap-loading"]');
  await expect(page.locator("h2#loading-state")).toBeVisible();
  await expect(pending.getByRole("combobox")).toHaveCount(0);
  await expect(pending.locator('[data-kind-ui="chart-loading-skeleton"]')).toBeVisible();
  await expect(chart(pending)).toHaveAttribute("aria-busy", "true");
  await checkSource(page, context, pending, "treemap", "loading");
  await expect(pending.locator('[data-kind-ui="chart-loading-skeleton"]')).toBeVisible();

  const primary = page.locator('[data-component="treemap"]');
  await primary.scrollIntoViewIfNeeded();
  await checkSource(page, context, primary, "treemap", "current");
  const before = await geometry(primary);
  const beforeColors = await colors(primary);
  await tile(primary, "api").focus();
  await expect(primary.getByRole("tooltip")).toContainText("$18,400");
  await primary
    .getByRole("combobox", { name: bundles.treemap.variantControl, exact: true })
    .click();
  await page
    .getByRole("option", { name: bundles.treemap.variants.previous.label, exact: true })
    .click();
  await expect(
    primary.getByRole("combobox", { name: bundles.treemap.variantControl, exact: true }),
  ).toContainText(bundles.treemap.variants.previous.label);
  assert.deepEqual(
    (await geometry(primary)).map((item) => item.id),
    before.map((item) => item.id),
    "A period change retains service IDs",
  );
  assert.notDeepEqual(
    await geometry(primary),
    before,
    "A period change reflects actual billing values",
  );
  assert.deepEqual(
    await colors(primary),
    beforeColors,
    "Categories retain their colors across periods",
  );
  await tile(primary, "api").focus();
  await expect(primary.getByRole("tooltip")).toContainText("$16,200");
  await checkSource(page, context, primary, "treemap", "previous");
  await primary
    .getByRole("combobox", { name: bundles.treemap.variantControl, exact: true })
    .click();
  await page
    .getByRole("option", { name: bundles.treemap.variants.current.label, exact: true })
    .click();
  await tile(primary, "api").focus();
  await expect(primary.getByRole("tooltip")).toContainText("$18,400");
  await page.keyboard.press("Escape");
  await expect(primary.getByRole("tooltip")).toBeHidden();
  evidence.inspection.push({
    id: "treemap",
    currencyAndStablePeriodIdentity: "passed",
    escape: "passed",
  });

  await primary.scrollIntoViewIfNeeded();
  await expect(
    primary.locator('[data-kind-ui="treemap-group"], [data-kind-ui="treemap-group-header"]'),
  ).toHaveCount(0);
  await expect(primary.locator(tileSelector)).toHaveCount(10);
  await tile(primary, "api").focus();
  await expect(primary.getByRole("tooltip")).toHaveAttribute("aria-label", "Compute / API");
  const compute = primary.locator(
    '[data-kind-ui="chart-legend-button"][data-legend-key="compute"]',
  );
  await compute.click();
  await expect(compute).toHaveAttribute("aria-pressed", "true");
  assert.deepEqual(await geometry(primary), before, "Category focus preserves the complete mosaic");
  await compute.focus();
  await page.keyboard.press("Escape");
  await expect(compute).toHaveAttribute("aria-pressed", "false");
  let moved = false;
  for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
    await tile(primary, "api").focus();
    await page.keyboard.press(key);
    if ((await page.locator(":focus").getAttribute("data-node-id")) !== "api") {
      moved = true;
      break;
    }
  }
  assert.equal(moved, true, "A directional arrow must reach a spatial neighbor");
  await page.keyboard.press("Home");
  const first = await page.locator(":focus").getAttribute("data-node-id");
  await page.keyboard.press("End");
  assert.notEqual(await page.locator(":focus").getAttribute("data-node-id"), first);
  await expect(
    primary.locator(
      '[data-kind-ui="treemap-tile"][tabindex="0"], [data-kind-ui="treemap-group-header"][tabindex="0"]',
    ),
  ).toHaveCount(1);
  evidence.navigation.push({
    keyboardDrillAndBreadcrumbs: "passed",
    arrowsHomeEnd: "passed",
    onePlotTabStop: "passed",
  });

  await checkAlternatives(page);
  const rootProps = page.getByRole("region", {
    name: `${referenceTitle(rootReference)} props`,
    exact: true,
  });
  await expect(rootProps).toBeVisible();
  assert.deepEqual(
    await rootProps.locator("tbody td:first-child").allTextContents(),
    api[rootReference].map((entry) => entry.name),
  );
  await rootProps.focus();
  await expect(rootProps).toBeFocused();
  const installation = page.locator('[data-chart-installation="treemap"]');
  await expect(installation).toBeVisible();
  await expect(installation.getByRole("tab", { name: "CLI", exact: true })).toBeVisible();
  await expect(installation).toContainText("npx shadcn@latest add @kind-ui/treemap-chart");
  assert.doesNotMatch(
    await installation.textContent(),
    /candidate|publication|await.*release|checksum/i,
  );
  await installation.getByRole("tab", { name: "Manual", exact: true }).click();
  await expect(installation.locator("pre")).toHaveCount(4);
  assert.equal(
    (await installation.locator("pre").nth(2).textContent()).trimEnd(),
    bundles.treemap.files["src/examples/treemap/example.tsx"].trimEnd(),
  );
  assert.deepEqual(await installation.locator("h3").allTextContents(), [
    "Install Core",
    "Configure Tailwind CSS v4",
    "Create the composition",
    "Render the chart",
  ]);
  assert.doesNotMatch(await installation.textContent(), /LICENSE|vendor\/|\.tgz|SHA-256/);
  await installation.getByRole("tab", { name: "CLI", exact: true }).click();
  await page.screenshot({ path: `${artifactDirectory}/desktop.png`, fullPage: true });

  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await checkBounds(page, width, "light");
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    });
    await checkBounds(page, width, "dark");
    await page.screenshot({ path: `${artifactDirectory}/dark-${width}.png`, fullPage: true });
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    });
  }
  assert.deepEqual(evidence.errors, []);
  await context.close();
} finally {
  writeFileSync(`${artifactDirectory}/browser.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  await browser.close();
}
console.log(
  "Treemap docs preview/source/prompt parity, semantic data, keyboard, responsive themes and installation parity checks passed.",
);
