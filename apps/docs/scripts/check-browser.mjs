import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const origin = "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/line-examples.json", "utf8"));
const removedFamilies = [
  "bar",
  "combo",
  "donut",
  "scatter",
  "radar",
  "radial-bar",
  "histogram",
  "box-plot",
  "waterfall",
  "sankey",
  "heatmap",
];
mkdirSync("artifacts", { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    permissions: ["clipboard-read", "clipboard-write"],
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/docs/components/line/`);
  await page.locator(".recharts-line-curve").first().waitFor();
  const links = await page
    .locator("#nd-sidebar a[href]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  assert.deepEqual(
    links.filter((url) => url.startsWith("/docs/components/")),
    ["/docs/components/line/", "/docs/components/area/"],
  );
  const curve = page.locator('[data-component="line-smooth"]');
  await curve.getByRole("combobox", { name: "Curve" }).click();
  await page.getByRole("option", { name: "Step after", exact: true }).click();
  await curve.getByRole("button", { name: "Copy prompt", exact: true }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(prompt.includes("/examples/line-smooth/variants/stepAfter/example.tsx"));
  assert.ok(
    prompt.includes("/docs/components/line/") && prompt.includes("/docs/start/installation/"),
  );
  assert.ok(prompt.length < 7000);
  const selected = await context.request.get(
    `${origin}/examples/line-smooth/variants/stepAfter/example.tsx`,
  );
  assert.equal(await selected.text(), bundles["line-smooth"].variants.stepAfter.source);
  const comparison = page.locator('[data-component="line-comparison"]');
  await comparison.getByRole("button", { name: "Target", exact: true }).click();
  assert.equal(
    await comparison
      .getByRole("button", { name: "Target", exact: true })
      .getAttribute("aria-pressed"),
    "false",
  );
  await page.getByRole("button", { name: "Search", exact: false }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox").fill("Line");
  await dialog.getByText("Line Chart", { exact: true }).first().waitFor();
  await dialog.getByRole("combobox").fill("Combo Chart");
  await page.waitForTimeout(500);
  assert.equal(await dialog.getByText("Combo Chart", { exact: true }).count(), 0);
  await page.keyboard.press("Escape");
  for (const family of removedFamilies) {
    assert.equal((await context.request.get(`${origin}/docs/components/${family}/`)).status(), 404);
    assert.equal(
      (await context.request.get(`${origin}/markdown/components/${family}.md`)).status(),
      404,
    );
  }
  await page.getByRole("button", { name: "Toggle Theme", exact: false }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  await page.setViewportSize({ width: 320, height: 812 });
  // The narrow layout hides visible labels; all five controls must stay named.
  assert.equal(await page.getByRole("button", { name: "Copy prompt", exact: true }).count(), 4);
  assert.equal(await curve.getByRole("button", { name: "Copied", exact: true }).count(), 1);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await page.waitForFunction(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2,
    null,
    { timeout: 3000 },
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2,
    ),
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    "artifacts/line-browser-results.json",
    JSON.stringify(
      {
        publishedComponent: "line",
        selectedPrompt: "stepAfter",
        removedRoutes: removedFamilies,
        navigationSearch: "passed",
        visibility: "passed",
        darkMobileEnlarged: "passed",
        errors,
      },
      null,
      2,
    ),
  );
  await context.close();
  console.log(
    "Line/Area navigation/search/routes, selected prompt/source, legend visibility and dark mobile enlarged text passed.",
  );
} finally {
  await browser.close();
}
