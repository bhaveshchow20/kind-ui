import { expect, test } from "@playwright/test";

for (const family of ["radar", "radial", "activity"]) {
  test(`${family}: hide retains original layout and native mark identity`, async ({ page }) => {
    await page.goto("/?only=polar");
    const plot = page.locator(`#polar-hide-${family}`);
    const marks = plot.locator(
      family === "radar" ? ".recharts-radar-polygon path" : ".recharts-radial-bar-sector",
    );
    await expect(marks).not.toHaveCount(0);
    await page.waitForTimeout(1200);
    const snapshot = () =>
      marks.evaluateAll((nodes) =>
        nodes
          .map((node) => ({
            d: node.getAttribute("d"),
            series: node.closest("[data-series]")?.getAttribute("data-series"),
            category: node.closest("[data-category]")?.getAttribute("data-category"),
            index: node.closest("[data-native-index]")?.getAttribute("data-native-index"),
          }))
          .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      );
    const baseline = await snapshot();
    const tracks = plot.locator(".recharts-radial-bar-background-sector");
    const trackGeometry = () =>
      tracks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    const initialTracks = await trackGeometry();
    if (family === "radial") {
      await expect(tracks).toHaveCount(6);
      await expect(tracks.first()).toHaveCSS("fill", "rgb(241, 241, 241)");
    }
    for (let repeat = 0; repeat < 3; repeat++) {
      await plot.getByRole("button", { name: "Hide", exact: true }).click();
      await page.waitForTimeout(35);
      expect(await snapshot()).toEqual(baseline);
      const effectiveOpacity = () =>
        marks.evaluateAll((nodes) =>
          nodes.map((node) => {
            let opacity = 1;
            for (let ancestor: Element | null = node; ancestor; ancestor = ancestor.parentElement)
              opacity *= Number(getComputedStyle(ancestor).opacity);
            return opacity;
          }),
        );
      const duringHide = await effectiveOpacity();
      expect(duringHide.some((value) => value > 0 && value < 1)).toBe(true);
      await expect.poll(effectiveOpacity).toContain(0);
      if (family === "radial") {
        expect(await trackGeometry()).toEqual(initialTracks);
        const suppressedTracks = tracks.locator("xpath=self::*[@aria-hidden='true']");
        await expect(suppressedTracks).toHaveCount(3);
        for (const track of await suppressedTracks.all()) {
          await expect(track).toHaveCSS("opacity", "0");
          await expect(track).toHaveCSS("pointer-events", "none");
        }
      }
      expect((await effectiveOpacity()).some((value) => value > 0.9)).toBe(true);
      const survivor =
        family === "radar"
          ? plot.locator('[data-series="second"] .recharts-radar-polygon path').first()
          : family === "radial"
            ? plot.locator('[data-series="second"] .recharts-radial-bar-sector').first()
            : plot.locator(".recharts-radial-bar-sector").nth(1);
      await survivor.dispatchEvent("mouseover", { bubbles: true });
      const raw = JSON.parse(
        (await plot.locator("output[data-polar-pointer]").getAttribute("data-polar-pointer")) ??
          "null",
      );
      expect(raw).toEqual(
        family === "radar"
          ? {
              series: "second",
              rows: [
                { row: "first", value: 90 },
                { row: "second", value: 70 },
                { row: "third", value: 60 },
              ],
            }
          : family === "radial"
            ? { series: "second", row: "first", value: 90, index: 0 }
            : { series: "second", row: "second", value: 90, index: 1 },
      );
      const labels = plot.locator('[data-kind-ui="visibility-label"] text');
      await expect(labels).not.toHaveCount(0);
      await expect(
        plot.locator('[data-kind-ui="visibility-label"][aria-hidden="true"]').first(),
      ).toHaveAttribute("pointer-events", "none");
      await plot.getByRole("button", { name: "Hide", exact: true }).click();
      await page.waitForTimeout(35);
      expect(await snapshot()).toEqual(baseline);
      await expect.poll(effectiveOpacity).toEqual(baseline.map(() => 1));
      if (family === "radial") {
        expect(await trackGeometry()).toEqual(initialTracks);
        await expect(tracks.first()).toHaveCSS("opacity", "1");
        await expect(tracks.locator("xpath=self::*[@aria-hidden='true']")).toHaveCount(0);
      }
    }
    for (const key of ["first", "second", "first"]) {
      const legend = plot.locator(`[data-legend-key="${key}"]`);
      await legend.hover();
      await legend.click();
      expect(await snapshot()).toEqual(baseline);
      await page.keyboard.press("Escape");
    }
  });
}

test("radial categories: keyboard visibility keeps the last visible mark and original slots", async ({
  page,
}) => {
  await page.goto("/?only=polar");
  const plot = page.locator("#polar-hide-activity-visibility");
  const marks = plot.locator(".recharts-radial-bar-sector");
  await expect(marks).toHaveCount(2);
  await page.waitForTimeout(1200);
  const geometry = () => marks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  const baseline = await geometry();
  const first = plot.locator('[data-legend-key="first"]');
  const second = plot.locator('[data-legend-key="second"]');
  for (let repeat = 0; repeat < 3; repeat++) {
    await first.focus();
    await page.keyboard.press("Space");
    await expect(first).toHaveAttribute("aria-pressed", "false");
    await second.focus();
    await page.keyboard.press("Space");
    await expect(second).toHaveAttribute("aria-pressed", "true");
    expect(await geometry()).toEqual(baseline);
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-pressed", "true");
    expect(await geometry()).toEqual(baseline);
  }
});

for (const family of ["radar", "radial", "activity"]) {
  test(`${family}: hide/show reverses paint from current opacity without geometry replay`, async ({
    page,
  }) => {
    await page.goto("/?only=polar");
    const plot = page.locator(`#polar-hide-${family}`);
    const marks = plot.locator(
      family === "radar" ? ".recharts-radar-polygon path" : ".recharts-radial-bar-sector",
    );
    await expect(marks).not.toHaveCount(0);
    await page.waitForTimeout(1200);
    const snapshot = () =>
      marks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    const opacity = () =>
      marks.evaluateAll((nodes) =>
        Math.min(
          ...nodes.map((node) => {
            let result = 1;
            for (let ancestor: Element | null = node; ancestor; ancestor = ancestor.parentElement)
              result *= Number(getComputedStyle(ancestor).opacity);
            return result;
          }),
        ),
      );
    const baseline = await snapshot();
    const toggle = plot.getByRole("button", { name: "Hide", exact: true });
    for (let repeat = 0; repeat < 3; repeat++) {
      await toggle.click();
      await page.waitForTimeout(35);
      const partial = await opacity();
      expect(partial).toBeGreaterThan(0);
      expect(partial).toBeLessThan(1);
      await toggle.click();
      await page.waitForTimeout(25);
      expect(await opacity()).toBeGreaterThan(0);
      expect(await snapshot()).toEqual(baseline);
      await expect.poll(opacity).toBe(1);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect(marks).not.toHaveCount(0);
    await toggle.click();
    expect(await opacity()).toBe(0);
    expect(await snapshot()).toEqual(baseline);
    await toggle.click();
    await expect.poll(opacity).toBe(1);
  });
}
