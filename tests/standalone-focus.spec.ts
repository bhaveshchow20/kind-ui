import { expect, test } from "@playwright/test";

test("Sankey focus fades both directions and reverses without replaying geometry", async ({
  page,
}) => {
  await page.goto("/?only=standalone");
  const plot = page.locator("#standalone-sankey");
  const wind = plot.locator(
    '[data-kind-ui="sankey-focus-mark"][data-node="wind"] > [data-kind-ui="interaction-paint"]',
  );
  await expect(wind).toHaveCSS("opacity", "1");
  await plot.locator('[data-kind-ui="sankey"]').dispatchEvent("pointerdown");
  const geometry = () =>
    plot
      .locator("rect,path:not([data-kind-ui])")
      .evaluateAll((marks) =>
        marks.map((mark) =>
          ["x", "y", "width", "height", "d", "stroke-width"].map((attribute) =>
            mark.getAttribute(attribute),
          ),
        ),
      );
  const baseline = await geometry();
  const opacity = () => wind.evaluate((mark) => Number(getComputedStyle(mark).opacity));
  const toggle = () =>
    plot.locator('[data-node-key="solar"]').evaluate((button: HTMLButtonElement) => button.click());
  await toggle();
  await expect.poll(opacity, { intervals: [10], timeout: 1000 }).toBeLessThan(1);
  const dimming = await opacity();
  expect(dimming).toBeGreaterThan(0.28);
  await toggle();
  await expect.poll(opacity, { intervals: [10], timeout: 1000 }).toBeGreaterThan(dimming);
  const restoring = await opacity();
  expect(restoring).toBeLessThan(1);
  // Reverse again before restoration completes.
  await toggle();
  await expect(wind).toHaveCSS("opacity", "0.28");
  await toggle();
  await expect.poll(opacity, { intervals: [10], timeout: 1000 }).toBeGreaterThan(0.28);
  expect(await opacity()).toBeLessThan(1);
  await expect(wind).toHaveCSS("opacity", "1");
  expect(await geometry()).toEqual(baseline);
  await expect(plot.locator('[data-kind-ui="sankey-link-entrance"]')).toHaveCount(0);
  await plot.getByRole("button", { name: "Disable motion" }).click();
  await toggle();
  await expect(wind).toHaveCSS("opacity", "0.28");
  await toggle();
  await expect(wind).toHaveCSS("opacity", "1");
  await plot.getByRole("button", { name: "Enable motion" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await toggle();
  await expect(wind).toHaveCSS("opacity", "0.28");
  await toggle();
  await expect(wind).toHaveCSS("opacity", "1");
  expect(await geometry()).toEqual(baseline);
});

test("Sankey interrupted hover, node activation and legend focus preserve keyed layout and raw flows", async ({
  page,
}) => {
  await page.goto("/?only=standalone");
  const plot = page.locator("#standalone-sankey");
  const nodes = plot.locator('[data-kind-ui="sankey-focus-mark"][data-node]');
  const links = plot.locator('[data-kind-ui="sankey-focus-mark"][data-source]');
  await expect(nodes).toHaveCount(4);
  await expect(links).toHaveCount(4);
  const snapshot = () =>
    plot.locator('[data-kind-ui="sankey-focus-mark"]').evaluateAll((marks) =>
      marks.map((mark) => ({
        node: mark.getAttribute("data-node"),
        source: mark.getAttribute("data-source"),
        target: mark.getAttribute("data-target"),
        geometry: [...mark.querySelectorAll("rect,path:not([data-kind-ui])")].map((shape) =>
          ["x", "y", "width", "height", "d", "stroke-width"].map((attribute) =>
            shape.getAttribute(attribute),
          ),
        ),
      })),
    );
  const baseline = await snapshot();
  await nodes.evaluateAll((marks) =>
    marks.forEach((mark) => {
      mark.setAttribute("data-lifetime", mark.getAttribute("data-node") ?? "");
    }),
  );
  for (let repeat = 0; repeat < 3; repeat++) {
    for (const key of ["solar", "wind"]) {
      const node = nodes
        .filter({ has: page.locator("rect") })
        .locator(`xpath=self::*[@data-node='${key}']`);
      await node.dispatchEvent("pointerenter", { pointerType: "mouse" });
      expect(await snapshot()).toEqual(baseline);
      await node.locator("rect").dispatchEvent("mouseenter");
      await node.locator("rect").click({ force: true });
      await page.mouse.move(0, 0);
      await expect(plot.locator(`[data-node-key="${key}"]`)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(
        nodes
          .locator(`xpath=self::*[@data-node='${key === "solar" ? "wind" : "solar"}']`)
          .locator(":scope > g"),
      ).toHaveCSS("opacity", "0.28");
      expect(await snapshot()).toEqual(baseline);
      await plot.locator(`[data-node-key="${key === "solar" ? "wind" : "solar"}"]`).click();
      await page.keyboard.press("Escape");
      expect(await snapshot()).toEqual(baseline);
      await expect(node).toHaveAttribute("data-lifetime", key);
    }
  }
  for (const [source, target, value] of [
    ["solar", "homes", 35],
    ["wind", "homes", 15],
    ["solar", "industry", 25],
    ["wind", "industry", 25],
  ] as const) {
    await links
      .locator(`xpath=self::*[@data-source='${source}' and @data-target='${target}']`)
      .locator("path:not([data-kind-ui])")
      .dispatchEvent("mouseover");
    await expect
      .poll(async () =>
        JSON.parse(
          (await plot.locator("output").getAttribute("data-standalone-payload")) ?? "null",
        ),
      )
      .toEqual({ id: `${source}-${target}`, source, target, value });
    expect(await snapshot()).toEqual(baseline);
  }
});

test("Heatmap repeated and interrupted pointer/focus preserve tuple identity, geometry and raw values", async ({
  page,
}) => {
  await page.goto("/?only=standalone");
  const plot = page.locator("#standalone-heatmap");
  const cells = plot.getByRole("gridcell");
  await expect(cells).toHaveCount(4);
  const snapshot = () =>
    cells.evaluateAll((marks) =>
      marks.map((mark) => {
        const rect = mark.getBoundingClientRect();
        return {
          key: mark.getAttribute("data-cell-key"),
          label: mark.getAttribute("aria-label"),
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
          width: rect.width,
          height: rect.height,
          fill: (mark as HTMLElement).style.backgroundColor,
          opacity: getComputedStyle(mark).opacity,
        };
      }),
    );
  // Press interrupts the entrance before recording settled geometry.
  await cells.first().dispatchEvent("pointerdown", { pointerType: "mouse" });
  const baseline = await snapshot();
  await cells.evaluateAll((marks) =>
    marks.forEach((mark) => {
      mark.setAttribute("data-lifetime", mark.getAttribute("data-cell-key") ?? "");
    }),
  );
  for (let repeat = 0; repeat < 3; repeat++) {
    for (const row of ["A", "B"])
      for (const column of ["X", "Y"]) {
        const key = JSON.stringify([row, column]);
        const cell = cells.locator(`xpath=self::*[@data-cell-key='${key}']`);
        await cell.hover();
        await cell.focus();
        await cell.dispatchEvent("pointerdown", { pointerType: "touch" });
        const value =
          row === "A" ? (column === "X" ? "15" : "80") : column === "X" ? "35" : "Missing";
        await expect(plot.getByRole("tooltip")).toHaveText(`${row}, ${column}: ${value}`);
        await expect(cell).toHaveAttribute("data-lifetime", key);
        expect(await snapshot()).toEqual(baseline);
        await page.keyboard.press("Escape");
      }
  }
});
