import { expect, test } from "@playwright/test";

for (const family of ["line", "area", "bar-grouped", "bar-stacked", "scatter"]) {
  for (const visibility of ["root", "native"]) {
    test(`${family} ${visibility} hiding retains independent geometry through interruptions`, async ({
      page,
    }) => {
      await page.goto("/");
      const chart = page.locator(`#${family}-${visibility}`);
      await chart.scrollIntoViewIfNeeded();
      const geometry = () =>
        chart.locator('[data-kind-ui="series-interaction"]').evaluateAll((series) =>
          series.map((node) => ({
            series: node.getAttribute("data-series"),
            geometry: [...node.querySelectorAll("path, rect, circle")].map((mark) =>
              Object.fromEntries(
                ["d", "x", "y", "width", "height", "cx", "cy", "r"].map((attribute) => [
                  attribute,
                  mark.getAttribute(attribute),
                ]),
              ),
            ),
          })),
        );
      await expect
        .poll(async () => {
          const series = await geometry();
          return series.length === 2 && series.every((item) => item.geometry.length > 0);
        })
        .toBe(true);
      await page.waitForTimeout(1200);
      const baseline = await geometry();
      await chart.locator('[data-kind-ui="series-interaction"]').evaluateAll((series) => {
        for (const node of series)
          node
            .querySelector("path, rect, circle")
            ?.setAttribute("data-original-series-node", node.getAttribute("data-series") ?? "");
      });
      const assertNativeIdentity = async () => {
        await expect(
          chart.locator('[data-series="second"] [data-original-series-node="second"]'),
        ).toHaveCount(1);
      };
      const assertPointer = async () => {
        if (!family.startsWith("bar") && family !== "scatter") return;
        const series = chart.locator('[data-kind-ui="series-interaction"][data-series="second"]');
        await series
          .locator(family === "scatter" ? ".recharts-symbols" : ".recharts-bar-rectangle")
          .first()
          .click();
        await expect(chart.locator("[data-pointer]")).toHaveText(
          JSON.stringify({ series: "second", row: "A", value: 12, originalDataIndex: 0 }),
        );
      };
      await assertPointer();
      if (family.startsWith("bar"))
        await expect(
          chart.locator(".recharts-zIndex-layer_54 .recharts-bar-background-rectangle"),
        ).toHaveCount(6);
      for (let count = 0; count < 4; count++) {
        await chart.getByRole("button", { name: "Toggle first", exact: true }).click();
        await expect.poll(geometry).toEqual(baseline);
        const first = chart.locator('[data-kind-ui="series-interaction"][data-series="first"]');
        const firstLabel = chart
          .locator('[data-kind-ui="visibility-label"]')
          .filter({ hasText: "100" })
          .first();
        if (count % 2 === 0) {
          await expect(first).toHaveAttribute("aria-hidden", "true");
          await expect(first).toHaveAttribute("pointer-events", "none");
          await expect
            .poll(() =>
              first
                .locator('[data-kind-ui="series-interaction-paint"]')
                .evaluate((node) => Number(getComputedStyle(node).opacity)),
            )
            .toBeCloseTo(0, 2);
          await expect
            .poll(() =>
              firstLabel
                .locator('[data-kind-ui="interaction-paint"]')
                .evaluate((node) => Number(getComputedStyle(node).opacity)),
            )
            .toBeCloseTo(0, 2);
        } else {
          await expect(first).not.toHaveAttribute("aria-hidden", "true");
          await expect
            .poll(() =>
              first
                .locator('[data-kind-ui="series-interaction-paint"]')
                .evaluate((node) => Number(getComputedStyle(node).opacity)),
            )
            .toBeCloseTo(1, 2);
          await expect
            .poll(() =>
              firstLabel
                .locator('[data-kind-ui="interaction-paint"]')
                .evaluate((node) => Number(getComputedStyle(node).opacity)),
            )
            .toBeCloseTo(1, 2);
        }
        await assertNativeIdentity();
        if (family === "scatter")
          await expect(
            chart.locator('[data-series="second"] [data-recharts-item-id]').first(),
          ).toHaveAttribute("data-recharts-item-id", `${family}-${visibility}-second`);
      }
      await chart.getByRole("button", { name: "Toggle first", exact: true }).click();
      await page.waitForTimeout(250);
      await assertPointer();
      await expect.poll(geometry).toEqual(baseline);
      await chart.getByRole("button", { name: "Toggle first", exact: true }).click();
      await expect.poll(geometry).toEqual(baseline);
      await assertPointer();
      await assertNativeIdentity();
    });
  }
}

for (const family of ["line", "area", "bar-grouped", "bar-stacked", "scatter"]) {
  for (const mode of ["motion", "reduced", "disabled"]) {
    test(`${family} ${mode} paint fades reverse without geometry reset`, async ({ page }) => {
      if (mode === "reduced") await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(mode === "disabled" ? "/?animate=false" : "/");
      const chart = page.locator(`#${family}-root`);
      await chart.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      const first = chart.locator('[data-kind-ui="series-interaction"][data-series="first"]');
      const paint = first.locator('[data-kind-ui="series-interaction-paint"]');
      const opacity = () => paint.evaluate((node) => Number(getComputedStyle(node).opacity));
      const portalPaint = chart
        .locator('[data-kind-ui="visibility-label"]')
        .filter({ hasText: "100" })
        .first()
        .locator('[data-kind-ui="interaction-paint"]');
      const portalOpacity = () =>
        portalPaint.evaluate((node) => Number(getComputedStyle(node).opacity));
      const toggle = () =>
        chart
          .getByRole("button", { name: "Toggle first", exact: true })
          .evaluate((node) => (node as HTMLButtonElement).click());
      const before = await first
        .locator("path,rect,circle")
        .evaluateAll((nodes) => nodes.map((node) => node.outerHTML));
      await toggle();
      await expect(first).toHaveAttribute("aria-hidden", "true");
      await expect(first).toHaveAttribute("pointer-events", "none");
      if (mode === "motion") {
        await page.waitForTimeout(60);
        const descending = await opacity();
        expect(descending).toBeGreaterThan(0);
        expect(descending).toBeLessThan(1);
        expect(await portalOpacity()).toBeGreaterThan(0);
        expect(await portalOpacity()).toBeLessThan(1);
        await toggle();
        const reversal = await opacity();
        expect(Math.abs(reversal - descending)).toBeLessThan(0.25);
        await expect.poll(opacity).toBeCloseTo(1, 2);
      } else {
        await expect.poll(opacity).toBe(0);
        await expect.poll(portalOpacity).toBe(0);
        await toggle();
        await expect.poll(opacity).toBe(1);
      }
      await expect(first).not.toHaveAttribute("aria-hidden", "true");
      expect(
        await first
          .locator("path,rect,circle")
          .evaluateAll((nodes) => nodes.map((node) => node.outerHTML)),
      ).toEqual(before);
      await chart
        .getByRole("button", { name: "Focus second", exact: true })
        .evaluate((node) => (node as HTMLButtonElement).click());
      if (mode === "motion") {
        await page.waitForTimeout(60);
        expect(await opacity()).toBeGreaterThan(0.28);
        expect(await opacity()).toBeLessThan(1);
      }
      await expect.poll(opacity).toBeCloseTo(0.28, 2);
      await expect.poll(portalOpacity).toBeCloseTo(0.28, 2);
      await chart
        .getByRole("button", { name: "Focus second", exact: true })
        .evaluate((node) => (node as HTMLButtonElement).click());
      await expect.poll(opacity).toBeCloseTo(1, 2);
      await expect.poll(portalOpacity).toBeCloseTo(1, 2);
    });
  }
}
