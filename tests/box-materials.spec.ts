import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4191 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?materials`;
const finishes = ["plain", "paper", "clay", "glow"] as const;
const marks = '[data-kind-ui="box-plot-mark"]';

test("packed Box materials: exact geometry, Cell paint, custom ownership and repeated updates", async ({
  page,
}, info) => {
  await page.goto(url);
  const host = page.getByRole("region", { name: "Packed box plot" });
  const geometry = () =>
    host.locator("[data-box-part]").evaluateAll((nodes) =>
      nodes.map((node) =>
        [...node.attributes]
          .filter((attr) => !["fill", "stroke", "filter"].includes(attr.name))
          .map((attr) => `${attr.name}=${attr.value}`)
          .join("/"),
      ),
    );
  const before = await geometry();
  for (const material of finishes) {
    await host.getByRole("button", { name: material, exact: true }).click();
    expect(await geometry()).toEqual(before);
    await expect(host.locator('[data-kind-ui="box-material"]')).toHaveCount(
      material === "plain" ? 0 : 3,
    );
    if (material !== "plain") {
      await expect(host.locator(marks).first()).toHaveAttribute("filter", /url\(#kind-ui-box-/);
    }
    await expect(host.locator(marks).first()).toHaveAttribute("stroke-width", "4");
    await expect(host.locator(marks).first()).toHaveAttribute("stroke-dasharray", "4 2");
    expect(
      await host
        .locator('[data-box-part="box"]')
        .first()
        .evaluate((node) => getComputedStyle(node).fillOpacity),
    ).toBe("0");
    await host.getByRole("button", { name: "Paint", exact: true }).click();
    expect(
      await host
        .locator('[data-box-part="box"]')
        .first()
        .evaluate((node) => getComputedStyle(node).fillOpacity),
    ).toBe("0.65");
    await host.getByRole("button", { name: "Paint", exact: true }).click();
    await host.getByRole("button", { name: "Custom", exact: true }).click();
    await expect(host.locator('[data-kind-ui="box-material"]')).toHaveCount(0);
    await expect(host.locator('[data-custom="yes"]')).toHaveCount(3);
    await host.getByRole("button", { name: "Custom", exact: true }).click();
    for (let cycle = 0; cycle < 2; cycle++) {
      await host.getByRole("button", { name: "Distribution", exact: true }).click();
      await expect(host.locator(marks)).toHaveCount(0);
      await host.getByRole("button", { name: "Distribution", exact: true }).click();
      await expect(host.locator(marks)).toHaveCount(3);
    }
    await host.getByRole("button", { name: "Reorder", exact: true }).click();
    await host.getByRole("button", { name: "Reorder", exact: true }).click();
    expect(await geometry()).toEqual(before);
  }
  await page.screenshot({ path: info.outputPath("box-materials-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: info.outputPath("box-materials-phone.png"), fullPage: true });
  await host.getByRole("button", { name: "All equal", exact: true }).click();
  await expect(host.locator('[data-box-part="collapsed-box"]')).toHaveCount(2);
  await host.getByRole("button", { name: "All missing", exact: true }).click();
  await expect(host.locator(marks)).toHaveCount(0);
});

test("Box finishes preserve rendered alpha and produce visible grain, relief, and exterior light on tiny marks", async ({
  page,
}) => {
  await page.goto(url);
  const samples = await page.locator("svg[data-finish]").evaluateAll(async (nodes) => {
    const results = [];
    for (const node of nodes) {
      const image = new Image();
      image.src = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(node))}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 220;
      canvas.height = 220;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Missing canvas context");
      context.drawImage(image, 0, 0);
      const pixel = (x: number, y: number) => Array.from(context.getImageData(x, y, 1, 1).data);
      results.push({
        material: node.getAttribute("data-finish"),
        interior: pixel(85, 95),
        upper: pixel(75, 75),
        lower: pixel(125, 135),
        exterior: pixel(66, 95),
      });
    }
    return results;
  });
  const [plain, paper, clay, glow] = samples;
  if (!plain || !paper || !clay || !glow) throw new Error("Missing material samples");
  for (const finish of samples)
    expect(finish.interior[3]).toBeCloseTo(Number(plain.interior[3]), 0);
  expect(paper.upper).not.toEqual(plain.upper);
  expect(clay.upper[0]).toBeGreaterThan(Number(clay.lower[0]));
  expect(glow.exterior[3]).toBeGreaterThan(Number(plain.exterior[3]));
  for (const material of finishes) {
    const tiny = page.locator(`svg[data-tiny="${material}"]`);
    await expect(tiny.locator('[data-box-part="box"]')).toHaveAttribute("height", "0");
    await expect(tiny.locator('[data-box-part="collapsed-box"]')).toHaveCount(1);
  }
});

test("materialized parts retain consumer child styles and painted wide strokes", async ({
  page,
}) => {
  await page.goto(url);
  for (const material of finishes) {
    const svg = page.locator(`svg[data-wide="${material}"]`);
    expect(
      await svg.locator('[data-box-part="box"]').evaluate((node) => ({
        fill: getComputedStyle(node).fill,
        alpha: getComputedStyle(node).fillOpacity,
      })),
    ).toEqual({ fill: "rgb(255, 0, 0)", alpha: "0" });
    const alpha = await svg.evaluate(async (node) => {
      const drawable = node.cloneNode(true) as SVGSVGElement;
      drawable.removeAttribute("style");
      const image = new Image();
      image.src = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(drawable))}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 220;
      canvas.height = 220;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Missing context");
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(100, 70, 1, 1).data[3];
    });
    expect(alpha).toBe(255);
  }
  await page.addStyleTag({ content: "svg[data-finish] [data-box-part] { stroke-width: 80px; }" });
  await page.locator("svg[data-finish]").evaluateAll((nodes) => {
    for (const svg of nodes) {
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = "[data-box-part] { stroke-width: 100px; }";
      svg.append(style);
    }
  });
  for (const material of finishes) {
    const svg = page.locator(`svg[data-finish="${material}"]`);
    await expect(async () => {
      const alpha = await svg.evaluate(async (node) => {
        // Include the injected consumer rule in this standalone raster image.
        const clone = node.cloneNode(true) as SVGSVGElement;
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = "[data-box-part] { stroke-width: 80px; }";
        clone.prepend(style);
        const image = new Image();
        image.src = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(clone))}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 220;
        canvas.height = 220;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Missing context");
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(40, 95, 1, 1).data[3];
      });
      expect(alpha).toBe(255);
    }).toPass();
  }
  const tiny = await page.locator("svg[data-tiny]").evaluateAll(async (nodes) => {
    const values = [];
    for (const node of nodes) {
      const image = new Image();
      image.src = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(node))}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 220;
      canvas.height = 60;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Missing context");
      ctx.drawImage(image, 0, 0);
      values.push(Array.from(ctx.getImageData(24, 24, 12, 12).data));
    }
    return values;
  });
  for (const pixels of tiny.slice(1)) expect(pixels).not.toEqual(tiny[0]);
});

test("all Box finishes retain native clipping, masks, gradient alpha, visibility and filter overrides", async ({
  page,
}) => {
  await page.goto(url);
  const results = await page.locator("svg[data-finish]").evaluateAll(async (nodes) => {
    const all = [];
    for (const node of nodes) {
      const mark = node.querySelector('[data-kind-ui="box-plot-mark"]');
      if (!mark) throw new Error("Missing mark");
      const svgNS = "http://www.w3.org/2000/svg";
      const defs = document.createElementNS(svgNS, "defs");
      const prefix = node.getAttribute("data-finish");
      defs.innerHTML = `<linearGradient id="${prefix}-paint"><stop stop-color="#176b69" stop-opacity="0.4"/><stop offset="1" stop-color="#176b69" stop-opacity="0.4"/></linearGradient><clipPath id="${prefix}-clip"><rect x="0" y="0" width="90" height="220"/></clipPath><mask id="${prefix}-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="220" height="220"><rect fill="white" x="0" y="0" width="90" height="220"/></mask>`;
      node.prepend(defs);
      mark.setAttribute("fill", `url(#${prefix}-paint)`);
      mark.setAttribute("fill-opacity", "0.5");
      const pixel = async (x: number, y: number) => {
        const image = new Image();
        image.src = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(node))}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 220;
        canvas.height = 220;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Missing canvas");
        ctx.drawImage(image, 0, 0);
        return Array.from(ctx.getImageData(x, y, 1, 1).data);
      };
      const gradient = await pixel(85, 95);
      mark.setAttribute("clip-path", `url(#${prefix}-clip)`);
      const clipped = await pixel(115, 95);
      const retained = await pixel(85, 95);
      mark.removeAttribute("clip-path");
      mark.setAttribute("mask", `url(#${prefix}-mask)`);
      const masked = await pixel(115, 95);
      mark.removeAttribute("mask");
      mark.setAttribute("visibility", "hidden");
      const hidden = await pixel(85, 95);
      mark.removeAttribute("visibility");
      mark.setAttribute("fill-opacity", "0");
      const zero = await pixel(85, 95);
      all.push({ gradient, clipped, retained, masked, hidden, zero });
    }
    return all;
  });
  for (const result of results) {
    expect(result.gradient[3]).toBe(51);
    expect(result.retained[3]).toBe(51);
    for (const key of ["clipped", "masked", "hidden", "zero"] as const)
      expect(result[key][3]).toBe(0);
  }
  const host = page.getByRole("region", { name: "Packed box plot" });
  await host.getByRole("button", { name: "clay", exact: true }).click();
  await expect(host.locator(`${marks}[data-mark-ref="yes"]`)).toHaveCount(3);
  await expect(host.locator(".recharts-label-list")).toHaveCount(1);
  await host
    .locator('[data-box-part="box"]')
    .first()
    .click({ position: { x: 4, y: 4 } });
  await expect(host.getByLabel("Events")).not.toHaveText("0");
});

test("Box material updates retain horizontal coordinates and reduced Motion interruption", async ({
  page,
}) => {
  await page.goto(url);
  const host = page.getByRole("region", { name: "Packed box plot" });
  await host.getByRole("button", { name: "Orientation", exact: true }).click();
  const geometry = () =>
    host.locator("[data-box-part]").evaluateAll((nodes) => nodes.map((node) => node.outerHTML));
  const baseline = await geometry();
  for (const material of finishes) {
    await host.getByRole("button", { name: material, exact: true }).click();
    expect(await geometry()).toEqual(baseline);
    await host.getByRole("button", { name: "Animate", exact: true }).click();
    await expect(host.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
    await host.getByRole("button", { name: "Animate", exact: true }).click();
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const material of finishes) {
    await page.goto(`${url}&animate`);
    await host.getByRole("button", { name: material, exact: true }).click();
    await expect(host.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(1);
    await host.getByRole("application", { name: "Box distribution" }).focus();
    await expect(host.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  }
});
