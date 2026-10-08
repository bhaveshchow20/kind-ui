import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { families } from "../examples/catalog.mjs";
import { checkMobileLayout } from "./check-mobile-layout.mjs";
import { checkThemeSwitch } from "./check-theme-switch-browser.mjs";
import { expectDimmedSeries } from "./interaction-paint.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/line-examples.json", "utf8"));
const familyIds = families.map(({ id }) => id);
const navigation = JSON.parse(readFileSync("content/docs/components/meta.json", "utf8")).pages;
assert.deepEqual([...navigation].sort(), [...familyIds].sort());
const unpublishedFamilies = [
  "bar",
  "combo",
  "pie",
  "donut",
  "bubble",
  "gauge",
  "scatter",
  "radar",
  "radial",
  "radial-bar",
  "histogram",
  "box-plot",
  "waterfall",
  "sankey",
  "heatmap",
].filter((id) => !familyIds.includes(id));
mkdirSync("artifacts", { recursive: true });
const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
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
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  const enlargedSidebar = await page.locator("#nd-sidebar").evaluate((sidebar) => {
    const search = sidebar.querySelector(".glass-sidebar-search > button");
    const selection = sidebar.querySelector(':scope > button[aria-haspopup="dialog"] > span');
    const wordmark = sidebar.querySelector(".kind-wordmark").getBoundingClientRect();
    const github = sidebar.querySelector('a[aria-label="GitHub"]').getBoundingClientRect();
    return {
      searchWidth: search.clientWidth,
      searchContentWidth: search.scrollWidth,
      selectionWidth: selection.clientWidth,
      selectionContentWidth: selection.scrollWidth,
      selectionOverflow: getComputedStyle(selection).textOverflow,
      wordmarkRight: wordmark.right,
      githubLeft: github.left,
    };
  });
  assert.ok(
    enlargedSidebar.searchContentWidth <= enlargedSidebar.searchWidth + 1 &&
      enlargedSidebar.selectionContentWidth <= enlargedSidebar.selectionWidth + 1 &&
      enlargedSidebar.selectionOverflow !== "ellipsis" &&
      enlargedSidebar.wordmarkRight <= enlargedSidebar.githubLeft,
    JSON.stringify(enlargedSidebar),
  );
  const sectionTrigger = page.locator('#nd-sidebar > button[aria-haspopup="dialog"]');
  await sectionTrigger.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").getByRole("link", { name: "Guides", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  await page.locator(".glass-sidebar-search > button").click();
  await page.getByRole("dialog").getByRole("combobox").waitFor();
  await page.keyboard.press("Escape");
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  const links = await page
    .locator("#nd-sidebar a[href]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  assert.deepEqual(
    links.filter((url) => url.startsWith("/docs/components/")),
    navigation.map((id) => `/docs/components/${id}/`),
  );
  const curve = page.locator('[data-component="line-smooth"]');
  await curve.getByRole("combobox", { name: "Curve" }).click();
  await page.getByRole("option", { name: "Step after", exact: true }).click();
  await curve.getByRole("button", { name: "Copy prompt", exact: true }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(prompt.includes("/examples/line-smooth/variants/stepAfter/example.tsx"));
  assert.ok(
    prompt.includes("/docs/components/line/") && prompt.includes("/markdown/installation.md"),
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
    "true",
  );
  await expectDimmedSeries(comparison, "actual");
  const mobilePage = await context.newPage();
  mobilePage.on("pageerror", (error) => errors.push(error.message));
  const searchPage = await context.newPage();
  searchPage.on("pageerror", (error) => errors.push(error.message));
  await searchPage.goto(`${origin}/docs/components/line/`);
  for (const id of familyIds) {
    const title = readFileSync(`content/docs/components/${id}.mdx`, "utf8")
      .match(/^title:\s*(.+)$/m)?.[1]
      .replace(/^["']|["']$/g, "");
    assert.ok(title, `Missing component title: ${id}`);
    await searchPage.getByRole("button", { name: "Search", exact: false }).first().click();
    const dialog = searchPage.getByRole("dialog");
    await dialog.getByRole("combobox").fill(title);
    const result = dialog
      .getByRole("option")
      .filter({ has: searchPage.getByText(title, { exact: true }) })
      .first();
    await result.waitFor();
    await result.click();
    await searchPage.waitForURL(
      (url) => url.pathname.replace(/\/$/, "") === `/docs/components/${id}`,
    );
    await searchPage.getByRole("heading", { name: title, exact: true, level: 1 }).waitFor();
    await searchPage.evaluate(() => (document.documentElement.style.fontSize = "200%"));
    const clippedToc = await searchPage
      .locator("#nd-toc a span")
      .evaluateAll((labels) =>
        labels
          .filter(
            (label, index) =>
              label.scrollWidth > label.clientWidth + 1 ||
              (labels[index + 1] &&
                label.getBoundingClientRect().bottom >
                  labels[index + 1].getBoundingClientRect().top + 1),
          )
          .map((label) => label.textContent),
      );
    assert.deepEqual(clippedToc, [], `${id}: TOC labels must remain readable at 200% text`);
    for (const width of [375, 320]) {
      await mobilePage.setViewportSize({ width, height: 900 });
      await mobilePage.goto(`${origin}/docs/components/${id}/`);
      await mobilePage
        .locator('.chart-example svg, .chart-example [data-kind-ui="heatmap-grid"]')
        .first()
        .waitFor();
      await mobilePage.waitForLoadState("networkidle");
      await mobilePage.addStyleTag({ content: "html { font-size: 200% !important; }" });
      const layout = await mobilePage.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        return {
          fontSize: getComputedStyle(document.documentElement).fontSize,
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
        };
      });
      if (layout.pageWidth > layout.viewportWidth + 1)
        await mobilePage.screenshot({
          path: `artifacts/screenshots/${id}-text200-${width}-overflow.png`,
          fullPage: true,
        });
      assert.equal(layout.fontSize, "32px", `${id}: verify actual 200% root text`);
      assert.ok(
        layout.pageWidth <= layout.viewportWidth + 1,
        `${id}: page overflow at ${width}/200: ${JSON.stringify(layout)}`,
      );
    }
    await searchPage.evaluate(() => (document.documentElement.style.fontSize = ""));
    assert.equal((await context.request.get(`${origin}/docs/components/${id}/`)).status(), 200);
    assert.equal(
      (await context.request.get(`${origin}/markdown/components/${id}.md`)).status(),
      200,
    );
  }
  if (!familyIds.includes("combo")) {
    await searchPage.getByRole("button", { name: "Search", exact: false }).first().click();
    const dialog = searchPage.getByRole("dialog");
    await dialog.getByRole("combobox").fill("Combo Chart");
    await searchPage.waitForTimeout(500);
    assert.equal(await dialog.getByText("Combo Chart", { exact: true }).count(), 0);
  }
  await searchPage.close();
  const searchResponse = await context.request.get(`${origin}/api/search`);
  assert.equal(searchResponse.status(), 200);
  const searchIds = (await searchResponse.json()).internalDocumentIDStore.internalIdToId;
  for (const id of searchIds.filter((id) => id.startsWith("/docs/components/")))
    assert.ok(
      familyIds.some(
        (family) =>
          id === `/docs/components/${family}` ||
          new RegExp(`^/docs/components/${family}-\\d+$`).test(id),
      ),
      `Unexpected component search entry ${id}`,
    );
  for (const id of familyIds)
    assert.ok(searchIds.includes(`/docs/components/${id}`), `Search omits ${id}`);
  for (const family of unpublishedFamilies) {
    assert.ok(
      !searchIds.some(
        (id) =>
          id === `/docs/components/${family}` ||
          new RegExp(`^/docs/components/${family}-\\d+$`).test(id),
      ),
      `Search exposes unpublished ${family}`,
    );
    assert.equal((await context.request.get(`${origin}/docs/components/${family}/`)).status(), 404);
    assert.equal(
      (await context.request.get(`${origin}/markdown/components/${family}.md`)).status(),
      404,
    );
  }
  await page.getByRole("button", { name: "Toggle Theme", exact: false }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  await page.setViewportSize({ width: 320, height: 812 });
  // Narrow previews keep one named prompt action per example.
  assert.equal(
    await page.getByRole("button", { name: /^(?:Copy prompt|Copied)$/ }).count(),
    await page.locator(".chart-example").count(),
  );
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
        registeredComponents: familyIds,
        navigationLinks: links.filter((url) => url.startsWith("/docs/components/")),
        removedRoutes: unpublishedFamilies,
        navigationSearch: "passed",
        enlargedSidebar,
        visibility: "passed",
        darkMobileEnlarged: "passed",
        errors,
      },
      null,
      2,
    ),
  );
  await context.close();
  await checkThemeSwitch(browser, origin);
  await checkMobileLayout(browser, origin);
  console.log(
    "Registered component navigation/search/routes, removed routes, Line selected prompt/source, legend visibility and dark mobile enlarged text passed.",
  );
} finally {
  await browser.close();
}

await import("./check-docs-cleanup.mjs");
