import { expect, type Page, test } from "./browser";

const url = "http://127.0.0.1:4177/";
const families = [
  ["radar", ".recharts-radar-polygon path"],
  ["radial", ".recharts-radial-bar-sector"],
] as const;
async function nativeGeometry(page: Page) {
  for (const [family, selector] of families) {
    const paths = (host: string) =>
      page
        .locator(`[data-host="${host}"] ${selector}`)
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    await expect.poll(() => paths(family)).toEqual(await paths("native"));
    expect((await paths(family)).join()).not.toMatch(/NaN|Infinity/);
  }
}

for (const query of [
  "",
  "range",
  "radial-range",
  "stack",
  "signed",
  "thin&short",
  "motion",
  "boolean-shape",
]) {
  test(`polar finishes preserve actual native paths through updates: ${query || "default"}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}?${query}`);
    for (const material of ["paper", "clay", "glow", "plain", "clay"]) {
      await page.getByLabel("Material", { exact: true }).selectOption(material);
      await nativeGeometry(page);
      expect(
        await page
          .locator('[data-host="radar"] .recharts-radar-dot')
          .evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).filter === "none")),
      ).toBe(true);
      const ids = await page
        .locator('[data-kind-ui="polar-material"] filter')
        .evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(ids).toHaveLength(material === "plain" ? 0 : 4);
      expect(new Set(ids).size).toBe(ids.length);
      for (const [family] of families) {
        const host = page.locator(`[data-host="${family}"]`);
        await expect(host.locator(".recharts-label-list text").first()).toBeVisible();
        await host.getByRole("application").focus();
        await page.keyboard.press("ArrowLeft");
        await page.keyboard.press("ArrowRight");
        await expect(host.locator('[data-kind-ui="chart-tooltip"]')).toBeVisible();
        await page.keyboard.press("Escape");
      }
    }
    for (const name of [
      "Domain",
      "Geometry",
      "Resize",
      "Update",
      "Reorder",
      "Zero",
      "Empty",
      "Empty",
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      await nativeGeometry(page);
    }
    expect(errors).toEqual([]);
  });
}

test("consumer filters, custom/active renderers, Cell paint, refs and handlers keep ownership", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByLabel("Material", { exact: true }).selectOption("glow");
  await page.getByLabel("Native filter", { exact: true }).check();
  await expect(page.locator('[data-kind-ui="polar-material"]')).toHaveCount(2);
  await expect(page.locator('[data-host="radar"] .recharts-polygon').first()).toHaveAttribute(
    "filter",
    "url(#host-filter)",
  );
  await expect(
    page.locator('[data-host="radial"] .recharts-radial-bar-sector').first(),
  ).toHaveAttribute("filter", "url(#radial-host-filter)");
  await page.getByLabel("Native filter", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Shape", exact: true }).click();
  await expect(page.locator('[data-host-shape="radial"]')).toHaveCount(3);
  await expect(page.locator('[data-host-shape="radial"][filter]')).toHaveCount(0);
  await page.locator('[data-host-shape="radial"]').first().dispatchEvent("click");
  await expect(page.locator("output")).toContainText("Clicks 1");
  await expect(page.locator('.recharts-radial-bar-sector[fill="#27806a"]')).toHaveCount(1);
  await expect(page.locator('svg[data-host-ref="attached"][data-ref-count="1"]')).toHaveCount(2);
  for (const query of ["style-filter", "radar-shape&active-shape"]) {
    await page.goto(`${url}?${query}`);
    await page.getByLabel("Material", { exact: true }).selectOption("clay");
    await expect(page.locator('[data-kind-ui="polar-material"]')).toHaveCount(2);
  }
});

for (const mode of ["static", "motion", "reduced"] as const) {
  test(`polar recipe materials, gauge whitespace and radial labels: ${mode}`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    await page.goto("/polar.html");
    await expect(page.getByLabel("Motion", { exact: true })).toBeChecked();
    await page.getByLabel("Color", { exact: true }).selectOption("pink");
    if (mode === "static") await page.getByLabel("Motion", { exact: true }).uncheck();
    const geometry = await page
      .locator(".recharts-radar-polygon path, .recharts-radial-bar-sector")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    const gauge = page
      .locator(".polar-card")
      .filter({ has: page.getByRole("heading", { name: "Gauge", exact: true }) });
    for (const material of ["plain", "paper", "clay", "glow"]) {
      await page.getByLabel("Material", { exact: true }).selectOption(material);
      expect(
        await page
          .locator(".recharts-radar-polygon path, .recharts-radial-bar-sector")
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
      ).toEqual(geometry);
      for (const width of [1000, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(gauge.locator("[data-gauge-value]")).toBeVisible();
        expect(
          await gauge.locator("[data-gauge-value]").evaluate((node) => {
            const text = node as SVGTextElement,
              box = text.getBBox();
            const cx = Number(text.dataset.cx),
              cy = Number(text.dataset.cy),
              radius = Number(text.dataset.innerRadius);
            return (
              Number.parseFloat(getComputedStyle(text).fontSize) >= 36 &&
              [box.x, box.x + box.width].every((x) =>
                [box.y, box.y + box.height].every((y) => Math.hypot(x - cx, y - cy) < radius),
              )
            );
          }),
        ).toBe(true);
        await expect(
          page.locator('[data-kind-ui="radial-label"][data-fit="yes"]').first(),
        ).toBeVisible();
        await page.screenshot({
          path: info.outputPath(`${mode}-${material}-${width}.png`),
          fullPage: true,
        });
        await gauge.getByRole("application").focus();
        await page.keyboard.press("ArrowRight");
        await expect(gauge.locator('[data-kind-ui="chart-tooltip"]')).toBeVisible();
        await page.keyboard.press("Escape");
      }
      await page.setViewportSize({ width: 1000, height: 900 });
      await page.getByLabel("Chart text", { exact: true }).uncheck();
      await expect(page.locator('[data-kind-ui="radial-label"], [data-gauge-value]')).toHaveCount(
        0,
      );
      await page.getByLabel("Chart text", { exact: true }).check();
    }
    if (mode === "reduced") {
      const opacity = await page
        .locator('[data-kind-ui="radial-bar-reveal"], [data-kind-ui="radar-reveal"]')
        .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).opacity));
      expect(opacity.every((value) => value === "1")).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

for (const transparent of [false, true]) {
  test(`polar raster alpha and visible distinctions: ${transparent ? "zero" : "gradient"}`, async ({
    page,
  }, info) => {
    await page.goto(`${url}?paint${transparent ? "&transparent" : ""}`);
    await page.addStyleTag({
      content:
        '[data-host="radar"], [data-host="radial"] { background: transparent !important; } svg * { visibility: hidden; } svg defs *, [data-alpha-proof] { visibility: visible !important; }',
    });
    for (const [family, selector] of families) {
      const mark = page.locator(`[data-host="${family}"] ${selector}`).first();
      const box = await mark.boundingBox();
      if (!box) throw new Error("Missing native shape");
      const clip = {
        x: Math.floor(box.x - 12),
        y: Math.floor(box.y - 12),
        width: Math.ceil(box.width + 25),
        height: Math.ceil(box.height + 25),
      };
      async function raster(material: string) {
        await page.getByLabel("Material", { exact: true }).selectOption(material);
        await mark.evaluate((node) => node.setAttribute("data-alpha-proof", ""));
        const bytes = await page.screenshot({
          clip,
          omitBackground: true,
          path: info.outputPath(`${family}-${material}-${transparent ? "zero" : "gradient"}.png`),
        });
        return page.evaluate(
          async (src) => {
            const image = new Image();
            image.src = src;
            await image.decode();
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("No canvas");
            ctx.drawImage(image, 0, 0);
            return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
          },
          `data:image/png;base64,${bytes.toString("base64")}`,
        );
      }
      const plain = await raster("plain");
      for (const material of ["paper", "clay", "glow"]) {
        const finish = await raster(material);
        let exterior = 0,
          changed = 0,
          maxAlphaDifference = 0;
        for (let i = 3; i < plain.length; i += 4) {
          const alpha = plain[i] ?? 0,
            next = finish[i] ?? 0;
          if (alpha > 0) {
            maxAlphaDifference = Math.max(maxAlphaDifference, Math.abs(alpha - next));
            if (Math.abs((plain[i - 1] ?? 0) - (finish[i - 1] ?? 0)) > 3) changed++;
          } else if (next > 0) exterior++;
        }
        expect(maxAlphaDifference).toBeLessThanOrEqual(1);
        if (transparent)
          expect(finish.filter((_, i) => i % 4 === 3).every((alpha) => alpha === 0)).toBe(true);
        else {
          expect(changed).toBeGreaterThan(20);
          if (material === "glow") expect(exterior).toBeGreaterThan(10);
          else expect(exterior).toBe(0);
        }
      }
      await mark.evaluate((node) => node.removeAttribute("data-alpha-proof"));
    }
  });
}
