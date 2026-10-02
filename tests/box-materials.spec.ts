import { expect, test } from "@playwright/test";

const url = "http://127.0.0.1:4185/?materials";
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
