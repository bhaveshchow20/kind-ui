import { expect, test } from "@playwright/test";
import {
  assertIndexingHTML,
  assertIndexingRoutes,
  assertPageSEO,
} from "../../../scripts/indexing-output.mjs";
import { showcaseURL } from "../../indexing.mjs";
import { documentationCharts, footerLinkGroups, siteLinks } from "../lib/site-links";

const basePath = process.env.NEXT_PUBLIC_SHOWCASE_BASE_PATH ?? "";

test("agent reference aliases resolve directly to the generated Docs reference", async ({
  request,
}) => {
  for (const prefix of new Set(["", basePath])) {
    for (const file of ["llms.txt", "llms-full.txt"]) {
      const response = await request.get(`http://127.0.0.1:7273${prefix}/${file}`, {
        maxRedirects: 0,
      });
      expect(response.status()).toBe(308);
      expect(response.headers().location).toBe(`https://kindui.dev/charts/docs/${file}`);
    }
  }
});

test("home redirects only in prefixed mode and direct refresh loads assets", async ({
  page,
  request,
}) => {
  const root = await request.get("http://127.0.0.1:7273/", { maxRedirects: 0 });
  expect(root.status()).toBe(basePath ? 307 : 200);
  if (basePath) expect(root.headers().location).toBe(basePath);
  const missing: string[] = [];
  page.on("response", (response) => {
    if (response.url().startsWith("http://127.0.0.1:7273/") && response.status() >= 400)
      missing.push(response.url());
  });
  await page.goto("./");
  await page.reload();
  await expect(page.locator(".wordmark")).toHaveAttribute("href", siteLinks.home);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const asset of [
    "footer-clouds.webp",
    "cherry-blossom.png",
    "kind-bloom.svg",
    "kind-bloom.ico",
    "kind-bloom-apple.png",
  ]) {
    expect((await request.get(`http://127.0.0.1:7273${basePath}/${asset}`)).status()).toBe(200);
  }
  await expect(page.locator("head link[rel='icon']").first()).toHaveAttribute(
    "href",
    `${basePath}/cherry-blossom.png`,
  );
  expect(missing).toEqual([]);
});

test("Docs links, search aliases and page anchors have real destinations", async ({ page }) => {
  await page.goto("./");
  const docs = page.getByRole("link", {
    name: /^(Docs|Go to Documentation|Documentation|Read the docs|Get started with the docs|Meet Kind UI Charts)$/,
    exact: true,
    includeHidden: true,
  });
  await expect(docs).toHaveCount(3);
  const originalViewport = page.viewportSize();
  await expect(
    page.locator(".kind-nav-links").getByRole("link", { name: "Documentation" }),
  ).toBeVisible();
  await expect(page.locator(".mobile-docs")).toBeHidden();
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator(".mobile-docs")).toBeVisible();
    await expect(page.locator(".mobile-docs")).toHaveAttribute("href", siteLinks.docs);
    await expect(page.locator(".kind-nav-links")).toBeHidden();
  }
  if (originalViewport) await page.setViewportSize(originalViewport);
  for (const link of await docs.all()) await expect(link).toHaveAttribute("href", siteLinks.docs);
  await page.getByRole("button", { name: "Search documentation" }).click();
  const results = page.locator(".documentation-search-results");
  for (const { name, href } of documentationCharts) {
    await expect(results.getByRole("link", { name: `${name} Chart`, exact: true })).toHaveAttribute(
      "href",
      href,
    );
  }
  await results.getByRole("link", { name: "Line Chart", exact: true }).focus();
  await expect(results.getByRole("link", { name: "Line Chart", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Search documentation" })).toBeFocused();
  await page.getByRole("link", { name: "Skip to components" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#showcase")).toBeFocused();
  await page.getByRole("link", { name: "Back to top ↑" }).click();
  await expect(page).toHaveURL(/#top$/);
  await expect(page.locator(".wordmark")).toBeInViewport();
});

test("rapid family switching and search panel scrolling stay usable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("./");
  for (const name of ["Histogram", "Line", "Box Plot", "Line", "Heatmap", "Bar", "Area"]) {
    await page.getByRole("tab", { name, exact: true }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole("button", { name: "Search documentation" }).click();
  const results = page.locator(".documentation-search-results");
  await results.getByRole("link", { name: "Box Plot Chart", exact: true }).focus();
  await expect(results.getByRole("link", { name: "Box Plot Chart", exact: true })).toBeInViewport();
  expect(await results.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Search documentation" })).toBeFocused();
});

test("footer directory keeps chart and resource links visible on desktop and narrow screens", async ({
  page,
}) => {
  await page.goto("./#footer");
  const footer = page.locator("#footer");
  const directory = footer.getByRole("navigation", { name: "Footer directory" });
  for (const name of ["Charts", "Guides", "Resources"]) {
    await expect(directory.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  for (const href of footerLinkGroups[0].links.slice(0, 6).map((chart) => chart.href)) {
    await expect(directory.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
  await expect(directory.getByRole("link", { name: /^View all/ })).toHaveAttribute(
    "href",
    siteLinks.docs,
  );
  await expect(directory.getByRole("link", { name: "Back to top ↑", exact: true })).toHaveAttribute(
    "href",
    "#top",
  );
  await expect(directory.getByRole("link", { name: "llms.txt", exact: true })).toHaveAttribute(
    "href",
    `${siteLinks.docs}llms.txt`,
  );
  for (const width of [1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await footer.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(width);
    for (const link of await directory.getByRole("link").all()) await expect(link).toBeVisible();
  }
  const firstGuide = directory.getByRole("link", { name: "Line charts", exact: true });
  await firstGuide.focus();
  await expect(firstGuide).toBeFocused();
});

test("initial homepage HTML and metadata routes match deployment indexing intent", async ({
  request,
}) => {
  const origin = `http://127.0.0.1:7273${basePath}`;
  const page = await request.get(`${origin}/`);
  expect(page.status()).toBe(200);
  const html = await page.text();
  assertIndexingHTML(html, showcaseURL);
  const seo = assertPageSEO(html, showcaseURL);
  expect(seo.title).toBe("Kind UI Charts — Composable React charts");
  expect(html.replace(/<[^>]*>/g, "")).toContain("npm install");
  expect(html).toContain("@kind-ui/charts");
  expect(html).toContain(`href="${siteLinks.docs}"`);
  // Links must exist before JS, rather than appearing only inside the search dialog.
  const initialHTML = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
  for (const href of footerLinkGroups[0].links.map((chart) => chart.href)) {
    expect(initialHTML).toContain(`href="${href}"`);
  }
  const structuredData = [
    ...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g),
  ];
  expect(structuredData).toHaveLength(1);
  const source = JSON.parse(structuredData[0][1]);
  expect(source["@type"]).toBe("SoftwareSourceCode");
  expect(source.name).toBe("@kind-ui/charts");
  expect(source.url).toBe("https://kindui.dev/charts");
  expect(source.codeRepository).toBe(siteLinks.repository);
  expect(source.license).toBe(`${siteLinks.repository}/blob/main/LICENSE`);
  expect(source.aggregateRating).toBeUndefined();
  expect(source.offers).toBeUndefined();
  const direct = await request.get(origin, { maxRedirects: 0 });
  expect(direct.status()).toBe(200);
  const robots = await request.get(`${origin}/robots.txt`);
  const sitemap = await request.get(`${origin}/sitemap.xml`);
  expect(robots.status()).toBe(200);
  expect(sitemap.status()).toBe(200);
  assertIndexingRoutes(await robots.text(), await sitemap.text(), [showcaseURL]);
});
