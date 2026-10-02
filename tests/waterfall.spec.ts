import { expect, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const packed = `http://127.0.0.1:${4187 + offset}`;
const marks = ".recharts-bar-rectangle path";
const links = '.recharts-reference-line line[stroke-dasharray="3 3"]';
const reveal = '[data-kind-ui="bar-reveal"]';
type Row = {
  id: string;
  range: [number, number] | null;
  first: number | null;
  last: number | null;
  balance: number | null;
  value: number | null;
};
for (const mode of ["mixed", "positive", "negative", "zero", "missing"]) {
  test(`packed waterfall ${mode} numeric geometry`, async ({ page }) => {
    await page.goto(packed);
    await page.getByLabel("Values").selectOption(mode);
    const data: Row[] = JSON.parse(
      (await page.locator("[data-probe]").getAttribute("data-probe")) ?? "[]",
    );
    await expect(page.locator(marks)).toHaveCount(
      data.filter((row) => row.range && row.range[0] !== row.range[1]).length,
    );
    for (const row of data) {
      const mark = page.locator(`.recharts-bar-rectangle path[id="${row.id}"]`);
      if (!row.range || row.range[0] === row.range[1]) {
        await expect(mark).toHaveCount(0);
        continue;
      }
      const b = await mark.evaluate((node) => {
        const b = (node as SVGGraphicsElement).getBBox();
        return { y: b.y, height: b.height };
      });
      expect(b.y).toBeCloseTo(Math.min(row.first ?? NaN, row.last ?? NaN), 2);
      expect(b.height).toBeCloseTo(Math.abs((row.first ?? NaN) - (row.last ?? NaN)), 2);
    }
    await expect(page.locator(links)).toHaveCount(
      mode === "missing" ? 1 : mode === "mixed" || mode === "zero" ? 6 : 5,
    );
    if (mode === "missing") {
      expect(data.slice(2, 6).every((row) => row.range === null && row.balance === null)).toBe(
        true,
      );
      expect(data[4]?.value).toBe(0);
      expect(data[6]?.balance).toBe(40);
    }
    if (mode === "mixed") {
      expect(data[2]?.range).toEqual([-30, 130]);
      const ys = await page
        .locator(links)
        .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("y1"))));
      expect(ys[0]).toBeCloseTo(data[0]?.last ?? NaN, 2);
      expect(ys[1]).toBeCloseTo(data[1]?.last ?? NaN, 2);
    }
  });
}

test("packed native axes horizontal layout, reversed categories and resize", async ({ page }) => {
  await page.goto(packed);
  await expect(page.getByRole("application")).toHaveAttribute("data-native-ref", "svg");
  await page.getByRole("button", { name: "Orientation", exact: true }).click();
  for (const control of [null, "Reverse", "Resize"]) {
    if (control) await page.getByRole("button", { name: control, exact: true }).click();
    const data: Row[] = JSON.parse(
      (await page.locator("[data-probe]").getAttribute("data-probe")) ?? "[]",
    );
    for (const row of data.filter((row) => row.range && row.range[0] !== row.range[1])) {
      const b = await page
        .locator(`.recharts-bar-rectangle path[id="${row.id}"]`)
        .evaluate((node) => {
          const b = (node as SVGGraphicsElement).getBBox();
          return { x: b.x, width: b.width };
        });
      expect(b.x).toBeCloseTo(Math.min(row.first ?? NaN, row.last ?? NaN), 2);
      expect(b.width).toBeCloseTo(Math.abs((row.first ?? NaN) - (row.last ?? NaN)), 2);
    }
    await expect(page.locator(links)).toHaveCount(6);
  }
});

test("packed updates visibility native extensions and pointer", async ({ page }) => {
  await page.goto(packed);
  await page.getByRole("button", { name: "Update", exact: true }).click();
  const data: Row[] = JSON.parse(
    (await page.locator("[data-probe]").getAttribute("data-probe")) ?? "[]",
  );
  const updatedGain = await page
    .locator('.recharts-bar-rectangle path[id="b"]')
    .evaluate((node) => (node as SVGGraphicsElement).getBBox().height);
  expect(updatedGain).toBeCloseTo(Math.abs((data[1]?.first ?? NaN) - (data[1]?.last ?? NaN)), 2);
  expect(data[1]?.balance).toBe(180);
  expect(data[6]?.balance).toBe(90);
  await expect(page.locator(links)).toHaveCount(6);
  for (const control of ["Visibility", "Native hide"]) {
    await page.getByRole("button", { name: control, exact: true }).click();
    await expect(page.locator(marks)).toHaveCount(0);
    await expect(page.locator(links)).toHaveCount(0);
    await page.getByRole("button", { name: control, exact: true }).click();
    await expect(page.locator(marks)).toHaveCount(6);
  }
  await page.getByRole("button", { name: "clay", exact: true }).click();
  await expect(page.locator('[data-kind-ui="bar-material"]')).toHaveAttribute(
    "data-material",
    "clay",
  );
  await page.getByRole("button", { name: "Extensions", exact: true }).click();
  await expect(page.locator("[data-host-shape]")).toHaveCount(6);
  await expect(page.locator('[data-kind-ui="bar-material"]')).toHaveCount(0);
  await expect(page.locator(".recharts-label-list")).toBeVisible();
  await page.locator("[data-host-shape]").first().click();
  await expect(page.getByLabel("Clicks")).toHaveText("1");
  await expect(page.locator('div[role="status"]')).toContainText("Opening: 80");
  expect(data[2]?.range).toEqual([20, 180]);
});

test("packed keyboard zero missing and Escape", async ({ page }) => {
  await page.goto(packed);
  const chart = page.getByRole("application");
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('div[role="status"]')).toContainText("Gain: 50");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('div[role="status"]')).toContainText("Loss: -160");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('div[role="status"]')).toContainText("Zero: 0; balance -30");
  await page.keyboard.press("Escape");
  await expect(page.locator('div[role="status"]')).toBeHidden();
  await page.getByLabel("Values").selectOption("missing");
  await chart.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('div[role="status"]')).toContainText("Loss: Unknown; balance Unknown");
});

test("packed default Motion interruption and reduced motion", async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(packed);
  await expect(page.locator(reveal)).toHaveCount(1);
  await page.clock.runFor(100);
  await page
    .getByRole("button", { name: "Update", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(page.locator(reveal)).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "off");
  await expect(page.locator(marks)).toHaveCount(6);
});

test("recipe phone table empty state and materials", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/waterfalls.html");
  await expect(page.getByLabel("Motion", { exact: true })).toBeChecked();
  await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "off");
  const baseline = await page.locator(marks).evaluateAll((nodes) =>
    nodes.map((node) => {
      const b = (node as SVGGraphicsElement).getBBox();
      return [b.x, b.y, b.width, b.height];
    }),
  );
  for (const material of ["paper", "clay", "glow", "plain"]) {
    await page.getByRole("button", { name: material, exact: true }).click();
    expect(
      await page.locator(marks).evaluateAll((nodes) =>
        nodes.map((node) => {
          const b = (node as SVGGraphicsElement).getBBox();
          return [b.x, b.y, b.width, b.height];
        }),
      ),
    ).toEqual(baseline);
    if (material !== "plain")
      await expect(page.locator('[data-kind-ui="bar-material"]')).toHaveAttribute(
        "data-material",
        material,
      );
    await page.screenshot({
      path: `artifacts/chart-tests/waterfall-phone-${material}.png`,
      fullPage: true,
    });
  }
  await page.getByText("View data", { exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: "Refund", exact: true }) }),
  ).toContainText("0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Values").selectOption("missing");
  await expect(
    page
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: "Recovery", exact: true }) }),
  ).toContainText("Unknown");
  await page.screenshot({
    path: "artifacts/chart-tests/waterfall-phone-missing-table.png",
    fullPage: true,
  });
  await page.getByLabel("Values").selectOption("empty");
  await expect(page.locator('p[role="status"]')).toHaveText("No waterfall data");
});

test("recipe desktop visual evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/waterfalls.html");
  for (const material of ["plain", "paper", "clay", "glow"]) {
    await page.getByRole("button", { name: material, exact: true }).click();
    await page.screenshot({
      path: `artifacts/chart-tests/waterfall-desktop-${material}.png`,
      fullPage: true,
    });
  }
});

test("packed connectors reconcile ids containing separators", async ({ page }) => {
  await page.goto(packed);
  await page.getByLabel("Values").selectOption("ids");
  await expect(page.locator(links)).toHaveCount(6);
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page.locator(links)).toHaveCount(6);
  await page.getByLabel("Values").selectOption("mixed");
  await expect(page.locator(links)).toHaveCount(6);
  await page.getByLabel("Values").selectOption("ids");
  await expect(page.locator(links)).toHaveCount(6);
});
