import { expect, test } from "./browser";

/** Public packed fixture proof; SVG animated lengths measure the painted viewport clip. */
export function directionalEntrances(url: string) {
  for (const direction of ["left-to-right", "right-to-left", "center-out", "edges-in"]) {
    test(`directional entrance ${url}: ${direction} retains paths and releases its clip`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.goto(`${url}${url.includes("?") ? "&" : "?"}direction=${direction}`);
      const clip = page.locator(`clipPath[data-reveal-direction="${direction}"]`).first();
      await expect(clip).toHaveCount(1);
      await expect(page.locator('[data-kind-ui="chart-loading-status"]')).toHaveCount(0);
      const rects = clip.locator("rect");
      await expect(rects).toHaveCount(direction === "edges-in" ? 2 : 1);
      const paths = () =>
        page
          .locator(".recharts-line-curve, .recharts-area-area")
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
      const before = await paths();
      await page.clock.runFor(300);
      const bounds = await rects.evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node as SVGRectElement;
          return {
            x: rect.x.baseVal.value,
            width: rect.width.baseVal.value,
            viewport: rect.ownerSVGElement?.viewBox.baseVal.width ?? 0,
            transform: rect.getAttribute("transform"),
          };
        }),
      );
      const first = bounds[0];
      if (!first) throw new Error("Missing reveal rectangle");
      expect(first.width).toBeGreaterThan(0);
      expect(first.width).toBeLessThan(first.viewport);
      expect(first.transform).toBeNull();
      if (direction === "left-to-right" || direction === "edges-in") expect(first.x).toBe(0);
      if (direction === "right-to-left")
        expect(first.x + first.width).toBeCloseTo(first.viewport, 1);
      if (direction === "center-out")
        expect(first.x + first.width / 2).toBeCloseTo(first.viewport / 2, 1);
      if (direction === "edges-in") {
        if (!bounds[1]) throw new Error("Missing right reveal rectangle");
        expect(bounds[1].x + bounds[1].width).toBeCloseTo(first.viewport, 1);
        expect(bounds[1].width).toBeCloseTo(first.width, 1);
        expect(bounds[1].x).toBeGreaterThan(first.width);
      }
      expect(await paths()).toEqual(before);
      await page.clock.runFor(1000);
      await expect(page.locator("clipPath[data-reveal-direction]")).toHaveCount(0);
      expect(await paths()).toEqual(before);
      await page.getByRole("button", { name: "Unmount chart", exact: true }).click();
      await page.getByRole("button", { name: "Unmount chart", exact: true }).click();
      await expect(page.locator("clipPath[data-reveal-direction]").first()).toHaveCount(1);
      await page.getByRole("button", { name: "Toggle loading", exact: true }).click();
      await expect(page.locator("clipPath[data-reveal-direction]")).toHaveCount(0);
      await expect(page.locator('[data-kind-ui="chart-loading-status"]').first()).toHaveText(
        "Loading chart",
      );
      await page.getByRole("button", { name: "Toggle loading", exact: true }).click();
      await expect(page.locator("clipPath[data-reveal-direction]").first()).toHaveCount(1);
      await expect(page.locator('[data-kind-ui="chart-loading-status"]')).toHaveCount(0);
      await page.getByLabel("Animate", { exact: true }).uncheck();
      await expect(page.locator("clipPath[data-reveal-direction]")).toHaveCount(0);
    });
  }
  test(`directional entrance ${url}: live reduced motion and interaction release clips`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.goto(`${url}${url.includes("?") ? "&" : "?"}direction=edges-in`);
    await expect(page.locator("clipPath[data-reveal-direction]").first()).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("clipPath[data-reveal-direction]")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    await expect(page.locator("clipPath[data-reveal-direction]")).toHaveCount(0);
    await page.reload();
    await page.getByRole("application").first().focus();
    await expect(page.locator("clipPath[data-reveal-direction]")).toHaveCount(0);
  });
}
