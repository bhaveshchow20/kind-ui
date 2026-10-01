import { expect, test } from "@playwright/test";

const url = "http://127.0.0.1:4183/?materials";
const marks = ".recharts-bar-rectangle path";
for (const horizontal of [false, true]) {
  test(`packed bar finishes preserve ${horizontal ? "horizontal" : "vertical"} cells, signed geometry and native overrides`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}${horizontal ? "&horizontal" : ""}`);
    await page.getByRole("button", { name: "Background", exact: true }).click();
    const backgrounds = await page
      .locator(".recharts-bar-background-rectangle")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    const paths = page.locator(marks);
    await expect(paths).toHaveCount(6);
    const plainImage = await page.getByRole("application").screenshot();
    const geometry = await paths.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("d")),
    );
    expect(geometry.length).toBeGreaterThan(2);
    const labels = await page.locator(".recharts-label-list text").allTextContents();
    const paint = await paths.evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).fill),
    );
    for (const material of ["paper", "clay", "glow"]) {
      await page.getByRole("button", { name: material, exact: true }).click();
      expect(
        await paths.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
      ).toEqual(geometry);
      expect(
        await paths.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill)),
      ).toEqual(paint);
      expect(await page.locator(".recharts-label-list text").allTextContents()).toEqual(labels);
      expect(
        await page
          .locator(".recharts-bar-background-rectangle")
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
      ).toEqual(backgrounds);
      expect((await page.getByRole("application").screenshot()).equals(plainImage)).toBe(false);
      const filters = page.locator('[data-kind-ui="bar-material"] filter');
      await expect(filters).toHaveCount(2);
      await expect(filters.first()).toHaveAttribute("filterUnits", "objectBoundingBox");
      const ids = await filters.evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      expect(
        await filters.evaluateAll((nodes) =>
          nodes.every((node) =>
            ["x", "y", "width", "height"].every((key) =>
              Number.isFinite(Number(node.getAttribute(key))),
            ),
          ),
        ),
      ).toBe(true);
      await page.getByRole("button", { name: "Pink", exact: true }).click();
      await page.screenshot({
        path: info.outputPath(`${material}-pink-${horizontal ? "horizontal" : "vertical"}.png`),
      });
      await page.getByRole("button", { name: "Pink", exact: true }).click();
    }
    await paths.first().click();
    await expect(page.getByRole("note", { name: "Events" })).toContainText("1/");
    await paths.first().hover();
    await expect(page.getByRole("status")).toBeVisible();
    await page.getByRole("button", { name: "Cell filter", exact: true }).click();
    await expect(page.locator('[data-kind-ui="bar-material"] filter')).toHaveCount(2);
    await expect(paths.nth(1)).toHaveAttribute("filter", "url(#bar-host-filter)");
    await page.getByRole("button", { name: "Cell filter", exact: true }).click();
    await page.getByRole("button", { name: "Gradient", exact: true }).click();
    await expect(paths.first()).toHaveAttribute("fill", "url(#bar-proof-gradient)");
    await page.getByRole("button", { name: "Custom active", exact: true }).click();
    await expect(page.locator('[data-kind-ui="bar-material"] filter')).toHaveCount(1);
    await paths.first().hover();
    await expect(page.locator("[data-host-shape]").first()).not.toHaveAttribute(
      "filter",
      /kind-ui-bar/,
    );
    await page.getByRole("button", { name: "Custom active", exact: true }).click();
    await page.getByRole("button", { name: "Native shape", exact: true }).click();
    await expect(page.locator("[data-host-shape]")).toHaveCount(2);
    await expect(page.locator('[data-kind-ui="bar-material"] filter')).toHaveCount(1);
    await page.getByRole("button", { name: "Native shape", exact: true }).click();
    await page.getByRole("button", { name: "Native filter", exact: true }).click();
    await expect(page.locator('[data-kind-ui="bar-material"] filter')).toHaveCount(1);
    await expect(page.locator("feDisplacementMap, filter animate")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("packed material controls remain independent through stacking, animation, narrow layout and repeated interaction", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  await page.getByRole("button", { name: "clay", exact: true }).click();
  await page.getByRole("button", { name: "Pink", exact: true }).click();
  await page.getByRole("button", { name: "Animate", exact: true }).click();
  const chart = page.getByRole("application");
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Stack", exact: true }).click();
    await page.getByRole("button", { name: "Orientation", exact: true }).click();
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    await page.getByRole("button", { name: "Other", exact: true }).click();
    await page.getByRole("button", { name: "Other", exact: true }).click();
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toBeVisible();
    await expect(
      page.locator('[data-kind-ui="bar-material"][data-material="clay"]'),
    ).not.toHaveCount(0);
  }
  await page.screenshot({ path: info.outputPath("clay-pink-narrow-repeated.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await page.getByRole("button", { name: "plain", exact: true }).click();
  await expect(page.locator('[data-kind-ui="bar-material"]')).toHaveCount(0);
});

test("existing bar recipes expose independent finish and palette controls", async ({
  page,
}, info) => {
  await page.goto("/bars.html");
  await page.getByRole("button", { name: "Clay", exact: true }).click();
  await expect(page.locator('[data-kind-ui="bar-material"]').first()).toHaveAttribute(
    "data-material",
    "clay",
  );
  await page.getByRole("button", { name: "Color", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("data-material", "clay");
  await expect(
    page.locator(".recharts-responsive-container").first().locator(".recharts-bar-rectangle path"),
  ).toHaveCount(3);
  await page.screenshot({ path: info.outputPath("recipes-clay-color-normal.png"), fullPage: true });
  await page.getByRole("checkbox", { name: "Motion", exact: true }).check();
  await page.setViewportSize({ width: 360, height: 800 });
  await expect
    .poll(() =>
      page
        .locator(".recharts-responsive-container")
        .first()
        .evaluate((node) => {
          const svg = node.querySelector("svg.recharts-surface");
          return (
            Math.abs(Number(svg?.getAttribute("width")) - node.getBoundingClientRect().width) < 1 &&
            node.querySelectorAll(".recharts-bar-rectangle path").length === 3
          );
        }),
    )
    .toBe(true);
  await page.screenshot({ path: info.outputPath("recipes-clay-color-narrow.png"), fullPage: true });
});

test("raised Clay and sketch Paper preserve native translucent alpha and explicit radii", async ({
  page,
}, info) => {
  await page.goto(`${url}&translucent&round`);
  await page.locator("section").evaluate((node) => {
    node.style.background = "transparent";
  });
  await page.addStyleTag({
    content:
      "html, body { background: transparent !important; } .recharts-cartesian-grid, .recharts-reference-line { visibility: hidden; }",
  });
  const mark = page.locator(marks).first();
  await expect(mark).toBeVisible();
  async function pixels(bytes: Buffer) {
    return page.evaluate(
      async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas");
        ctx.drawImage(img, 0, 0);
        return Array.from(ctx.getImageData(0, 0, img.width, img.height).data);
      },
      `data:image/png;base64,${bytes.toString("base64")}`,
    );
  }
  for (const gradient of [false, true]) {
    if (gradient) await page.getByRole("button", { name: "Gradient", exact: true }).click();
    await page.getByRole("button", { name: "plain", exact: true }).click();
    const path = await mark.getAttribute("d");
    const plain = await pixels(await mark.screenshot({ omitBackground: true }));
    for (const material of ["paper", "clay"]) {
      await page.getByRole("button", { name: material, exact: true }).click();
      await expect(mark).toHaveAttribute("d", path ?? "");
      const finished = await pixels(
        await mark.screenshot({
          omitBackground: true,
          path: info.outputPath(`${material}-translucent-${gradient ? "gradient" : "solid"}.png`),
        }),
      );
      expect(finished.length).toBe(plain.length);
      let maxAlpha = 0,
        rgb = 0,
        samples = 0;
      for (let i = 0; i < plain.length; i += 4) {
        maxAlpha = Math.max(maxAlpha, Math.abs((plain[i + 3] ?? 0) - (finished[i + 3] ?? 0)));
        if ((plain[i + 3] ?? 0) > 40) {
          rgb +=
            Math.abs((plain[i] ?? 0) - (finished[i] ?? 0)) +
            Math.abs((plain[i + 1] ?? 0) - (finished[i + 1] ?? 0)) +
            Math.abs((plain[i + 2] ?? 0) - (finished[i + 2] ?? 0));
          samples += 3;
        }
      }
      expect(maxAlpha).toBeLessThanOrEqual(1);
      expect(rgb / samples).toBeGreaterThan(material === "clay" ? 10 : 2);
    }
  }
});

for (const material of ["clay", "paper"] as const) {
  test(`${material} recipes retain truthful caps and joins across palettes and widths`, async ({
    page,
  }, info) => {
    await page.goto("/bars.html");
    await page
      .getByRole("button", { name: material === "clay" ? "Clay" : "Paper", exact: true })
      .click();
    for (const palette of ["Monochrome", "Color"]) {
      await page.getByRole("button", { name: palette, exact: true }).click();
      for (const width of [1000, 360]) {
        await page.setViewportSize({ width, height: 900 });
        const first = page.locator(".recharts-responsive-container").first();
        await expect
          .poll(() =>
            first.evaluate((node) => {
              const svg = node.querySelector("svg.recharts-surface");
              return (
                Math.abs(Number(svg?.getAttribute("width")) - node.getBoundingClientRect().width) <
                  1 && node.querySelectorAll(".recharts-bar-rectangle path").length === 3
              );
            }),
          )
          .toBe(true);
        await page.screenshot({
          path: info.outputPath(`${material}-${palette}-${width}.png`),
          fullPage: true,
        });
        if (material === "clay") {
          // Native BarStack rounds its outside envelope, leaving both segment paths square.
          const stack = page
            .locator("section")
            .filter({ has: page.getByRole("heading", { name: "Stacked", exact: true }) });
          await expect(stack.locator(".recharts-bar-stack-layer")).not.toHaveCount(0);
          const paths = await stack
            .locator(marks)
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d") ?? ""));
          expect(paths.every((path) => !path.includes("A"))).toBe(true);
          await expect(stack.locator("clipPath path").first()).toHaveAttribute("d", /A/);
        }
      }
    }
  });
}

for (const material of ["clay", "paper"] as const) {
  test(`${material} soft pink standalone bars remain bounded in signed orientations`, async ({
    page,
  }, info) => {
    for (const horizontal of [false, true]) {
      await page.goto(`${url}&round${horizontal ? "&horizontal" : ""}`);
      await page.getByRole("button", { name: "Pink", exact: true }).click();
      await page.getByRole("button", { name: material, exact: true }).click();
      const chart = page.getByRole("application");
      for (const narrow of [false, true]) {
        if (narrow) await page.getByRole("button", { name: "Resize", exact: true }).click();
        await expect(page.locator(marks)).toHaveCount(6);
        await expect
          .poll(async () => (await chart.getAttribute("width")) === (narrow ? "180" : "480"))
          .toBe(true);
        await chart.screenshot({
          path: info.outputPath(
            `${material}-pink-${horizontal ? "horizontal" : "vertical"}-${narrow ? "narrow" : "normal"}.png`,
          ),
        });
      }
    }
  });
}

test("two native Clay stack envelopes have independent IDs and truthful outer caps", async ({
  page,
}) => {
  await page.goto(`${url}&envelopes`);
  const clips = page.locator('[data-proof-stack] clipPath[id^="recharts-bar-stack-clip-path"]');
  await expect(clips).toHaveCount(4);
  const ids = await clips.evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(4);
  const sizes = await clips
    .locator("path")
    .evaluateAll((nodes) => nodes.map((node) => (node as SVGGraphicsElement).getBBox().width));
  expect(sizes[0]).toBeGreaterThan(sizes[2] ?? 0);
  for (const chart of ["Native stack 260", "Native stack 140"]) {
    const root = page.getByRole("application", { name: chart });
    await expect(root.locator(marks)).toHaveCount(3);
    const geometry = await root
      .locator(marks)
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d") ?? ""));
    expect(geometry.every((path) => !path.includes("A"))).toBe(true);
  }
});
