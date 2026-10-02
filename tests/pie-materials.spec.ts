import { expect, type Locator, test } from "./browser";

const url = process.env.KIND_UI_PIE_URL ?? "http://127.0.0.1:4180";
const finishes = ["plain", "paper", "clay", "glow"] as const;
const mark = '[data-kind-ui="pie-sector"]';
test("shared showcase pie finish and copied recipe follow independent controls", async ({
  page,
}) => {
  await page.goto("/showcase.html");
  await page.getByRole("tab", { name: "Pie", exact: true }).click();
  const chart = page.locator(".example-card").first().getByRole("application");
  await expect(chart.locator(mark)).not.toHaveCount(0);
  const plain = await geometry(chart);
  await page.getByRole("radio", { name: "Clay", exact: true }).check();
  await expect(
    chart.locator('[data-kind-ui="pie-material"][data-material="clay"]'),
  ).not.toHaveCount(0);
  expect(await geometry(chart)).toEqual(plain);
  await page.getByRole("button", { name: "Green palette" }).click();
  await expect(page.getByRole("radio", { name: "Clay", exact: true })).toBeChecked();
  await page
    .locator(".example-card")
    .first()
    .getByRole("button", { name: "View code", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText('material="clay"');
});
async function geometry(chart: Locator) {
  return chart.locator(".recharts-pie-sector path").evaluateAll((nodes) =>
    nodes.map((n) => ({
      d: n.getAttribute("d"),
      stroke: n.getAttribute("stroke"),
      fill: n.getAttribute("fill"),
      opacity: n.getAttribute("fill-opacity"),
      transform: (() => {
        const m = (n as SVGGraphicsElement).getCTM();
        return m && [m.a, m.b, m.c, m.d, m.e, m.f];
      })(),
    })),
  );
}

test("packed finishes keep native geometry, zero/tiny/single, rings, visibility and explicit customization", async ({
  page,
}) => {
  await page.goto(`${url}/?oracle`);
  const proof = page.getByRole("region", { name: "Continuity proof" });
  const kind = proof.getByRole("application", { name: "Kind continuity", includeHidden: true });
  const native = proof.getByRole("application", { name: "Native oracle", includeHidden: true });
  for (const finish of finishes) {
    await proof.getByLabel("Oracle finish").selectOption(finish);
    for (const mode of ["normal", "zero", "tiny", "single", "empty", "allZero"]) {
      await proof.getByRole("button", { name: `Scenario ${mode}`, exact: true }).click();
      await expect
        .poll(
          async () =>
            JSON.stringify(await geometry(kind)) === JSON.stringify(await geometry(native)),
        )
        .toBeTruthy();
    }
    await proof.getByRole("button", { name: "Scenario normal", exact: true }).click();
    for (const action of [
      "Oracle donut",
      "Oracle rings",
      "Oracle visibility",
      "Oracle visibility",
      "Explicit gaps",
      "Explicit gaps",
      "Oracle rings",
      "Oracle donut",
    ]) {
      await proof.getByRole("button", { name: action, exact: true }).click();
      await expect
        .poll(
          async () =>
            JSON.stringify(await geometry(kind)) === JSON.stringify(await geometry(native)),
        )
        .toBeTruthy();
    }
    const ids = await kind
      .locator('[data-kind-ui="pie-material"] filter')
      .evaluateAll((nodes) => nodes.map((n) => n.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(finish === "plain" ? 0 : 2);
  }
});

test("packed finishes retain decoded native body alpha for translucent gradients and transparent fills", async ({
  page,
}, info) => {
  for (const paint of [
    "opaque",
    "alpha",
    "alpha&gradient",
    "transparent",
    "alpha&transform",
    "alpha&clip",
    "alpha&clip&transform",
  ]) {
    await page.goto(`${url}/?oracle&${paint}`);
    const proof = page.getByRole("region", { name: "Continuity proof" });
    const chart = proof.getByRole("application", { name: "Kind continuity" });
    await proof.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () =>
          JSON.stringify(await geometry(chart)) ===
          JSON.stringify(
            await geometry(
              proof.getByRole("application", { name: "Native oracle", includeHidden: true }),
            ),
          ),
      )
      .toBeTruthy();
    await page.addStyleTag({
      content: 'html,body,section,[data-kind-ui="chart"] {background:transparent !important;}',
    });
    // Isolate one native sector so alpha is measured without adjacent paint or page content.
    await page.addStyleTag({
      content:
        '[data-kind-ui="pie-sector"] {visibility:hidden;} [data-alpha-proof] {visibility:visible !important;}',
    });
    const target = chart.locator(mark).first();
    await target.evaluate((n) => n.setAttribute("data-alpha-proof", ""));
    const baseline = await chart.screenshot({
      omitBackground: true,
      path: info.outputPath(`native-${paint.replaceAll("&", "-")}.png`),
    });
    const captureBox = await chart.boundingBox();
    await proof.getByLabel("Oracle finish").selectOption("plain");
    expect(
      await chart.screenshot({ omitBackground: true }),
      `Repeat native baseline: ${paint}`,
    ).toEqual(baseline);
    for (const finish of finishes.slice(1)) {
      await proof.getByLabel("Oracle finish").selectOption(finish);
      expect(await chart.boundingBox(), `Stable alpha capture: ${paint}/${finish}`).toEqual(
        captureBox,
      );
      await chart
        .locator(mark)
        .first()
        .evaluate((n) => n.setAttribute("data-alpha-proof", ""));
      const actual = await chart.screenshot({
        omitBackground: true,
        path: info.outputPath(`${finish}-${paint.replaceAll("&", "-")}.png`),
      });
      const difference = await page.evaluate(
        async ({ pngs, clippedBounds }) => {
          let imageWidth = 0;
          const arrays = await Promise.all(
            pngs.map(async (png) => {
              const img = new Image();
              img.src = `data:image/png;base64,${png}`;
              await img.decode();
              imageWidth = img.width;
              const c = document.createElement("canvas");
              c.width = img.width;
              c.height = img.height;
              const ctx = c.getContext("2d");
              if (!ctx) throw Error("No pixel context");
              ctx.drawImage(img, 0, 0);
              return ctx.getImageData(0, 0, c.width, c.height).data;
            }),
          );
          const a = arrays[0],
            b = arrays[1];
          if (!a || !b || a.length !== b.length) throw Error("Dimensions");
          let bodyMax = 0,
            exteriorMax = 0,
            painted = 0,
            clippedExteriorMax = 0;
          for (let i = 3; i < a.length; i += 4) {
            if ((a[i] ?? 0) > 0) bodyMax = Math.max(bodyMax, Math.abs((a[i] ?? 0) - (b[i] ?? 0)));
            else exteriorMax = Math.max(exteriorMax, b[i] ?? 0);
            if ((a[i] ?? 0) > 0) painted++;
            const x = ((i - 3) / 4) % imageWidth;
            if (
              clippedBounds &&
              (x < Math.floor(clippedBounds.left) || x >= Math.ceil(clippedBounds.right))
            )
              clippedExteriorMax = Math.max(clippedExteriorMax, b[i] ?? 0);
          }
          return { bodyMax, exteriorMax, painted, clippedExteriorMax };
        },
        {
          pngs: [baseline.toString("base64"), actual.toString("base64")],
          clippedBounds: paint.includes("clip")
            ? paint.includes("css-transform")
              ? { left: 170, right: 200 }
              : paint.includes("transform")
                ? { left: 142, right: 167.5 }
                : { left: 120, right: 150 }
            : null,
        },
      );
      expect(difference.bodyMax, `${paint}/${finish}`).toBeLessThanOrEqual(1);
      expect(difference.clippedExteriorMax).toBe(0);
      expect(difference.exteriorMax).toBeLessThanOrEqual(
        finish === "glow" && paint !== "transparent" ? (paint === "opaque" ? 96 : 40) : 1,
      );
      expect(difference.painted > 0).toBe(paint !== "transparent");
    }
  }
});

test("packed harmless CSS and SVG transform lists still receive every finish", async ({ page }) => {
  for (const customization of ["harmless-css", "transform", "rotate-transform"]) {
    await page.goto(`${url}/?oracle&${customization}`);
    const proof = page.getByRole("region", { name: "Continuity proof" });
    const chart = proof.getByRole("application", { name: "Kind continuity" });
    await proof.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () =>
          JSON.stringify(await geometry(chart)) ===
          JSON.stringify(
            await geometry(
              proof.getByRole("application", { name: "Native oracle", includeHidden: true }),
            ),
          ),
      )
      .toBeTruthy();
    const nativeGeometry = await geometry(chart);
    for (const finish of finishes.slice(1)) {
      await proof.getByLabel("Oracle finish").selectOption(finish);
      await expect(chart.locator('[data-kind-ui="pie-material"]')).toHaveCount(2);
      expect(await geometry(chart)).toEqual(nativeGeometry);
    }
  }
});

test("packed consumer CSS transforms retain native paint ownership, precedence and clipping", async ({
  page,
}) => {
  for (const override of [
    "style-transform",
    "css-transform",
    "css-transform&style-transform",
    "transform&style-transform",
    "transform&css-transform",
    "clip&style-transform",
    "clip&css-transform",
    "individual-translate",
    "individual-rotate",
    "individual-scale",
    "clip&individual-translate",
    "clip&individual-rotate",
    "clip&individual-scale",
    "css-3d",
  ]) {
    await page.goto(`${url}/?oracle&alpha&${override}`);
    const proof = page.getByRole("region", { name: "Continuity proof" });
    const chart = proof.getByRole("application", { name: "Kind continuity" });
    await proof.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () =>
          JSON.stringify(await geometry(chart)) ===
          JSON.stringify(
            await geometry(
              proof.getByRole("application", { name: "Native oracle", includeHidden: true }),
            ),
          ),
      )
      .toBeTruthy();
    await page.addStyleTag({
      content: 'html,body,section,[data-kind-ui="chart"] {background:transparent !important;}',
    });
    const native = await chart.screenshot({ omitBackground: true });
    const captureBox = await chart.boundingBox();
    const nativeGeometry = await geometry(chart);
    for (const finish of finishes.slice(1)) {
      await proof.getByLabel("Oracle finish").selectOption(finish);
      await expect(chart.locator('[data-kind-ui="pie-material"]')).toHaveCount(0);
      expect(await geometry(chart)).toEqual(nativeGeometry);
      expect(await chart.boundingBox(), `Stable capture: ${override}/${finish}`).toEqual(
        captureBox,
      );
      expect(
        await chart.screenshot({ omitBackground: true }),
        `Native ownership: ${override}/${finish}`,
      ).toEqual(native);
    }
  }
});

test("packed controlled style, class, id, geometry and finish refresh native ownership", async ({
  page,
}) => {
  await page.goto(`${url}/?oracle&alpha&ownership-updates&material=clay`);
  const proof = page.getByRole("region", { name: "Continuity proof" });
  const chart = proof.getByRole("application", { name: "Kind continuity" });
  const definitions = chart.locator('[data-kind-ui="pie-material"]');
  const oracle = proof.getByRole("application", { name: "Native oracle", includeHidden: true });
  await expect(definitions).toHaveCount(2);
  await page.addStyleTag({
    content: 'html,body,section,[data-kind-ui="chart"] {background:transparent !important;}',
  });
  const proveNative = async () => {
    await expect(definitions).toHaveCount(0);
    expect(await geometry(chart)).toEqual(await geometry(oracle));
    await proof.getByLabel("Oracle finish").selectOption("plain");
    const native = await chart.screenshot({ omitBackground: true });
    await proof.getByLabel("Oracle finish").selectOption("clay");
    await expect(definitions).toHaveCount(0);
    expect(await chart.screenshot({ omitBackground: true })).toEqual(native);
  };
  for (const prop of ["style", "class", "id"]) {
    await proof.getByRole("button", { name: `Ownership ${prop}`, exact: true }).click();
    await proveNative();
    await proof.getByRole("button", { name: "Ownership none", exact: true }).click();
    await expect(definitions).toHaveCount(2);
  }
  for (const prop of ["geometry", "finish"]) {
    const ambient = await page.addStyleTag({
      content: ".host-lifecycle {transform: translateX(40px);}",
    });
    if (prop === "geometry")
      await proof.getByRole("button", { name: "Ownership geometry", exact: true }).click();
    else await proof.getByLabel("Oracle finish").selectOption("paper");
    await proveNative();
    await ambient.evaluate((node) => node.parentNode?.removeChild(node));
    if (prop === "geometry")
      await proof.getByRole("button", { name: "Ownership geometry", exact: true }).click();
    else await proof.getByLabel("Oracle finish").selectOption("paper");
    await expect(definitions).toHaveCount(2);
  }
});

for (const owner of ["filter", "style-filter"])
  test(`packed Cell ${owner} retains ownership`, async ({ page }) => {
    await page.goto(`${url}/?oracle&material=clay&${owner}`);
    const chart = page.getByRole("application", { name: "Kind continuity" });
    await expect(chart.locator(mark)).toHaveCount(2);
    await expect(chart.locator('[data-kind-ui="pie-material"]')).toHaveCount(0);
    for (const node of await chart.locator(mark).all())
      expect(
        await node.evaluate((n) => n.getAttribute("filter") ?? (n as SVGElement).style.filter),
      ).toContain("host-filter");
  });

test("packed stylesheet filter retains consumer ownership", async ({ page }) => {
  await page.goto(`${url}/?oracle&material=clay&css-filter`);
  const chart = page.getByRole("application", { name: "Kind continuity" });
  await expect(chart.locator(mark)).toHaveCount(2);
  await expect(chart.locator('[data-kind-ui="pie-material"]')).toHaveCount(0);
  expect(
    await chart
      .locator(mark)
      .first()
      .evaluate((node) => getComputedStyle(node).filter),
  ).toBe("grayscale(1)");
});

test("packed custom shape ownership and repeated interrupted/reduced motion across finishes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?material=clay`);
  const chart = page.getByRole("application", { name: "Packed pie chart" });
  const final = await geometry(chart);
  for (const finish of finishes.slice(1)) {
    await page.goto(`${url}/?material=${finish}`);
    await page.getByLabel("Finish", { exact: true }).selectOption(finish);
    await page.getByRole("button", { name: "Animate", exact: true }).click();
    await expect(chart.locator(`${mark}[data-reveal="on"]`)).not.toHaveCount(0);
    await page.getByLabel("Finish", { exact: true }).selectOption("plain");
    await expect(chart.locator(`${mark}[data-reveal="on"]`)).toHaveCount(0);
    await expect
      .poll(async () => JSON.stringify(await geometry(chart)) === JSON.stringify(final))
      .toBeTruthy();
    await page.getByRole("button", { name: "Animate", exact: true }).click();
    await page.getByLabel("Finish", { exact: true }).selectOption(finish);
    await page.getByRole("button", { name: "Animate", exact: true }).click();
    await expect(chart.locator(`${mark}[data-reveal="on"]`)).toHaveCount(0);
    expect(await geometry(chart)).toEqual(final);
  }
  await page.goto(`${url}/?material=clay`);
  await page.getByLabel("Finish", { exact: true }).selectOption("clay");
  await page.getByRole("button", { name: "Custom shape", exact: true }).click();
  await expect(chart.locator("[data-host-shape]")).toHaveCount(2);
  await expect(chart.locator('[data-kind-ui="pie-material"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Custom shape", exact: true }).click();
  await page.getByRole("button", { name: "Animate", exact: true }).click();
  await expect(chart.locator(`${mark}[data-reveal="on"]`)).not.toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(chart.locator(`${mark}[data-reveal="on"]`)).toHaveCount(0);
  await expect
    .poll(async () => JSON.stringify(await geometry(chart)) === JSON.stringify(final))
    .toBeTruthy();
});

test("actual recipes expose independent materials and preserve selection/totals on narrow screens", async ({
  page,
}, info) => {
  await page.goto("/pies.html");
  const charts = page.getByRole("application");
  const first = await geometry(charts.first()),
    second = await geometry(charts.nth(1));
  for (const finish of finishes) {
    await page.getByLabel("Material", { exact: true }).first().selectOption(finish);
    await expect
      .poll(async () => JSON.stringify(await geometry(charts.first())) === JSON.stringify(first))
      .toBeTruthy();
    await expect
      .poll(async () => JSON.stringify(await geometry(charts.nth(1))) === JSON.stringify(second))
      .toBeTruthy();
  }
  await page.getByLabel("Material", { exact: true }).first().selectOption("clay");
  await page.getByLabel("Material", { exact: true }).nth(1).selectOption("paper");
  const slice = charts.first().locator(mark).first();
  await slice.scrollIntoViewIfNeeded();
  let interior: { x: number; y: number } | undefined;
  await expect
    .poll(async () => {
      interior = await slice.evaluate((node) => {
        if (!(node instanceof SVGGeometryElement)) throw Error("Expected native SVG geometry");
        const box = node.getBBox();
        const matrix = node.getScreenCTM();
        if (!matrix) return undefined;
        for (const x of [0.5, 0.25, 0.75])
          for (const y of [0.5, 0.25, 0.75]) {
            const point = new DOMPoint(box.x + box.width * x, box.y + box.height * y);
            if (!node.isPointInFill(point)) continue;
            const screen = point.matrixTransform(matrix);
            if (document.elementFromPoint(screen.x, screen.y) === node)
              return { x: screen.x, y: screen.y };
          }
        return undefined;
      });
      return interior !== undefined;
    })
    .toBeTruthy();
  if (!interior) throw Error("No hittable native slice interior");
  await page.mouse.click(interior.x, interior.y);
  await expect(page.locator("article").first().locator("p[role=status]")).toContainText(
    "Selected:",
  );
  await page.screenshot({
    path: info.outputPath("pie-material-recipes-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBeTruthy();
  await page.screenshot({
    path: info.outputPath("pie-material-recipes-phone.png"),
    fullPage: true,
  });
});

test("material filter includes explicit native thick stroke and meaningful visual finishes", async ({
  page,
}, info) => {
  await page.goto(`${url}/?oracle&thick`);
  const proof = page.getByRole("region", { name: "Continuity proof" });
  const chart = proof.getByRole("application", { name: "Kind continuity" });
  await proof.getByRole("button", { name: "Scenario single", exact: true }).click();
  const native = await geometry(chart);
  for (const finish of finishes.slice(1)) {
    await proof.getByLabel("Oracle finish").selectOption(finish);
    await expect
      .poll(async () => JSON.stringify(await geometry(chart)) === JSON.stringify(native))
      .toBeTruthy();
    const bounds = await chart
      .locator('[data-kind-ui="pie-material"] filter')
      .first()
      .evaluate((n) => ({
        x: Number(n.getAttribute("x")),
        width: Number(n.getAttribute("width")),
      }));
    // cx150, outerRadius110, explicit stroke reaches x10..290; halo gets another16px.
    expect(bounds.x).toBeLessThanOrEqual(10);
    expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(290);
  }
  await page.goto(`${url}/?oracle&css-stroke&material=clay`);
  const styledChart = page.getByRole("application", { name: "Kind continuity" });
  await expect
    .poll(async () =>
      styledChart
        .locator('[data-kind-ui="pie-material"] filter')
        .first()
        .evaluate((n) => Number(n.getAttribute("x"))),
    )
    .toBeLessThanOrEqual(10);
  await page.goto(`${url}/?gallery`);
  const plain = await page
    .getByRole("application", { name: "plain pink pie 300", exact: true })
    .screenshot();
  for (const finish of finishes.slice(1)) {
    const bytes = await page
      .getByRole("application", { name: `${finish} pink pie 300`, exact: true })
      .screenshot({ path: info.outputPath(`${finish}-visual.png`) });
    const changed = await page.evaluate(
      async (pngs) => {
        const pixels = await Promise.all(
          pngs.map(async (png) => {
            const img = new Image();
            img.src = `data:image/png;base64,${png}`;
            await img.decode();
            const c = document.createElement("canvas");
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext("2d");
            if (!ctx) throw Error("Missing context");
            ctx.drawImage(img, 0, 0);
            return ctx.getImageData(0, 0, c.width, c.height).data;
          }),
        );
        const a = pixels[0],
          b = pixels[1];
        if (!a || !b) throw Error("No pixels");
        let changed = 0;
        for (let i = 0; i < a.length; i += 4)
          if (Math.max(...[0, 1, 2].map((c) => Math.abs((a[i + c] ?? 0) - (b[i + c] ?? 0)))) > 8)
            changed++;
        return changed;
      },
      [plain.toString("base64"), bytes.toString("base64")],
    );
    expect(changed).toBeGreaterThan(500);
  }
  await page.screenshot({
    path: info.outputPath("pie-material-final-gallery.png"),
    fullPage: true,
  });
});
