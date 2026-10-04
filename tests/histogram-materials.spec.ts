import { expect, test } from "@playwright/test";

const packed = `http://127.0.0.1:${4192 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
const marks = '[data-kind-ui="histogram-bin"]';
const finishes = ["plain", "paper", "clay", "glow"] as const;

test("packed histogram finishes retain quantitative geometry, Cells, overrides and repeated interaction", async ({
  page,
}) => {
  await page.goto(packed);
  const bins = page.locator(marks);
  await expect(bins).toHaveCount(4);
  const snapshot = () =>
    bins.evaluateAll((nodes) =>
      nodes
        .map((node) =>
          [
            "x",
            "y",
            "width",
            "height",
            "d",
            "fill",
            "fill-opacity",
            "stroke",
            "stroke-dasharray",
            "data-count",
          ].map((key) => node.getAttribute(key)),
        )
        .sort((a, b) => Number(a[0]) - Number(b[0])),
    );
  const plain = await snapshot();
  for (const material of finishes) {
    await page.getByRole("button", { name: material, exact: true }).click();
    expect((await snapshot()).sort()).toEqual([...plain].sort());
    await expect(page.locator('svg[data-host-ref="yes"]')).toHaveCount(1);
    const chart = page.getByRole("application", { name: "Histogram proof" });
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("per ms");
    await page.getByRole("button", { name: "Measure", exact: true }).click();
    const countGeometry = await snapshot();
    expect(countGeometry.map((bin) => bin[2])).toEqual(plain.map((bin) => bin[2]));
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    const resized = await snapshot();
    expect(Number(resized[2]?.[2]) / Number(resized[1]?.[2])).toBeCloseTo(3, 3);
    expect(Number(resized[2]?.[3]) / Number(resized[1]?.[3])).toBeCloseTo(3, 3);
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    await page.getByRole("button", { name: "Measure", exact: true }).click();
    expect((await snapshot()).sort()).toEqual([...plain].sort());
    await expect(page.locator("feDisplacementMap")).toHaveCount(0);
    await expect(page.locator('[data-kind-ui="histogram-material"]')).toHaveCount(
      material === "plain" ? 0 : 4,
    );
    if (material !== "plain")
      await expect(bins.first()).toHaveAttribute("filter", /kind-ui-histogram/);
    for (let i = 0; i < 3; i++) {
      await page.locator(`${marks}[data-lower="0"]`).click();
      await expect(page.getByRole("status", { name: "Clicked" })).toHaveText(
        String(finishes.indexOf(material) * 3 + i + 1),
      );
      await page.getByRole("button", { name: "Density", exact: true }).click();
      await expect(bins).toHaveCount(0);
      await page.getByRole("button", { name: "Density", exact: true }).click();
      await expect(bins).toHaveCount(4);
    }
  }
  for (const override of ["cell-filter", "cell-style", "series-filter", "series-style"]) {
    await page.getByRole("button", { name: override, exact: true }).click();
    if (override.endsWith("style"))
      await expect(page.locator(`${marks}[data-lower="0"]`)).toHaveCSS(
        "filter",
        /histogram-host-filter/,
      );
    else
      await expect(page.locator(`${marks}[data-lower="0"]`)).toHaveAttribute(
        "filter",
        "url(#histogram-host-filter)",
      );
    if (override.startsWith("series"))
      await expect(page.locator('[data-kind-ui="histogram-material"]')).toHaveCount(0);
  }
  await page.getByRole("button", { name: "none", exact: true }).click();
  await page.getByRole("button", { name: "Custom shape", exact: true }).click();
  await expect(page.locator('[data-kind-ui="histogram-material"]')).toHaveCount(0);
  await expect(page.locator("[data-host-shape]")).toHaveCount(4);
  await expect(page.locator("[data-host-shape]").first()).not.toHaveAttribute(
    "filter",
    /kind-ui-histogram/,
  );
});

for (const [lower, strokeMode] of [
  [-2, "normal"],
  [0, "normal"],
  [0, "wide-stroke"],
  [0, "em"],
  [0, "var"],
  [0, "css"],
  [0, "percent"],
] as const) {
  test(`Paper Clay and Glow retain Cell ${lower} stroke ${strokeMode} solid and gradient body alpha`, async ({
    page,
  }, info) => {
    await page.goto(
      strokeMode === "wide-stroke" ? `${packed}/?wide-stroke` : `${packed}/?stroke=${strokeMode}`,
    );
    await page.addStyleTag({
      content: `html, body, section { background: transparent !important; } svg text, .recharts-cartesian-grid, .recharts-reference-line, .recharts-cartesian-axis, .recharts-tooltip-cursor, ${marks} { visibility: hidden; } ${marks}[data-lower="${lower}"] { visibility: visible; }`,
    });
    const bin = page.locator(`${marks}[data-lower="${lower}"]`);
    async function comparePixels(
      plain: Buffer,
      finished: Buffer,
      bounds: { x: number; y: number; width: number; height: number },
      pixelWidth: number,
    ) {
      return page.evaluate(
        async ({ before, after, bounds, pixelWidth }) => {
          async function pixels(src: string) {
            const img = new Image();
            img.src = src;
            await img.decode();
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("No canvas");
            ctx.drawImage(img, 0, 0);
            return ctx.getImageData(0, 0, img.width, img.height).data;
          }
          const [plain, finished] = await Promise.all([pixels(before), pixels(after)]);
          let delta = 0,
            rgb = 0,
            samples = 0;
          for (let i = 0; i < plain.length; i += 4) {
            const pixel = i / 4;
            const px = pixel % pixelWidth;
            const py = Math.floor(pixel / pixelWidth);
            const interior =
              px > bounds.x + 3 &&
              px < bounds.x + bounds.width - 3 &&
              py > bounds.y + 3 &&
              py < bounds.y + bounds.height - 3;
            if ((plain[i + 3] ?? 0) > 0 || interior)
              delta = Math.max(delta, Math.abs((plain[i + 3] ?? 0) - (finished[i + 3] ?? 0)));
            if ((plain[i + 3] ?? 0) > 40) {
              rgb +=
                Math.abs((plain[i] ?? 0) - (finished[i] ?? 0)) +
                Math.abs((plain[i + 1] ?? 0) - (finished[i + 1] ?? 0)) +
                Math.abs((plain[i + 2] ?? 0) - (finished[i + 2] ?? 0));
              samples += 3;
            }
          }
          return {
            plainLength: plain.length,
            finishedLength: finished.length,
            delta,
            rgb,
            samples,
          };
        },
        {
          before: `data:image/png;base64,${plain.toString("base64")}`,
          after: `data:image/png;base64,${finished.toString("base64")}`,
          bounds,
          pixelWidth,
        },
      );
    }
    for (const gradient of [false, true]) {
      if (gradient) await page.getByRole("button", { name: "Gradient", exact: true }).click();
      await page.getByRole("button", { name: "plain", exact: true }).click();
      const bounds = await bin.evaluate((node) => ({
        x: Number(node.getAttribute("x")),
        y: Number(node.getAttribute("y")),
        width: Number(node.getAttribute("width")),
        height: Number(node.getAttribute("height")),
      }));
      const chart = page.getByRole("application", { name: "Histogram proof" });
      const chartBounds = await chart.boundingBox();
      if (!chartBounds) throw new Error("No chart bounds");
      const pixelWidth = Math.ceil(chartBounds.x + chartBounds.width) - Math.floor(chartBounds.x);
      const plain = await chart.screenshot({ omitBackground: true });
      for (const material of ["paper", "clay", "glow"] as const) {
        await page.getByRole("button", { name: material, exact: true }).click();
        const finished = await chart.screenshot({
          omitBackground: true,
          path: info.outputPath(`${material}-${gradient ? "gradient" : "solid"}.png`),
        });
        const { plainLength, finishedLength, delta, rgb, samples } = await comparePixels(
          plain,
          finished,
          bounds,
          pixelWidth,
        );
        expect(finishedLength).toBe(plainLength);
        expect(delta).toBeLessThanOrEqual(1);
        expect(rgb / samples).toBeGreaterThan(0.5);
      }
    }
  });
}

test("fully transparent Cells produce no material-created paint", async ({ page }) => {
  await page.goto(`${packed}/?transparent`);
  await page.addStyleTag({
    content: `html, body, section { background: transparent !important; } svg text, .recharts-cartesian-grid, .recharts-reference-line, .recharts-cartesian-axis, .recharts-tooltip-cursor, ${marks} { visibility: hidden; } ${marks}[data-lower="0"] { visibility: visible; }`,
  });
  for (const material of finishes) {
    await page.getByRole("button", { name: material, exact: true }).click();
    const bytes = await page
      .locator(`${marks}[data-lower="0"]`)
      .screenshot({ omitBackground: true });
    const alpha = await page.evaluate(
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
        return Array.from(ctx.getImageData(0, 0, img.width, img.height).data).filter(
          (_, i) => i % 4 === 3,
        );
      },
      `data:image/png;base64,${bytes.toString("base64")}`,
    );
    expect(alpha.every((value) => value === 0)).toBe(true);
  }
});

test("all finishes preserve empty and zero inputs, Motion interruption and reduced motion", async ({
  page,
}) => {
  for (const material of finishes) {
    for (const mode of ["empty", "zero"]) {
      await page.goto(`${packed}/?data=${mode}`);
      await page.getByRole("button", { name: material, exact: true }).click();
      await expect(page.locator(marks)).toHaveCount(0);
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(packed);
    await page.getByRole("button", { name: material, exact: true }).click();
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(1);
    await page.getByRole("button", { name: "Update", exact: true }).click();
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.getByRole("button", { name: material, exact: true }).click();
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
    await expect(page.locator(marks)).toHaveCount(4);
  }
});

test("four real finishes retain unequal density rectangles on desktop and phone", async ({
  page,
}, info) => {
  for (const [label, width, height] of [
    ["desktop", 1280, 1100],
    ["phone", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/histograms.html?materials");
    await expect(page.locator(marks)).toHaveCount(12);
    const filters = page.locator('[data-kind-ui="histogram-material"] filter');
    await expect(filters).toHaveCount(9);
    const ids = await filters.evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(9);
    const geometry = await page
      .locator("article")
      .evaluateAll((nodes) =>
        nodes.map((article) =>
          Array.from(article.querySelectorAll('[data-kind-ui="histogram-bin"]')).map((node) => [
            node.getAttribute("x"),
            node.getAttribute("y"),
            node.getAttribute("width"),
            node.getAttribute("height"),
          ]),
        ),
      );
    for (const bins of geometry) expect(bins).toEqual(geometry[0]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    for (const [palette, color, rgb] of [
      ["Teal", "#167d77", "rgb(22, 125, 119)"],
      ["Pink", "#ed79ae", "rgb(237, 121, 174)"],
      ["Monochrome", "#888888", "rgb(136, 136, 136)"],
    ] as const) {
      await page.locator('[data-kind-ui="chart"]').evaluateAll((nodes, color) => {
        for (const node of nodes)
          if (node instanceof HTMLElement) node.style.setProperty("--color-count", color);
      }, color);
      for (const bin of await page.locator(marks).all()) await expect(bin).toHaveCSS("fill", rgb);
      const recolored = await page
        .locator("article")
        .evaluateAll((nodes) =>
          nodes.map((article) =>
            Array.from(article.querySelectorAll('[data-kind-ui="histogram-bin"]')).map((node) => [
              node.getAttribute("x"),
              node.getAttribute("y"),
              node.getAttribute("width"),
              node.getAttribute("height"),
            ]),
          ),
        );
      expect(recolored).toEqual(geometry);
      await page.screenshot({
        path: info.outputPath(
          palette === "Teal"
            ? `histogram-materials-${label}.png`
            : `histogram-materials-${palette}-${label}.png`,
        ),
        fullPage: true,
      });
    }
  }
});
