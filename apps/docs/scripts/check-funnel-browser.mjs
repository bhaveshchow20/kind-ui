import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import { publicPath } from "../lib/routing.mjs";
import { candidatePromptSource } from "./prompt-source.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN ?? "http://127.0.0.1:6378";
const bundles = JSON.parse(readFileSync("generated/funnel-examples.json", "utf8"));
const browserPath = process.env.KIND_DOCS_CHROMIUM ?? process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(browserPath ? { executablePath: browserPath } : {});
mkdirSync("artifacts/funnel", { recursive: true });
const evidence = { viewports: [], variants: [], geometry: [], errors: [] };
const cardFor = (page, id) => page.locator(`[data-component="${id}"]`);
const stageFor = (card, id) => card.locator(`[data-kind-ui="funnel-stage"][data-stage-id="${id}"]`);
const markFor = (card, id) => stageFor(card, id).locator('[data-kind-ui="funnel-mark"]');
const near = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${message}: ${actual} != ${expected}`);

async function area(mark) {
  return mark.evaluate((node) => {
    const points = (node.getAttribute("points") ?? "")
      .trim()
      .split(/\s+/)
      .map((pair) => pair.split(",").map(Number));
    return (
      Math.abs(
        points.reduce((sum, point, index) => {
          const next = points[(index + 1) % points.length];
          return sum + point[0] * next[1] - next[0] * point[1];
        }, 0),
      ) / 2
    );
  });
}
async function cross(mark, edge = "upper") {
  return Number(await mark.getAttribute(`data-${edge}-width`));
}
async function frameContainsReadouts(card) {
  await expect(card.locator('[data-kind-ui="funnel-labels"]').first()).toBeVisible();
  await expect
    .poll(() =>
      card.evaluate((node) => {
        const panel = node.querySelector(".preview-panel");
        const content = panel.querySelector(".chart-example > div");
        const padding = Number.parseFloat(getComputedStyle(panel).paddingBottom);
        return (
          content.getBoundingClientRect().bottom <=
          panel.getBoundingClientRect().bottom - padding + 1
        );
      }),
    )
    .toBe(true);
}
async function sourceParity(page, context, card, bundle, variant) {
  const source = variant
    ? bundle.variants[variant].source
    : bundle.files[`src/examples/${bundle.id}/example.tsx`];
  await card.getByRole("tab", { name: "Code", exact: true }).click();
  assert.equal((await card.locator("pre").textContent()).trimEnd(), source.trimEnd());
  await card.getByRole("button", { name: "Copy Text", exact: true }).click();
  assert.equal(
    (await page.evaluate(() => navigator.clipboard.readText())).trimEnd(),
    source.trimEnd(),
  );
  await card.locator("button.copy-prompt").click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  const match = prompt.match(/Retrieve the standalone source: (.+)\./);
  assert.ok(match, "Prompt must contain the deployed selected-source URL");
  assert.doesNotMatch(prompt, /localhost|127\.0\.0\.1/);
  const response = await context.request.get(candidatePromptSource(match[1], origin));
  assert.equal(response.status(), 200);
  assert.equal((await response.text()).trimEnd(), source.trimEnd());
  if (variant) assert.ok(prompt.includes(`(${variant})`));
  await card.getByRole("tab", { name: "Preview", exact: true }).click();
}

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
    hasTouch: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  await page.goto(new URL(publicPath("/docs/components/funnel/"), origin).href);
  const checkout = cardFor(page, "funnel");
  await expect(checkout.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(5);
  assert.equal(await page.locator('[data-component^="funnel"]').count(), 5);
  assert.equal(await page.locator('[data-kind-ui="funnel-data-table"]').count(), 0);

  const firstArea = await area(markFor(checkout, "started"));
  assert.ok(firstArea > 0);
  for (const [id, expected] of [
    ["started", 1],
    ["details", 0.75],
    ["delivery", 0.6],
    ["payment", 0.45],
    ["ordered", 0.375],
  ]) {
    near(
      (await area(markFor(checkout, id))) / firstArea,
      expected,
      `checkout ${id} rectangular area`,
    );
  }
  await expect(checkout.locator('[data-kind-ui="funnel-labels"]')).toContainText(
    "Placed order: 900; Share of starting sessions: 37.5%",
  );
  await stageFor(checkout, "started").focus();
  await page.keyboard.press("ArrowDown");
  await expect(stageFor(checkout, "details")).toBeFocused();
  await expect(checkout.getByRole("tooltip")).toContainText(
    "Contact details: 1,800; Share of starting sessions: 75%",
  );
  await frameContainsReadouts(checkout);
  await page.keyboard.press("Escape");
  await expect(checkout.getByRole("tooltip")).toHaveCount(0);
  evidence.geometry.push(
    "checkout rectangular areas agree with supplied stage values and readout denominators",
  );

  const pipeline = cardFor(page, "funnel-pipeline");
  await expect(pipeline.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(5);
  await expect(pipeline.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(3);
  await expect(stageFor(pipeline, "proposal")).toHaveAttribute("data-value-state", "unknown");
  await expect(
    stageFor(pipeline, "proposal").locator('[data-kind-ui="funnel-unknown"]'),
  ).toHaveCount(1);
  await expect(stageFor(pipeline, "negotiation")).toHaveAttribute("data-value-state", "zero");
  await expect(
    stageFor(pipeline, "negotiation").locator('[data-kind-ui="funnel-mark"]'),
  ).toHaveCount(0);
  const largest = await area(markFor(pipeline, "evaluation"));
  near(
    (await area(markFor(pipeline, "discovery"))) / largest,
    84250.5 / 126500.75,
    "pipeline keeps nonmonotonic supplied amounts",
  );
  near(
    (await area(markFor(pipeline, "committed"))) / largest,
    63000.25 / 126500.75,
    "pipeline decimal amount proportion",
  );
  const pipelineLabels = pipeline.locator('[data-kind-ui="funnel-labels"]');
  await expect(pipelineLabels).toContainText("Evaluation: $126,500.75 · 8 median days");
  await expect(pipelineLabels).toContainText("Negotiation: $0.00 · 0 median days");
  assert.doesNotMatch(await pipelineLabels.textContent(), /%|conversion/i);
  await stageFor(pipeline, "proposal").focus();
  await expect(pipeline.getByRole("tooltip")).toContainText("Weighted amount: Not reported");
  await expect(pipeline.getByRole("tooltip")).toContainText("Unknown duration");
  await frameContainsReadouts(pipeline);
  await page.keyboard.press("Escape");

  const comparison = cardFor(page, "funnel-comparison");
  const june = comparison.getByRole("region", { name: "June cohort", exact: true });
  const july = comparison.getByRole("region", { name: "July cohort", exact: true });
  await expect(comparison.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(6);
  const sharedMaximum = await cross(markFor(july, "started"));
  near((await cross(markFor(june, "started"))) / sharedMaximum, 0.75, "June starter common scale");
  near(
    (await cross(markFor(june, "activated"))) / sharedMaximum,
    0.315,
    "June activated common scale",
  );
  near(
    (await cross(markFor(july, "activated"))) / sharedMaximum,
    0.455,
    "July activated common scale",
  );
  await expect(june.locator('[data-kind-ui="funnel-labels"]')).toContainText(
    "Activated: 504; Share of cohort starters: 42%",
  );
  await expect(july.locator('[data-kind-ui="funnel-labels"]')).toContainText(
    "Activated: 728; Share of cohort starters: 45.5%",
  );
  await frameContainsReadouts(comparison);
  evidence.geometry.push("shared scale1600 is independent from June1200/July1600 denominators");

  const workflow = cardFor(page, "funnel-orientation");
  for (const [value, label] of [
    ["horizontal", "Horizontal"],
    ["vertical", "Vertical"],
  ]) {
    await workflow.getByRole("combobox", { name: "Orientation", exact: true }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await expect(workflow.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(4);
    const startCross = await cross(markFor(workflow, "submitted"));
    near(
      (await cross(markFor(workflow, "submitted"), "lower")) / startCross,
      120 / 180,
      `${value} first exit boundary`,
    );
    near(
      (await cross(markFor(workflow, "screened"))) / startCross,
      120 / 180,
      `${value} second entry boundary`,
    );
    near(
      (await cross(markFor(workflow, "screened"), "lower")) / startCross,
      75 / 180,
      `${value} second exit boundary`,
    );
    near(
      await cross(markFor(workflow, "offered"), "lower"),
      await cross(markFor(workflow, "offered")),
      `${value} final rectangle`,
    );
    const displacement = await workflow
      .locator('[data-kind-ui="funnel-mark"]')
      .evaluateAll((nodes) => {
        const first = nodes[0].getBoundingClientRect();
        const last = nodes[3].getBoundingClientRect();
        return { x: last.x - first.x, y: last.y - first.y };
      });
    assert.ok(
      value === "horizontal" ? displacement.x > 0 : displacement.y > 0,
      `${value} progresses on its stated physical axis`,
    );
    await expect(workflow.locator('[data-kind-ui="funnel-labels"]')).toContainText(
      "Screened: 120; Share of previous stage: 66.7%",
    );
    await sourceParity(page, context, workflow, bundles["funnel-orientation"], value);
    await frameContainsReadouts(workflow);
    evidence.variants.push({
      id: "funnel-orientation",
      value,
      geometry: "boundary widths",
      sourceParity: true,
    });
  }
  await sourceParity(page, context, checkout, bundles.funnel, "ready");
  await sourceParity(page, context, pipeline, bundles["funnel-pipeline"]);
  await sourceParity(page, context, comparison, bundles["funnel-comparison"]);

  const loading = cardFor(page, "funnel-loading");
  await expect(loading.locator('[data-kind-ui="chart-loading-skeleton"]')).toBeVisible();
  await expect(loading.locator('[data-kind-ui="funnel-labels"]')).not.toBeVisible();
  await expect(loading.locator('[data-kind-ui="funnel-stage"][tabindex="0"]')).toHaveCount(0);
  await expect(loading.getByRole("tooltip")).toHaveCount(0);
  await expect(
    loading.getByRole("status").filter({ hasText: "Loading checkout cohort" }),
  ).toBeVisible();
  await sourceParity(page, context, loading, bundles.funnel, "loading");
  evidence.variants.push({ id: "funnel", value: "ready/loading", sourceParity: true });

  const installation = page.locator('[data-chart-installation="funnel"]');
  await installation.getByRole("tab", { name: "CLI", exact: true }).click();
  for (const [manager, command] of [
    ["npm", "npx shadcn@latest add @kind-ui/funnel-chart"],
    ["pnpm", "pnpm dlx shadcn@latest add @kind-ui/funnel-chart"],
    ["yarn", "yarn dlx shadcn@latest add @kind-ui/funnel-chart"],
    ["bun", "bunx shadcn@latest add @kind-ui/funnel-chart"],
  ]) {
    await installation
      .locator("[data-package-install]")
      .getByRole("tab", { name: manager, exact: true })
      .click();
    await expect(installation.locator("pre")).toHaveText(command);
  }
  await installation.getByRole("tab", { name: "Manual", exact: true }).click();
  await expect(
    installation.locator("[data-package-install]").getByRole("tab", { name: "bun", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(installation.locator("pre").first()).toHaveText(
    "bun add @kind-ui/charts motion recharts",
  );
  for (const [manager, command] of [
    ["npm", "npm install @kind-ui/charts motion recharts"],
    ["pnpm", "pnpm add @kind-ui/charts motion recharts"],
    ["yarn", "yarn add @kind-ui/charts motion recharts"],
    ["bun", "bun add @kind-ui/charts motion recharts"],
  ]) {
    await installation
      .locator("[data-package-install]")
      .getByRole("tab", { name: manager, exact: true })
      .click();
    await expect(installation.locator("pre").first()).toHaveText(command);
  }
  for (const title of [
    "Install Core",
    "Configure Tailwind CSS v4",
    "Create the composition",
    "Render the chart",
  ])
    await expect(installation.getByRole("heading", { name: title, exact: true })).toBeVisible();
  const manualText = await installation.textContent();
  for (const filename of ["Terminal", "src/app.css", "components/funnel-chart.tsx", "App.tsx"])
    assert.ok(manualText.includes(filename));
  assert.doesNotMatch(manualText, /\bLICENSE\b|copy.*licen[cs]e/i);
  assert.equal(await installation.locator("pre").count(), 4);
  assert.equal(
    (await installation.locator("pre").nth(2).textContent()).trimEnd(),
    bundles.funnel.files["src/examples/funnel/example.tsx"].trimEnd(),
  );
  await installation.getByRole("tab", { name: "CLI", exact: true }).click();
  await expect(
    installation.locator("[data-package-install]").getByRole("tab", { name: "bun", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(installation.locator("pre")).toHaveText(
    "bunx shadcn@latest add @kind-ui/funnel-chart",
  );
  evidence.installation = "flat CLI and four native Manual steps/file titles, no LICENSE step";

  const themeBefore = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  );
  const areaBefore = await area(markFor(checkout, "ordered"));
  await page.getByRole("button", { name: "Toggle Theme", exact: true }).click();
  await page.waitForFunction(
    (before) => document.documentElement.classList.contains("dark") !== before,
    themeBefore,
  );
  near(await area(markFor(checkout, "ordered")), areaBefore, "theme preserves numeric geometry");
  evidence.theme = "theme toggle preserves area and visible labels";

  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ["funnel", "funnel-pipeline", "funnel-comparison", "funnel-orientation"]) {
      const card = cardFor(page, id);
      await card.scrollIntoViewIfNeeded();
      await frameContainsReadouts(card);
      const stage = card.locator('[data-kind-ui="funnel-stage"]').first();
      await stage.focus();
      await expect(card.getByRole("tooltip").first()).toBeVisible();
      await frameContainsReadouts(card);
      await page.keyboard.press("Escape");
    }
    if (width < 400) {
      await stageFor(pipeline, "negotiation").tap();
      await expect(pipeline.getByRole("tooltip")).toContainText("Weighted amount: $0.00");
      await frameContainsReadouts(pipeline);
      await page.keyboard.press("Escape");
    }
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    assert.ok(overflow.document <= overflow.viewport + 1, JSON.stringify(overflow));
    await comparison.screenshot({ path: `artifacts/funnel/comparison-${width}.png` });
    evidence.viewports.push({ width, horizontalOverflow: false, labelsAndTooltipsContained: true });
  }
  await expect(checkout.locator('[data-kind-ui="funnel-stage-paint"]').first()).toHaveCSS(
    "opacity",
    "1",
  );
  assert.deepEqual(evidence.errors, []);
  await context.close();
} finally {
  writeFileSync("artifacts/funnel/browser.json", JSON.stringify(evidence, null, 2));
  await browser.close();
}
