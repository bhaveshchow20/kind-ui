import { expect, test } from "@playwright/test";

for (const mode of ["static", "motion"] as const) {
  test(`packed ${mode} materials retain geometry, colors, bounded filters and consumer shapes`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`http://127.0.0.1:${mode === "static" ? 4175 : 4176}/${mode}.html?materials`);
    const curves = page.locator(".recharts-line-curve");
    await expect(curves).toHaveCount(8);
    // Finish entrance without changing data or material.
    await page.getByRole("application").first().focus();
    await page.getByRole("application").nth(1).focus();
    await page.getByRole("application").nth(2).focus();
    await page.getByRole("application").nth(3).focus();
    const geometry = await curves.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("d")),
    );
    expect(geometry.slice(2, 4)).toEqual(geometry.slice(0, 2));
    expect(geometry.slice(4, 6)).toEqual(geometry.slice(0, 2));
    expect(geometry.slice(6, 8)).toEqual(geometry.slice(0, 2));
    const filters = page.locator("filter");
    await expect(filters).toHaveCount(6);
    const ids = await filters.evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
    const bounds = await filters.evaluateAll((nodes) =>
      nodes.map((node) =>
        ["x", "y", "width", "height"].map((key) => Number(node.getAttribute(key))),
      ),
    );
    expect(
      bounds.every(
        (values) => values.every(Number.isFinite) && (values[2] ?? 0) > 0 && (values[3] ?? 0) > 0,
      ),
    ).toBe(true);
    await expect(
      page.locator("feDisplacementMap, filter animate, filter animateTransform"),
    ).toHaveCount(0);
    await page.screenshot({ path: info.outputPath(`${mode}-mono-normal.png`), fullPage: true });
    await page.getByRole("button", { name: "Equal width", exact: true }).click();
    const before = await page.getByRole("application", { name: "plain chart" }).screenshot();
    const paper = await page.getByRole("application", { name: "paper chart" }).screenshot();
    const clay = await page.getByRole("application", { name: "clay chart" }).screenshot();
    expect(paper.equals(before)).toBe(false);
    expect(clay.equals(before)).toBe(false);
    const glowChart = page.getByRole("application", { name: "glow chart" });
    const glow = await glowChart.screenshot();
    expect(glow.equals(before)).toBe(false);
    const glowRegion = page.getByRole("region", { name: "glow", exact: true });
    await glowRegion.evaluate((node) =>
      (node as HTMLElement).style.setProperty("--kind-ui-line-glow-opacity", "0"),
    );
    expect((await glowChart.screenshot()).equals(glow)).toBe(false);
    await glowRegion.evaluate((node) =>
      (node as HTMLElement).style.removeProperty("--kind-ui-line-glow-opacity"),
    );
    await page
      .getByRole("region", { name: "paper", exact: true })
      .evaluate((node) =>
        (node as HTMLElement).style.setProperty("--kind-ui-line-paper-grain", "0"),
      );
    const noGrain = await page.getByRole("application", { name: "paper chart" }).screenshot();
    expect(noGrain.equals(paper)).toBe(false);
    await page
      .getByRole("region", { name: "paper", exact: true })
      .evaluate((node) => (node as HTMLElement).style.removeProperty("--kind-ui-line-paper-grain"));
    await page.screenshot({ path: info.outputPath(`${mode}-equal-width.png`), fullPage: true });
    await page.getByRole("button", { name: "Equal width", exact: true }).click();
    await page.getByRole("button", { name: "Palette", exact: true }).click();
    expect(
      await curves.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
    ).toEqual(geometry);
    expect(await curves.first().evaluate((node) => getComputedStyle(node).stroke)).toBe(
      "rgb(158, 80, 59)",
    );
    await page.screenshot({ path: info.outputPath(`${mode}-color-normal.png`), fullPage: true });
    await page.getByRole("button", { name: "CSS paint", exact: true }).click();
    const cssGlow = await glowChart.screenshot();
    await page.getByRole("button", { name: "Custom color", exact: true }).click();
    await page.getByRole("button", { name: "CSS paint", exact: true }).click();
    expect((await glowChart.screenshot()).equals(cssGlow)).toBe(true);
    await page.getByRole("button", { name: "Gradient", exact: true }).click();
    await expect(glowChart.locator(".recharts-line-curve").first()).toHaveAttribute(
      "stroke",
      "url(#glow-proof-gradient)",
    );
    expect((await glowChart.screenshot()).equals(cssGlow)).toBe(false);
    await glowChart.screenshot({ path: info.outputPath(`${mode}-glow-gradient.png`) });
    await page.getByRole("button", { name: "Gradient", exact: true }).click();
    for (const index of [0, 2, 4, 6])
      expect(await curves.nth(index).evaluate((node) => getComputedStyle(node).stroke)).toBe(
        "rgb(107, 69, 179)",
      );
    await page.getByRole("application", { name: "clay chart" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toContainText("Completed");
    expect(
      await page
        .locator(
          '[data-kind-ui="chart-tooltip"] [data-series="value"] [data-kind-ui="chart-indicator"]',
        )
        .evaluate((node) => getComputedStyle(node).backgroundColor),
    ).toBe("rgb(107, 69, 179)");
    await page.keyboard.press("Escape");
    await page.screenshot({ path: info.outputPath(`${mode}-custom-normal.png`), fullPage: true });
    await page.setViewportSize({ width: 320, height: 900 });
    await expect(page.getByRole("application").first()).toHaveAttribute("width", "272");
    await page.screenshot({ path: info.outputPath(`${mode}-custom-narrow.png`), fullPage: true });
    await page.getByRole("button", { name: "Custom color", exact: true }).click();
    await page.screenshot({ path: info.outputPath(`${mode}-color-narrow.png`), fullPage: true });
    await page.getByRole("button", { name: "Palette", exact: true }).click();
    await page.screenshot({ path: info.outputPath(`${mode}-mono-narrow.png`), fullPage: true });
    await expect(page.locator('[data-kind-ui="line-material"][clip-path^="url"]')).toHaveCount(6);
    await page.getByRole("button", { name: "Gaps", exact: true }).click();
    const gaps = await curves.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    expect(gaps.slice(2, 4)).toEqual(gaps.slice(0, 2));
    expect(gaps.slice(4, 6)).toEqual(gaps.slice(0, 2));
    expect(gaps.slice(6, 8)).toEqual(gaps.slice(0, 2));
    expect(gaps[0]).not.toBe(geometry[0]);
    await page.getByRole("button", { name: "Gaps", exact: true }).click();
    await page.getByRole("button", { name: "Flat", exact: true }).click();
    const flatBounds = await filters.evaluateAll((nodes) =>
      nodes.map((node) => Number(node.getAttribute("height"))),
    );
    expect(flatBounds.every((height) => height >= 14 && height <= 24)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${mode}-flat-narrow.png`), fullPage: true });
    await page.getByRole("button", { name: "Dots", exact: true }).click();
    const dotWidths = await page
      .locator(".recharts-line-dot")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("stroke-width")));
    expect(dotWidths.length).toBeGreaterThan(0);
    expect(new Set(dotWidths).size).toBe(1);
    await page.getByRole("button", { name: "Dots", exact: true }).click();
    await page.getByRole("button", { name: "Native filter", exact: true }).click();
    await expect(filters).toHaveCount(3);
    for (const index of [0, 2, 4, 6])
      await expect(curves.nth(index)).toHaveAttribute("filter", "none");
    await page.getByRole("button", { name: "Native filter", exact: true }).click();
    await expect(filters).toHaveCount(6);
    await page.getByRole("button", { name: "Native shape", exact: true }).click();
    await expect(filters).toHaveCount(3);
    await expect(page.locator(".host-shape")).toHaveCount(4);
    await page.getByRole("button", { name: "Hide", exact: true }).click();
    await expect(curves).toHaveCount(0);
    await expect(filters).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("material paint remains static when Motion is off or reduced", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("http://127.0.0.1:4176/motion.html?materials");
  await page.getByLabel("Animate", { exact: true }).uncheck();
  await expect(page.locator('clipPath[id$="-reveal"]')).toHaveCount(0);
  await expect(page.locator("filter")).toHaveCount(6);
  await page.screenshot({ path: info.outputPath("motion-off.png"), fullPage: true });
  await page.getByLabel("Animate", { exact: true }).check();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="line-frame"][data-motion="off"]')).toHaveCount(4);
  await expect(page.locator('clipPath[id$="-reveal"]')).toHaveCount(0);
  await expect(page.locator("filter")).toHaveCount(6);
  await page.screenshot({ path: info.outputPath("motion-reduced.png"), fullPage: true });
});
