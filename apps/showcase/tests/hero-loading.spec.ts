import { expect, test } from "@playwright/test";

for (const width of [393, 1280]) {
  test(`hero is readable before application JavaScript loads at ${width}px`, async ({
    browser,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("Configure a showcase baseURL before running browser tests");
    const context = await browser.newContext({
      baseURL,
      viewport: { width, height: 900 },
    });
    try {
      const page = await context.newPage();
      // Keep Next's inline streaming bootstrap; withhold the application bundles.
      await page.route("**/*", (route) =>
        route.request().resourceType() === "script" ? route.abort() : route.continue(),
      );
      await page.goto("./");
      await expect(page.locator(".kind-hero-copy")).toHaveCSS("opacity", "1");
      await expect(page.locator(".kind-hero-copy")).toHaveCSS("transform", "none");
      await expect(page.locator("#hero-title")).toBeVisible();
      await expect(page.locator(".brand-pill-framework .brand-pill-face")).toHaveText("React.js");
      await expect(page.locator(".brand-pill-stack .brand-pill-face")).toHaveText("Recharts");
      await expect(page.locator(".brand-pill-agent .brand-pill-face")).toHaveText("Codex");
    } finally {
      await context.close();
    }
  });
}
