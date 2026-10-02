import { expect, test } from "@playwright/test";

const packed = "http://127.0.0.1:4185";
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
      nodes.map((node) =>
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
      ),
    );
  const plain = await snapshot();
  for (const material of finishes) {
    await page.getByRole("button", { name: material, exact: true }).click();
    expect(await snapshot()).toEqual(plain);
    await expect(page.locator("feDisplacementMap")).toHaveCount(0);
    await expect(page.locator('[data-kind-ui="histogram-material"]')).toHaveCount(
      material === "plain" ? 0 : 1,
    );
    if (material !== "plain")
      await expect(bins.first()).toHaveAttribute("filter", /kind-ui-histogram/);
    for (let i = 0; i < 3; i++) {
      await bins.nth(1).click();
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
      await expect(bins.nth(1)).toHaveCSS("filter", /histogram-host-filter/);
    else await expect(bins.nth(1)).toHaveAttribute("filter", "url(#histogram-host-filter)");
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

test("Paper Clay and Glow retain translucent solid and gradient body alpha", async ({
  page,
}, info) => {
  await page.goto(packed);
  await page.addStyleTag({
    content: `html, body, section { background: transparent !important; } svg * { visibility: hidden; } ${marks}[data-lower="-2"] { visibility: visible; }`,
  });
  const bin = page.locator(`${marks}[data-lower="-2"]`);
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
    const plain = await pixels(await bin.screenshot({ omitBackground: true }));
    for (const material of ["paper", "clay", "glow"] as const) {
      await page.getByRole("button", { name: material, exact: true }).click();
      const finished = await pixels(
        await bin.screenshot({
          omitBackground: true,
          path: info.outputPath(`${material}-${gradient ? "gradient" : "solid"}.png`),
        }),
      );
      expect(finished.length).toBe(plain.length);
      let delta = 0,
        rgb = 0,
        samples = 0;
      for (let i = 0; i < plain.length; i += 4) {
        if ((plain[i + 3] ?? 0) > 0)
          delta = Math.max(delta, Math.abs((plain[i + 3] ?? 0) - (finished[i + 3] ?? 0)));
        if ((plain[i + 3] ?? 0) > 40) {
          rgb +=
            Math.abs((plain[i] ?? 0) - (finished[i] ?? 0)) +
            Math.abs((plain[i + 1] ?? 0) - (finished[i + 1] ?? 0)) +
            Math.abs((plain[i + 2] ?? 0) - (finished[i + 2] ?? 0));
          samples += 3;
        }
      }
      expect(delta).toBeLessThanOrEqual(1);
      expect(rgb / samples).toBeGreaterThan(0.5);
    }
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
    await expect(filters).toHaveCount(3);
    const ids = await filters.evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(3);
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
    await page.screenshot({
      path: info.outputPath(`histogram-materials-${label}.png`),
      fullPage: true,
    });
  }
});
