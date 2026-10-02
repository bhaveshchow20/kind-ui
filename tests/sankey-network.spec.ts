import { expect, test } from "@playwright/test";

const graph = (page: import("@playwright/test").Page) =>
  page.getByRole("article", { name: "Regional energy allocation" });

test("five-stage Sankey is balanced, proportional, colored and readable through finishes", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1600, height: 1400 });
  await page.goto("/sankeys.html");
  const network = graph(page);
  await expect(network.locator("path[data-network-flow]")).toHaveCount(39);
  await expect(network.locator(".network-label")).toHaveCount(16);
  await expect(network.locator(".network-stages span")).toHaveCount(5);
  const geometry = await network.locator("path[data-network-flow]").evaluateAll((paths) =>
    paths.map((p) => ({
      id: p.getAttribute("data-network-flow"),
      d: p.getAttribute("d"),
      width: Number(p.getAttribute("stroke-width")),
      value: Number(p.getAttribute("aria-label")?.match(/: (\d+) MWh$/)?.[1]),
    })),
  );
  const first = geometry[0];
  if (!first) throw new Error("Missing network geometry");
  const scale = first.width / first.value;
  for (const mark of geometry) expect(mark.width / mark.value).toBeCloseTo(scale, 8);
  const names = new Map(
    await network
      .locator(".network-label")
      .evaluateAll((labels) =>
        labels.map(
          (label) =>
            [
              label.querySelector("tspan")?.textContent,
              label.querySelectorAll("tspan")[1]?.textContent,
            ] as [string, string],
        ),
      ),
  );
  const incoming = new Map<string, number>(),
    outgoing = new Map<string, number>();
  const idToName: Record<string, string> = {
    solar: "Solar",
    wind: "Wind",
    hydro: "Hydro",
    north: "North zone",
    central: "Central zone",
    south: "South zone",
    direct: "Direct supply",
    stored: "Stored supply",
    firm: "Firm supply",
    city: "City grid",
    county: "County grid",
    metro: "Metro grid",
    homes: "Homes",
    industry: "Industry",
    services: "Services",
    public: "Public estate",
  };
  for (const mark of geometry) {
    const [source, target] = (mark.id ?? "").split(" → ");
    if (!source || !target) throw new Error("Missing route identity");
    outgoing.set(source, (outgoing.get(source) ?? 0) + mark.value);
    incoming.set(target, (incoming.get(target) ?? 0) + mark.value);
  }
  for (const [id, name] of Object.entries(idToName)) {
    const input = incoming.get(id) ?? 0,
      output = outgoing.get(id) ?? 0;
    if (input && output) expect(input).toBe(output);
    expect(names.get(name)).toBe(`${Math.max(input, output)} MWh`);
  }
  expect(
    [...outgoing].filter(([id]) => !incoming.has(id)).reduce((sum, [, value]) => sum + value, 0),
  ).toBe(180);
  expect(
    [...incoming].filter(([id]) => !outgoing.has(id)).reduce((sum, [, value]) => sum + value, 0),
  ).toBe(180);
  const boxes = await network.locator(".network-label").evaluateAll((labels) =>
    labels.map((label) => {
      const { x, y, width, height } = (label as SVGGraphicsElement).getBBox();
      return { x, y, width, height };
    }),
  );
  for (const [index, a] of boxes.entries())
    for (const b of boxes.slice(index + 1)) {
      expect(
        a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y,
      ).toBe(true);
    }
  const paints = await network
    .locator("linearGradient")
    .evaluateAll((gradients) =>
      gradients.map((g) =>
        Array.from(g.querySelectorAll("stop")).map((s) => s.getAttribute("stop-color")),
      ),
    );
  expect(new Set(paints.flat()).size).toBeGreaterThan(10);
  for (const finish of ["plain", "paper", "clay", "glow"]) {
    await network.getByRole("button", { name: finish, exact: true }).click();
    expect(
      await network.locator("path[data-network-flow]").evaluateAll((paths) =>
        paths.map((p) => ({
          id: p.getAttribute("data-network-flow"),
          d: p.getAttribute("d"),
          width: Number(p.getAttribute("stroke-width")),
          value: Number(p.getAttribute("aria-label")?.match(/: (\d+) MWh$/)?.[1]),
        })),
      ),
    ).toEqual(geometry);
    await expect(network.getByRole("button", { name: finish, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  await network.getByRole("button", { name: "plain", exact: true }).click();
  await network
    .locator(".network-capture")
    .screenshot({ path: info.outputPath("network-desktop.png") });
  const point = await network.locator('path[data-network-flow="wind → south"]').evaluate((el) => {
    const path = el as SVGPathElement,
      p = path.getPointAtLength(path.getTotalLength() / 2);
    const screen = new DOMPoint(p.x, p.y).matrixTransform(path.getScreenCTM() ?? undefined);
    return { x: screen.x, y: screen.y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(network.getByRole("status")).toContainText("MWh");
  // Crossings can cover a particular ribbon; inspect that precise route through the complete table.
  await network.getByRole("button", { name: "wind → south", exact: true }).click();
  await expect(network.getByRole("status")).toHaveText("wind → south: 30 MWh");
  await network.getByRole("button", { name: "glow", exact: true }).click();
  await expect(network.getByRole("status")).toHaveText("wind → south: 30 MWh");
  await network.getByRole("button", { name: "wind → south", exact: true }).click();
  await expect(network.getByRole("status")).toContainText("Select a ribbon");
  await expect(network.getByRole("button", { name: "wind → south", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("dense Sankey phone viewport scrolls independently and every route stays keyboard reachable", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/sankeys.html");
  const network = graph(page);
  await expect(network.locator("path[data-network-flow]")).toHaveCount(39);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scroll = network.getByRole("region", { name: "Five-stage energy diagram" });
  await scroll.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  const button = network.getByRole("button", { name: "metro → public", exact: true });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(network.getByRole("status")).toHaveText("metro → public: 10 MWh");
  await expect(network.locator("tbody tr")).toHaveCount(39);
  await network.locator(".network-capture").scrollIntoViewIfNeeded();
  await network
    .locator(".network-capture")
    .screenshot({ path: info.outputPath("network-320px.png") });
});
