import { expect, test } from "./browser";

for (const mode of ["static", "motion"] as const) {
  test(`packed area ${mode} materials preserve paths, shape/filter ownership and interactions`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${mode === "static" ? 4181 : 4182}/${mode}.html`);
    const paths = page.locator(".recharts-area-area");
    await expect(paths).toHaveCount(2);
    const geometry = await paths.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("d")),
    );
    for (const material of ["paper", "clay", "glow", "plain", "clay"]) {
      await page.getByLabel("Material", { exact: true }).selectOption(material);
      await expect(page.locator('[data-kind-ui="area-material"]')).toHaveCount(
        material === "plain" ? 0 : 1,
      );
      expect(
        await paths.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
      ).toEqual(geometry);
      await expect(page.locator("[data-host-shape]")).toHaveCount(1);
      await expect(paths.first()).toHaveAttribute("fill", "url(#packed-gradient)");
      const chart = page.getByRole("application", { name: "Packed chart" });
      await chart.focus();
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("status")).toBeVisible();
      await page.keyboard.press("Escape");
    }
    await page.getByLabel("Native filter").check();
    await expect(page.locator('[data-kind-ui="area-material"]')).toHaveCount(0);
    await expect(paths.last()).toHaveAttribute("filter", "url(#host-filter)");
    await page.getByLabel("Native filter").uncheck();
    await page.getByLabel("Stack", { exact: true }).check();
    await expect(page.locator('[data-kind-ui="area-material"]')).toHaveCount(1);
    await page.getByRole("button", { name: "Other", exact: true }).click();
    await expect(page.locator('[data-kind-ui="area-material"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Other", exact: true }).click();
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    await expect(page.locator('[data-kind-ui="area-material"] filter')).toHaveCount(1);
    await page.getByLabel("Overshoot", { exact: true }).check();
    await page.getByLabel("Stack", { exact: true }).uncheck();
    for (const vertical of [false, true]) {
      await page.getByLabel("Vertical", { exact: true }).setChecked(vertical);
      for (const material of ["paper", "clay", "glow"]) {
        await page.getByLabel("Material", { exact: true }).selectOption(material);
        await expect
          .poll(() =>
            page.locator('[data-kind-ui="area-material"]').evaluate((group) => {
              const filter = group.querySelector("filter");
              const shape = group.querySelector("g[filter]") as SVGGElement | null;
              if (!filter || !shape) return false;
              const box = shape.getBBox();
              const x = Number(filter.getAttribute("x"));
              const y = Number(filter.getAttribute("y"));
              return (
                x <= box.x &&
                y <= box.y &&
                x + Number(filter.getAttribute("width")) >= box.x + box.width &&
                y + Number(filter.getAttribute("height")) >= box.y + box.height
              );
            }),
          )
          .toBe(true);
      }
    }
    expect(errors).toEqual([]);
  });
}

for (const mode of ["static", "motion", "reduced"] as const) {
  test(`area finishes at normal/narrow widths with pink clay and repeated interaction: ${mode}`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    await page.goto("/areas.html");
    if (mode !== "static") await page.getByLabel("Motion", { exact: true }).check();
    const paths = page.locator(".recharts-area-area");
    await expect(paths).toHaveCount(11);
    const before = await paths.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    await page.getByRole("button", { name: "Pink", exact: true }).click();
    for (const material of ["Paper", "Clay", "Glow", "Plain", "Clay"]) {
      await page.getByRole("button", { name: material, exact: true }).click();
      await expect(page.locator('[data-kind-ui="area-material"]')).toHaveCount(
        material === "Plain" ? 0 : 11,
      );
      expect(
        await paths.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
      ).toEqual(before);
      const ids = await page
        .locator('[data-kind-ui="area-material"] filter')
        .evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      if (material !== "Plain")
        await page
          .getByRole("region", { name: "Smooth", exact: true })
          .screenshot({ path: info.outputPath(`${mode}-${material.toLowerCase()}-pink.png`) });
    }
    const gradient = page
      .getByRole("region", { name: "Gradient", exact: true })
      .locator(".recharts-area-area");
    await expect(gradient).toHaveAttribute("fill", /url\(#area-gradient-/);
    for (const width of [1000, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(width);
      await page.screenshot({ path: info.outputPath(`pink-clay-${width}.png`), fullPage: true });
      const chart = page
        .getByRole("region", { name: "Smooth", exact: true })
        .getByRole("application");
      for (let i = 0; i < 3; i++) {
        await page.getByRole("button", { name: "Clay", exact: true }).click();
        await chart.focus();
        await page.keyboard.press("ArrowLeft");
        await page.keyboard.press("ArrowRight");
        await expect(page.getByRole("status").first()).toBeVisible();
        await page.keyboard.press("Escape");
      }
    }
    await page.getByLabel("Missing April data").check();
    await expect(
      page.getByRole("region", { name: "Smooth", exact: true }).locator(".recharts-area-area"),
    ).toHaveAttribute("d", /M.*M/);
    const interactive = page.getByRole("region", { name: "Interactive", exact: true });
    await interactive.getByRole("button", { name: "Desktop", exact: true }).click();
    await expect(interactive.locator('[data-kind-ui="area-material"]')).toHaveCount(1);
    await interactive.getByRole("button", { name: "Desktop", exact: true }).click();
    await expect(interactive.locator('[data-kind-ui="area-material"]')).toHaveCount(2);
    if (mode === "reduced") await expect(page.locator("[data-area-reveal]")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
