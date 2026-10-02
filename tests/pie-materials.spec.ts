import { expect, type Locator, test } from "@playwright/test";

const url = "http://127.0.0.1:4180";
const finishes = ["plain", "paper", "clay", "glow"] as const;
const mark = '[data-kind-ui="pie-sector"]';
async function geometry(chart: Locator) {
  return chart.locator(".recharts-pie-sector path").evaluateAll((nodes) =>
    nodes.map((n) => ({
      d: n.getAttribute("d"),
      stroke: n.getAttribute("stroke"),
      fill: n.getAttribute("fill"),
      opacity: n.getAttribute("fill-opacity"),
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

test("packed inset finishes retain decoded native alpha for translucent gradients and transparent fills", async ({
  page,
}, info) => {
  for (const paint of ["alpha", "alpha&gradient", "transparent"]) {
    await page.goto(`${url}/?oracle&${paint}`);
    const proof = page.getByRole("region", { name: "Continuity proof" });
    const chart = proof.getByRole("application", { name: "Kind continuity" });
    await page.addStyleTag({
      content: 'html,body,section,[data-kind-ui="root"] {background:transparent !important;}',
    });
    // Isolate one native sector so alpha is measured without adjacent paint or page content.
    await page.addStyleTag({
      content:
        ".recharts-wrapper * {visibility:hidden;} [data-alpha-proof] {visibility:visible !important;}",
    });
    const target = chart.locator(mark).first();
    await target.evaluate((n) => n.setAttribute("data-alpha-proof", ""));
    const baseline = await chart.screenshot({ omitBackground: true });
    for (const finish of finishes.slice(1)) {
      await proof.getByLabel("Oracle finish").selectOption(finish);
      await chart
        .locator(mark)
        .first()
        .evaluate((n) => n.setAttribute("data-alpha-proof", ""));
      const actual = await chart.screenshot({
        omitBackground: true,
        path: info.outputPath(`${finish}-${paint.replaceAll("&", "-")}.png`),
      });
      const difference = await page.evaluate(
        async (pngs) => {
          const arrays = await Promise.all(
            pngs.map(async (png) => {
              const img = new Image();
              img.src = `data:image/png;base64,${png}`;
              await img.decode();
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
            painted = 0;
          for (let i = 3; i < a.length; i += 4) {
            if ((a[i] ?? 0) > 0) bodyMax = Math.max(bodyMax, Math.abs((a[i] ?? 0) - (b[i] ?? 0)));
            else exteriorMax = Math.max(exteriorMax, b[i] ?? 0);
            if ((a[i] ?? 0) > 0) painted++;
          }
          return { bodyMax, exteriorMax, painted };
        },
        [baseline.toString("base64"), actual.toString("base64")],
      );
      expect(difference.bodyMax).toBeLessThanOrEqual(1);
      expect(difference.exteriorMax).toBeLessThanOrEqual(
        finish === "glow" && paint !== "transparent" ? 60 : 1,
      );
      expect(difference.painted > 0).toBe(paint !== "transparent");
    }
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
  await charts.first().locator(mark).first().click();
  await expect(page.getByRole("status").first()).toContainText("Selected:");
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
