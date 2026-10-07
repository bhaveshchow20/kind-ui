import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { publicPath } from "../lib/routing.mjs";
import { assertPublicCopy } from "./public-copy.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:7673";
const homepage = process.env.KIND_HOMEPAGE_BROWSER_ORIGIN || "http://127.0.0.1:7674";
const output = "artifacts/public-copy";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const checks = [];
const errors = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      [origin, homepage].some((base) => response.url().startsWith(base))
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  const routes = [
    "/docs/",
    "/docs/installation/",
    "/docs/components/bar/",
    "/docs/components/combo/",
    "/docs/chart-components/root/",
    "/docs/chart-components/series-config/",
    "/docs/chart-components/legend/",
    "/docs/chart-components/tooltip/",
    "/docs/chart-components/responsive-container/",
    "/docs/chart-components/axes-grid/",
    "/docs/chart-components/labels/",
  ];
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      const response = await page.goto(origin + publicPath(route));
      assert.equal(response.status(), 200, route);
      await page.locator("h1").first().waitFor();
      assertPublicCopy(await page.locator("body").innerText(), route);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${route} overflow at ${width}`,
      );
      if (route.includes("/components/")) {
        await page.locator("svg.recharts-surface").first().waitFor();
        assert.equal(
          await page
            .locator(".doc-body")
            .getByRole("heading", { name: "Root", exact: true })
            .count(),
          0,
        );
        const card = page.locator("[data-component]").first();
        await card.getByRole("tab", { name: "Code", exact: true }).click();
        assert.match(await card.locator("pre").innerText(), /@kind-ui\/charts/);
        await card.getByRole("tab", { name: "Preview", exact: true }).click();
      }
      const tocLinks = await page
        .locator('a[href*="#"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
      const missing = await page.evaluate(
        (links) =>
          links.filter(
            (href) =>
              href.startsWith("#") &&
              href.length > 1 &&
              !document.getElementById(decodeURIComponent(href.slice(1))),
          ),
        tocLinks,
      );
      assert.deepEqual(missing, [], `${route} anchor targets`);
      await page.screenshot({
        path: `${output}/${route.split("/").filter(Boolean).join("-")}-${width}.png`,
      });
      checks.push({ route, width, status: "passed" });
    }
    const response = await page.goto(homepage);
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: /Bring your data/ }).waitFor();
    assertPublicCopy(await page.locator("body").innerText(), "homepage");
    assert.match(
      await page.locator(".install-section").innerText(),
      /npm install @kind-ui\/charts/,
    );
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `homepage overflow at ${width}`,
    );
    await page.locator(".hero img").evaluate((image) => {
      if (!image.complete || image.naturalWidth === 0) throw new Error("Hero artwork did not load");
    });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${output}/homepage-${width}.png` });
    checks.push({ route: homepage, width, status: "passed" });
  }
  await page.goto(origin + publicPath("/docs/chart-components/root/"));
  assert.match(await page.locator("body").innerText(), /Chart Components/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const sidebarConfig = page
    .locator("#nd-sidebar")
    .getByRole("link", { name: "SeriesConfig", exact: true });
  await sidebarConfig.scrollIntoViewIfNeeded();
  await sidebarConfig.click();
  await page.getByRole("heading", { name: "SeriesConfig", exact: true }).waitFor();
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.getByRole("button", { name: "Open Sidebar", exact: true }).click();
  const mobileLegend = page
    .locator("#nd-sidebar-mobile")
    .getByRole("link", { name: "Legend", exact: true });
  await mobileLegend.scrollIntoViewIfNeeded();
  await mobileLegend.click();
  await page.getByRole("heading", { name: "Legend", exact: true }).waitFor();
  for (const route of ["/package-provenance.json", "/examples/package/kind-ui-charts-0.3.0.tgz"])
    assert.equal((await context.request.get(origin + publicPath(route))).status(), 404);
  assert.deepEqual(errors, []);
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ origin, homepage, checks, errors }, null, 2),
  );
} finally {
  await browser.close();
}
console.log(`${checks.length} docs/homepage desktop and mobile checks passed.`);
