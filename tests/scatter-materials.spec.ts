import { expect, type Page, test } from "./browser";

const url = "http://127.0.0.1:4185/?materials";
const paths = ".recharts-scatter-symbol path.recharts-symbols:not(defs path)";
const finishes = ["plain", "paper", "clay", "glow"] as const;
async function pixels(page: Page, bytes: Buffer) {
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

test("tarball finishes preserve all seven native symbol paths, transforms, paint and labels at tiny and bubble sizes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  const finished = page.getByRole("application", { name: "Finished symbols" });
  const native = page.getByRole("application", { name: "Native symbols" });
  await expect(finished).toHaveAttribute("data-ref", "svg");
  for (const symbol of ["circle", "diamond", "square", "triangle", "star", "cross", "wye"]) {
    await page.getByRole("button", { name: symbol, exact: true }).click();
    for (const material of finishes) {
      await page.getByRole("button", { name: material, exact: true }).click();
      await expect(finished.locator(paths)).toHaveCount(7);
      for (const attribute of ["d", "transform", "fill", "fill-opacity", "opacity", "style"]) {
        expect(
          await finished
            .locator(paths)
            .evaluateAll((nodes, attr) => nodes.map((n) => n.getAttribute(attr)), attribute),
        ).toEqual(
          await native
            .locator(paths)
            .evaluateAll((nodes, attr) => nodes.map((n) => n.getAttribute(attr)), attribute),
        );
      }
      // Upstream zero and missing Z share the exact native minimum (4 px²).
      expect(await finished.locator(paths).nth(0).getAttribute("d")).toBe(
        await finished.locator(paths).nth(1).getAttribute("d"),
      );
      expect(await finished.locator(".recharts-label-list text").allTextContents()).toEqual(
        await native.locator(".recharts-label-list text").allTextContents(),
      );
      await expect(finished.locator(".recharts-label-list [filter]")).toHaveCount(0);
      const ids = await finished
        .locator('[data-kind-ui="scatter-material"] filter')
        .evaluateAll((nodes) => nodes.map((n) => n.id));
      expect(ids.length).toBe(material === "plain" ? 0 : material === "glow" ? 21 : 7);
      expect(new Set(ids).size).toBe(ids.length);
    }
  }
  expect(errors).toEqual([]);
});

test("tarball custom renderer and Cell filter ownership survives active portals, repeated interaction and resize", async ({
  page,
}, info) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Ownership", exact: true }).click();
  const chart = page.getByRole("application", { name: "Finished symbols" });
  for (const material of ["paper", "clay", "glow"] as const) {
    await page.getByRole("button", { name: material, exact: true }).click();
    await expect(chart.locator('[data-kind-ui="scatter-material"]')).toHaveCount(7);
    await expect(chart.locator('[data-custom="function"]')).not.toHaveAttribute("filter");
    await expect(chart.locator('[data-custom="element"]')).not.toHaveAttribute("filter");
    await expect(chart.locator('path[fill="red"]')).not.toHaveAttribute("filter");
    await expect(chart.locator('path[filter="none"]')).toHaveCount(1);
    await expect(chart.locator('path[style*="filter: none"]')).toHaveCount(1);
    for (let i = 0; i < 2; i++) {
      await chart.locator("path#medium").hover();
      await chart.locator("path#medium").click();
      await expect(page.locator('[data-kind-ui="chart-tooltip"][role="status"]')).toBeVisible();
      await page.getByRole("button", { name: "Resize", exact: true }).click();
      await page.getByRole("button", { name: "Update", exact: true }).click();
      await chart.focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.locator('[data-kind-ui="chart-tooltip"][role="status"]')).toBeVisible();
    }
    const ids = await chart
      .locator('[data-kind-ui="scatter-material"] filter')
      .evaluateAll((nodes) => nodes.map((n) => n.id));
    expect(new Set(ids).size).toBe(ids.length);
  }
  expect(Number(await page.getByLabel("Clicks").textContent())).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="scatter-fade"]').first()).toHaveCSS("opacity", "1");
  await chart.screenshot({ path: info.outputPath("ownership-repeated.png") });
});

for (const gradient of [false, true]) {
  test(`tarball small and large marks preserve ${gradient ? "gradient" : "solid"} alpha and bound exterior light`, async ({
    page,
  }, info) => {
    await page.goto(url);
    if (gradient) await page.getByRole("button", { name: "Gradient", exact: true }).click();
    await page.addStyleTag({
      content: `html, body { background: transparent !important; } svg text, svg line, ${paths} { visibility: hidden; } [data-alpha-proof] { visibility: visible !important; }`,
    });
    const chart = page.getByRole("application", { name: "Finished symbols" });
    for (const index of [0, 3, 4, 5]) {
      await chart.locator("[data-alpha-proof]").evaluateAll((nodes) =>
        nodes.forEach((n) => {
          n.removeAttribute("data-alpha-proof");
        }),
      );
      const mark = chart.locator(paths).nth(index);
      const box = await mark.boundingBox();
      if (!box) throw new Error("Missing symbol bounds");
      const clip = {
        x: Math.floor(box.x - 12),
        y: Math.floor(box.y - 12),
        width: Math.ceil(box.width + 25),
        height: Math.ceil(box.height + 25),
      };
      async function raster(material: (typeof finishes)[number]) {
        await page.getByRole("button", { name: material, exact: true }).click();
        await mark.evaluate((n) => n.setAttribute("data-alpha-proof", ""));
        return pixels(
          page,
          await page.screenshot({
            clip,
            omitBackground: true,
            path: info.outputPath(`${material}-${gradient ? "gradient" : "solid"}-${index}.png`),
          }),
        );
      }
      const plain = await raster("plain");
      for (const material of ["paper", "clay", "glow"] as const) {
        const finish = await raster(material);
        let alphaError = 0,
          external = 0,
          rgb = 0,
          count = 0;
        for (let i = 0; i < plain.length; i += 4) {
          const a = plain[i + 3] ?? 0,
            b = finish[i + 3] ?? 0;
          if (a > 0) alphaError = Math.max(alphaError, Math.abs(a - b));
          else external = Math.max(external, b);
          if (a > 8) {
            rgb +=
              Math.abs((plain[i] ?? 0) - (finish[i] ?? 0)) +
              Math.abs((plain[i + 1] ?? 0) - (finish[i + 1] ?? 0)) +
              Math.abs((plain[i + 2] ?? 0) - (finish[i + 2] ?? 0));
            count += 3;
          }
        }
        expect(alphaError).toBeLessThanOrEqual(1);
        if (index === 4) {
          expect(finish.every((v, i) => i % 4 !== 3 || v === 0)).toBe(true);
          continue;
        }
        if (material === "glow") {
          if (index === 5) expect(external).toBeGreaterThan(0);
          expect(external).toBeLessThanOrEqual(Math.ceil(255 * 0.35 * 0.8 * 0.6 * 0.65));
        } else expect(external).toBe(0);
        // Four-pixel native marks are never silently enlarged; their tonal finish is tested separately.
        expect(rgb / count).toBeGreaterThan(index === 0 ? 0.5 : 2);
      }
    }
  });
}

for (const material of finishes) {
  test(`four recipes show ${material} across palettes, widths and Motion`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/scatters.html");
    await expect(page.getByRole("checkbox", { name: "Motion", exact: true })).toBeChecked();
    await page
      .getByRole("button", {
        name: material.charAt(0).toUpperCase() + material.slice(1),
        exact: true,
      })
      .click();
    const signed = page.getByRole("application", { name: "Cost and quality change by team" });
    await expect(signed.locator('[data-kind-ui="scatter-material"]')).toHaveCount(0);
    for (const palette of ["Monochrome", "Color"]) {
      await page.getByRole("button", { name: palette, exact: true }).click();
      for (const width of [1000, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await expect(page.getByRole("application")).toHaveCount(4);
        await expect
          .poll(() =>
            page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          )
          .toBe(true);
        await page.getByRole("checkbox", { name: "Motion", exact: true }).uncheck();
        await expect(page.locator('[data-kind-ui="line-frame"][data-motion="off"]')).toHaveCount(4);
        await page.screenshot({
          path: info.outputPath(`${material}-${palette}-${width}.png`),
          fullPage: true,
        });
        await page.getByRole("checkbox", { name: "Motion", exact: true }).check();
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(page.locator('[data-kind-ui="line-frame"][data-motion="off"]')).toHaveCount(4);
        await page.emulateMedia({ reducedMotion: "no-preference" });
      }
    }
  });
}

test("native boolean/default shapes retain finishes and subpixel areas remain native without a minimum-effect substitution", async ({
  page,
}, info) => {
  await page.goto(url);
  const finished = page.getByRole("application", { name: "Finished symbols" });
  const native = page.getByRole("application", { name: "Native symbols" });
  for (let option = 0; option < 4; option++) {
    if (option > 0)
      await page.getByRole("button", { name: "Native defaults", exact: true }).click();
    for (const material of ["paper", "clay", "glow"] as const) {
      await page.getByRole("button", { name: material, exact: true }).click();
      await expect(finished.locator('[data-kind-ui="scatter-material"]')).toHaveCount(7);
      expect(await finished.locator("path#medium").getAttribute("d")).toBe(
        await native.locator("path#medium").getAttribute("d"),
      );
      await finished.locator("path#medium").hover();
      await expect(finished.locator("path#medium")).toHaveAttribute("filter", /kind-ui-scatter/);
      await expect(finished.locator(".recharts-active-shape")).toHaveCount(option < 2 ? 1 : 0);
      await page.mouse.move(0, 0);
    }
  }
  await page.getByRole("button", { name: "Subpixel", exact: true }).click();
  await page.getByRole("button", { name: "plain", exact: true }).click();
  const mark = finished.locator("path#zero");
  expect(await mark.getAttribute("d")).toBe(await native.locator("path#zero").getAttribute("d"));
  const box = await mark.boundingBox();
  if (!box) throw new Error("Missing subpixel symbol");
  expect(box.width).toBeLessThan(1);
  expect(box.height).toBeLessThan(1);
  await page.addStyleTag({
    content: `html, body { background: transparent !important; } svg text, svg line, ${paths} { visibility: hidden; } path#zero { visibility: visible !important; }`,
  });
  const clip = { x: Math.floor(box.x - 5), y: Math.floor(box.y - 5), width: 12, height: 12 };
  const plain = await pixels(page, await page.screenshot({ clip, omitBackground: true }));
  for (const material of ["paper", "clay", "glow"] as const) {
    await page.getByRole("button", { name: material, exact: true }).click();
    expect(await mark.getAttribute("d")).toBe(await native.locator("path#zero").getAttribute("d"));
    expect(await mark.getAttribute("transform")).toBe(
      await native.locator("path#zero").getAttribute("transform"),
    );
    const finishedPixels = await pixels(
      page,
      await page.screenshot({
        clip,
        omitBackground: true,
        path: info.outputPath(`${material}-subpixel.png`),
      }),
    );
    for (let i = 3; i < plain.length; i += 4) {
      if ((plain[i] ?? 0) > 0 || material !== "glow")
        expect(Math.abs((finishedPixels[i] ?? 0) - (plain[i] ?? 0))).toBeLessThanOrEqual(1);
      else
        expect(finishedPixels[i] ?? 0).toBeLessThanOrEqual(
          Math.ceil(255 * 0.35 * 0.8 * 0.6 * 0.65),
        );
    }
  }
});

for (const paint of ["transparent-gradient", "stroke-only"] as const) {
  test(`Glow excludes native geometric interior for ${paint} paint and retains independently custom active ownership`, async ({
    page,
  }, info) => {
    await page.goto(url);
    if (paint === "transparent-gradient") {
      await page.getByRole("button", { name: "Gradient", exact: true }).click();
      await page.getByRole("button", { name: "Transparent gradient", exact: true }).click();
    } else await page.getByRole("button", { name: "Stroke only", exact: true }).click();
    const chart = page.getByRole("application", { name: "Finished symbols" });
    const mark = chart.locator("path#largest");
    const box = await mark.boundingBox();
    if (!box) throw new Error("Missing native symbol");
    const clip = {
      x: Math.floor(box.x - 12),
      y: Math.floor(box.y - 12),
      width: Math.ceil(box.width + 25),
      height: Math.ceil(box.height + 25),
    };
    await page.addStyleTag({
      content: `html, body { background: transparent !important; } svg text, svg line, ${paths} { visibility: hidden; } [data-alpha-proof] { visibility: visible !important; }`,
    });
    await mark.evaluate((n) => n.setAttribute("data-alpha-proof", ""));
    const plain = await pixels(page, await page.screenshot({ clip, omitBackground: true }));
    const saved = await mark.evaluate((n) => {
      const saved = ["fill", "stroke", "opacity", "fill-opacity", "stroke-opacity", "style"].map(
        (a) => [a, n.getAttribute(a)],
      );
      for (const [a, v] of [
        ["fill", "#fff"],
        ["stroke", "#fff"],
        ["opacity", "1"],
        ["fill-opacity", "1"],
        ["stroke-opacity", "1"],
        ["style", "opacity: 1"],
      ])
        n.setAttribute(a ?? "", v ?? "");
      return saved;
    });
    const geometry = await pixels(page, await page.screenshot({ clip, omitBackground: true }));
    await mark.evaluate((n, saved) => {
      for (const [a, v] of saved) {
        if (a) {
          if (v === null) n.removeAttribute(a);
          else n.setAttribute(a, v ?? "");
        }
      }
    }, saved);
    await page.getByRole("button", { name: "glow", exact: true }).click();
    await mark.evaluate((n) => n.setAttribute("data-alpha-proof", ""));
    const glow = await pixels(
      page,
      await page.screenshot({
        clip,
        omitBackground: true,
        path: info.outputPath(`${paint}-glow.png`),
      }),
    );
    let zeroInterior = 0,
      exterior = 0;
    for (let i = 3; i < plain.length; i += 4) {
      const a = plain[i] ?? 0,
        g = geometry[i] ?? 0,
        b = glow[i] ?? 0;
      if (a > 0 || g === 255) expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
      if (a === 0 && g === 255) zeroInterior++;
      if (g === 0 && b > 0) exterior++;
    }
    expect(zeroInterior).toBeGreaterThan(0);
    expect(exterior).toBeGreaterThan(0);
    if (paint === "stroke-only")
      await page.getByRole("button", { name: "Stroke only", exact: true }).click();
    await page.addStyleTag({ content: `${paths} { visibility: visible !important; }` });
    for (const owner of ["function", "element", "object"]) {
      await page.getByRole("button", { name: "Active owner", exact: true }).click();
      // The normal native symbol remains finished while an independently custom active renderer owns its pipeline.
      await page.mouse.move(0, 0);
      await expect(chart.locator("path#medium")).toHaveAttribute("filter", /kind-ui-scatter/);
      await chart.locator("path#medium").hover();
      const active = chart.locator(".recharts-active-shape path:not(defs path)");
      await expect(active).toHaveCount(1);
      await expect(active).not.toHaveAttribute("filter");
      if (owner === "object") await expect(active).toHaveAttribute("fill", "red");
    }
  });
}
