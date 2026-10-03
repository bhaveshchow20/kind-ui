import { expect, test } from "@playwright/test";

test("named and namespace single-package compositions retain native geometry, defaults and interactions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const family of ["line", "radar", "scatter", "pie"]) {
    const native = page.locator(`[data-import="native"] [data-family="${family}"]`);
    const geometry = (scope: typeof native) =>
      scope.locator("svg").evaluateAll((svgs) =>
        svgs.flatMap((svg) =>
          Array.from(svg.querySelectorAll("path, polygon, line, circle, text"))
            .filter((node) => !node.closest("defs"))
            .map((node) => ({
              tag: node.tagName,
              attrs: [
                "d",
                "points",
                "x",
                "y",
                "x1",
                "x2",
                "y1",
                "y2",
                "cx",
                "cy",
                "r",
                "stroke",
                "fill",
                "stroke-width",
              ].map((name) => node.getAttribute(name)),
              text: node.tagName === "text" ? node.textContent : null,
            })),
        ),
      );
    await expect(native.locator("svg")).toBeVisible();
    for (const kind of ["named", "namespace"]) {
      const scope = page.locator(`[data-import="${kind}"] [data-family="${family}"]`);
      await expect(scope.locator("svg")).toBeVisible();
      await expect.poll(() => geometry(scope)).toEqual(await geometry(native));
    }
  }
  for (const kind of ["named", "namespace", "native"]) {
    const scope = page.locator(`[data-import="${kind}"]`);
    await expect(scope.locator('[data-composition-ref="attached"]')).toHaveCount(1);
    await scope.locator('[data-family="line"] .recharts-xAxis-tick-labels text').first().click();
    await expect(scope.locator("[data-clicks]")).toHaveText("1");
    await scope.locator('[data-family="scatter"] .recharts-symbols').first().click();
    await expect(scope.locator("[data-clicks]")).toHaveText("2");
    await scope.locator('[data-family="pie"] .recharts-sector').first().click();
    await expect(scope.locator("[data-clicks]")).toHaveText("3");
    const line = scope.locator('[data-family="line"] svg');
    await line.focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      scope.locator('[data-family="line"] [data-kind-ui="tooltip-frame"]'),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    const brush = scope.locator('[data-family="line"] .recharts-brush-traveller').first();
    const box = await brush.boundingBox();
    if (!box) throw new Error("Brush traveller missing");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(scope.locator("[data-range]")).not.toBeEmpty();
    await scope.getByRole("button", { name: "Resize" }).click();
    await expect.poll(() => line.getAttribute("width")).toBe("360");
  }
  expect(errors).toEqual([]);
});
