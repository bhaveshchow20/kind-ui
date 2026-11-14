import { expect, test } from "@playwright/test";
import { documentationCharts, siteLinks } from "../lib/site-links";

const basePath = process.env.NEXT_PUBLIC_SHOWCASE_BASE_PATH ?? "";

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
  await expect(docs).toHaveCount(2);
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
