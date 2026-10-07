import { expect, test } from "@playwright/test";

for (const width of [320, 375, 768, 1024, 1280, 1920, 2560]) {
  test(`headline stays stable while pills resize at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    const headline = page.locator("#hero-title");
    await expect(headline).toBeVisible();
    // Watch whole animation frames, rather than just the final settled label.
    const samples: number[] = [];
    for (const group of ["agent", "framework", "stack", "agent", "agent", "agent", "agent"]) {
      await page.locator(`.brand-pill-${group}`).click();
      samples.push(
        ...(await page.evaluate(
          () =>
            new Promise<number[]>((resolve) => {
              const heights: number[] = [];
              const start = performance.now();
              function sample() {
                heights.push(document.querySelector("#hero-title")!.getBoundingClientRect().height);
                if (performance.now() - start < 450) requestAnimationFrame(sample);
                else resolve(heights);
              }
              requestAnimationFrame(sample);
            }),
        )),
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(1);
  });
}
