import { expect, test } from "@playwright/test";

const packed = `http://127.0.0.1:${4189 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;

test("packed Sankey finishes preserve alpha and quantify thin/adjacent halo separately", async ({
  page,
}, info) => {
  await page.goto(packed);
  await page.addStyleTag({ content: "html,body {background:transparent !important}" });
  const probe = page.getByLabel("Surface probe", { exact: true });
  const adjacent = page.getByLabel("Adjacent probe", { exact: true });
  async function pixels(locator: typeof probe, name: string) {
    const bytes = await locator.screenshot({
      omitBackground: true,
      path: info.outputPath(`${name}.png`),
    });
    return page.evaluate(
      async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Missing canvas");
        ctx.drawImage(img, 0, 0);
        return Array.from(ctx.getImageData(0, 0, img.width, img.height).data);
      },
      `data:image/png;base64,${bytes.toString("base64")}`,
    );
  }
  const geometry = await probe
    .locator("path")
    .evaluateAll((paths) =>
      paths.map((p) => [p.getAttribute("d"), p.getAttribute("stroke-width")]),
    );
  const plain = await pixels(probe, "plain-alpha");
  const plainAdjacent = await pixels(adjacent, "plain-adjacent");
  for (const finish of ["clay", "glow"] as const) {
    await page
      .getByRole("button", { name: String(finish) === "plain" ? "Default" : finish, exact: true })
      .click();
    expect(
      await probe
        .locator("path")
        .evaluateAll((paths) =>
          paths.map((p) => [p.getAttribute("d"), p.getAttribute("stroke-width")]),
        ),
    ).toEqual(geometry);
    const surface = await pixels(probe, `${finish}-alpha`);
    const neighbor = await pixels(adjacent, `${finish}-adjacent`);
    let maxBodyAlpha = 0,
      maxExteriorAlpha = 0,
      colorChanges = 0;
    for (let i = 0; i < plain.length; i += 4) {
      if ((plain[i + 3] ?? 0) > 0) {
        maxBodyAlpha = Math.max(
          maxBodyAlpha,
          Math.abs((surface[i + 3] ?? 0) - (plain[i + 3] ?? 0)),
        );
        if (Math.abs((surface[i] ?? 0) - (plain[i] ?? 0)) > 2) colorChanges++;
      } else maxExteriorAlpha = Math.max(maxExteriorAlpha, surface[i + 3] ?? 0);
    }
    expect(maxBodyAlpha).toBeLessThanOrEqual(1);
    expect(colorChanges).toBeGreaterThan(100);
    expect(maxExteriorAlpha).toBeLessThanOrEqual(finish === "glow" ? 12 : 0);
    let gapAlpha = 0;
    for (let x = 40; x < 260; x++) {
      const i = (26 * 300 + x) * 4 + 3;
      expect(plainAdjacent[i]).toBe(0);
      gapAlpha = Math.max(gapAlpha, neighbor[i] ?? 0);
    }
    expect(gapAlpha).toBeLessThanOrEqual(finish === "glow" ? 20 : 0);
    if (finish === "glow") {
      expect(maxExteriorAlpha).toBeGreaterThan(0);
      for (const [width, center] of [
        [1, 20],
        [3, 55],
        [12, 90],
        [32, 125],
      ] as const) {
        let flowHalo = 0;
        for (let y = center - Math.ceil(width / 2) - 4; y <= center + Math.ceil(width / 2) + 4; y++)
          for (let x = 40; x < 260; x++) {
            const i = (y * 300 + x) * 4 + 3;
            if (plain[i] === 0) flowHalo = Math.max(flowHalo, surface[i] ?? 0);
          }
        expect(flowHalo, `${width}px flow must have a real bounded halo`).toBeGreaterThan(0);
        expect(flowHalo).toBeLessThanOrEqual(12);
      }
    }
    await info.attach(`${finish}-metrics`, {
      body: JSON.stringify({ maxBodyAlpha, maxExteriorAlpha, gapAlpha, colorChanges }),
      contentType: "application/json",
    });
    await probe.locator("path").evaluateAll((paths) => {
      for (const path of paths) path.setAttribute("stroke-opacity", "0");
    });
    const transparent = await pixels(probe, `${finish}-zero-alpha`);
    expect(Math.max(...transparent.filter((_, i) => i % 4 === 3))).toBe(0);
    await probe.locator("path").evaluateAll((paths) => {
      for (const path of paths) path.setAttribute("stroke-opacity", "0.4");
    });
  }
});

test("Sankey repeated finish updates preserve IDs and native layout", async ({ page }) => {
  await page.goto(packed);
  const chart = page.locator('[data-kind-ui="sankey"]').first();
  const geometry = await chart
    .locator("path")
    .evaluateAll((paths) =>
      paths.map((p) => [p.getAttribute("d"), p.getAttribute("stroke-width")]),
    );
  for (const finish of ["clay", "glow", "plain", "glow"]) {
    await page
      .getByRole("button", { name: String(finish) === "plain" ? "Default" : finish, exact: true })
      .click();
    expect(
      await chart
        .locator("path")
        .evaluateAll((paths) =>
          paths.map((p) => [p.getAttribute("d"), p.getAttribute("stroke-width")]),
        ),
    ).toEqual(geometry);
    const ids = await page.locator("svg [id]").evaluateAll((nodes) => nodes.map((n) => n.id));
    expect(new Set(ids).size).toBe(ids.length);
    await expect(chart).toHaveCSS("opacity", "1");
  }
  await page.getByRole("button", { name: "Change data", exact: true }).click();
  await expect(page.getByRole("table")).toContainText("20");
});

test("public recipes preserve paths, widths, labels and mobile inspection across finishes", async ({
  page,
}, info) => {
  await page.goto("/sankeys.html");
  const sections = page.locator("main > section[data-finish]");
  const geometry = await sections
    .nth(1)
    .locator("path[data-flow-id]")
    .evaluateAll((paths) =>
      paths.map((p) => [p.getAttribute("d"), p.getAttribute("stroke-width")]),
    );
  for (const finish of ["clay", "glow"]) {
    const section = page.locator(`main > section[data-finish="${finish}"]`);
    expect(
      await section
        .locator("path[data-flow-id]")
        .evaluateAll((paths) =>
          paths.map((p) => [p.getAttribute("d"), p.getAttribute("stroke-width")]),
        ),
    ).toEqual(geometry);
    expect(
      await section
        .locator("svg text")
        .evaluateAll((labels) =>
          labels.every((label) => getComputedStyle(label).filter === "none"),
        ),
    ).toBe(true);
    await section.getByRole("button", { name: "useful", exact: true }).click();
    await expect(section.getByRole("status")).toHaveText("useful: 75 MWh");
    await section.screenshot({ path: info.outputPath(`${finish}-recipe-desktop.png`) });
  }
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("finishes-320px.png"), fullPage: true });
});

test("native custom renderer, ref, event, CSS filters and em node strokes keep ownership", async ({
  page,
}, info) => {
  await page.goto(`${packed}?ownership`);
  const probe = page.getByLabel("Ownership probe", { exact: true });
  await page.addStyleTag({ content: ".owned-css {filter: url(#owned); stroke: #b81748}" });
  const wide = probe.getByLabel("wide-stroke", { exact: true });
  const size = await wide.boundingBox();
  expect(size).not.toBeNull();
  let plainAlpha: number[] = [];
  for (const finish of ["plain", "clay", "glow"]) {
    await page
      .getByRole("button", { name: String(finish) === "plain" ? "Default" : finish, exact: true })
      .click();
    await expect(probe.getByLabel("owned-filter", { exact: true })).toHaveAttribute(
      "filter",
      "url(#owned)",
    );
    await expect(probe.getByLabel("owned-path", { exact: true })).toHaveCSS(
      "filter",
      'url("#owned")',
    );
    expect(await wide.boundingBox()).toEqual(size);
    const point = await probe.getByLabel("owned-path", { exact: true }).evaluate((element) => {
      const path = element as SVGPathElement;
      const midpoint = path.getPointAtLength(path.getTotalLength() / 2);
      const screen = new DOMPoint(midpoint.x, midpoint.y).matrixTransform(
        path.getScreenCTM() ?? undefined,
      );
      return { x: screen.x, y: screen.y };
    });
    await page.mouse.click(point.x, point.y);
    await expect(page.getByLabel("Mark ownership", { exact: true })).toContainText("path");
    await expect(page.locator(".custom-native filter")).toHaveCount(0);
    await expect(page.getByLabel("custom-node", { exact: true })).toHaveCount(2);
    await expect(page.getByLabel("custom-link", { exact: true })).toHaveCount(1);
    const bytes = await probe.screenshot({
      omitBackground: true,
      path: info.outputPath(`${finish}-ownership-em.png`),
    });
    const alpha = await page.evaluate(
      async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Missing canvas");
        ctx.drawImage(img, 0, 0);
        const rgba = ctx.getImageData(0, 0, img.width, img.height).data;
        return Array.from(rgba).filter((_, i) => i % 4 === 3);
      },
      `data:image/png;base64,${bytes.toString("base64")}`,
    );
    if (finish === "plain") plainAlpha = alpha;
    else
      for (let y = 4; y < 76; y++)
        for (let x = 4; x < 50; x++) {
          const i = y * 300 + x;
          if ((plainAlpha[i] ?? 0) > 0)
            expect(Math.abs((alpha[i] ?? 0) - (plainAlpha[i] ?? 0))).toBeLessThanOrEqual(1);
        }
  }
  await expect(page.getByLabel("Mark ownership", { exact: true })).toContainText("4 / path");
});
