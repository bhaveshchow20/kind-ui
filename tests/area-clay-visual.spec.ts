import { expect, test } from "@playwright/test";

for (const palette of ["Pink", "Color", "Monochrome"] as const) {
  test(`area clay relief stays native in ${palette} at normal and narrow widths`, async ({
    page,
  }, info) => {
    await page.goto("/areas.html");
    await page.getByRole("button", { name: palette, exact: true }).click();
    const paths = page.locator(".recharts-area-area");
    await expect(paths).toHaveCount(11);
    const native = await paths.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    await page.getByRole("button", { name: "Clay", exact: true }).click();
    expect(await paths.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")))).toEqual(
      native,
    );
    for (const width of [1000, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(width);
      for (const region of ["Smooth", "Stacked", "Gradient"]) {
        await page.getByRole("region", { name: region, exact: true }).screenshot({
          path: info.outputPath(`${palette.toLowerCase()}-${region.toLowerCase()}-${width}.png`),
        });
      }
      await page.screenshot({
        path: info.outputPath(`${palette.toLowerCase()}-all-${width}.png`),
        fullPage: true,
      });
    }
  });
}

test("packed area Clay preserves translucent and gradient output alpha while adding relief", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:4181/static.html?paint");
  await expect(page.locator(".recharts-area-area")).toHaveCount(4);
  const paints = await page.evaluate(async () => {
    const result: Record<string, number[]> = {};
    for (const svg of document.querySelectorAll<SVGSVGElement>("svg.recharts-surface")) {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 120;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No canvas context");
      context.drawImage(image, 0, 0);
      result[svg.getAttribute("aria-label") ?? ""] = Array.from(
        context.getImageData(0, 0, 160, 120).data,
      );
    }
    return result;
  });
  for (const paint of ["solid", "gradient"]) {
    const plain = paints[`${paint}-plain`];
    const clay = paints[`${paint}-clay`];
    if (!plain || !clay) throw new Error("Missing public paint consumer");
    const alphaDiff = plain.flatMap((alpha, index) =>
      index % 4 === 3 && alpha > 0 ? [Math.abs(alpha - (clay[index] ?? 0))] : [],
    );
    const castAlpha = plain.flatMap((alpha, index) =>
      index % 4 === 3 && alpha === 0 ? [clay[index] ?? 0] : [],
    );
    // The exterior cast stays below 6.3% opacity, including raster edge coverage.
    expect(Math.max(...castAlpha)).toBeLessThanOrEqual(16);
    expect(castAlpha.filter((alpha) => alpha > 0).length).toBeGreaterThan(50);
    expect(Math.max(...alphaDiff)).toBeLessThanOrEqual(1);
    const rgbChanges = plain.filter(
      (value, index) => index % 4 !== 3 && Math.abs(value - (clay[index] ?? 0)) > 5,
    ).length;
    expect(rgbChanges).toBeGreaterThan(200);
  }
});
