import { writeFile } from "node:fs/promises";
import { expect, type Locator, test } from "./browser";
import { pieAlphaDifference, pieLivePaint, pieNativeOwnership } from "./pie-native-ownership";

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
    const nativeState = await pieNativeOwnership(chart, { allowEmpty: paint === "transparent" });
    const baseline = await pieLivePaint(
      chart,
      info.outputPath(`native-${paint.replaceAll("&", "-")}.png`),
    );
    const captureBox = await chart.boundingBox();
    const nativeGeometry = await geometry(chart);
    await proof.getByLabel("Oracle finish").selectOption("plain");
    const repeat = await pieNativeOwnership(chart, { allowEmpty: paint === "transparent" });
    expect(repeat.state, `Repeat native state: ${paint}`).toBe(nativeState.state);
    expect(repeat.rgba === nativeState.rgba, `Repeat native RGBA: ${paint}`).toBe(true);
    for (const finish of finishes.slice(1)) {
      await proof.getByLabel("Oracle finish").selectOption(finish);
      expect(await chart.boundingBox(), `Stable alpha capture: ${paint}/${finish}`).toEqual(
        captureBox,
      );
      expect(await geometry(chart), `Live native geometry: ${paint}/${finish}`).toEqual(
        nativeGeometry,
      );
      await chart
        .locator(mark)
        .first()
        .evaluate((n) => n.setAttribute("data-alpha-proof", ""));
      const actual = await pieLivePaint(
        chart,
        info.outputPath(`${finish}-${paint.replaceAll("&", "-")}.png`),
      );
      assertPieAlpha(pieAlphaDifference(baseline, actual, alphaClipBounds(paint)), paint, finish);
    }
  }
});

function alphaClipBounds(paint: string) {
  return paint.includes("clip")
    ? paint.includes("transform")
      ? { left: 142, right: 167.5 }
      : { left: 120, right: 150 }
    : null;
}
function assertPieAlpha(
  difference: ReturnType<typeof pieAlphaDifference>,
  paint: string,
  finish: string,
) {
  expect(difference.bodyMax, `${paint}/${finish}`).toBeLessThanOrEqual(1);
  expect(difference.clippedExteriorMax).toBe(0);
  expect(difference.exteriorMax).toBeLessThanOrEqual(
    finish === "glow" && paint !== "transparent" ? (paint === "opaque" ? 96 : 40) : 1,
  );
  expect(difference.painted > 0).toBe(paint !== "transparent");
  if (paint === "transparent") expect(difference.actualPainted).toBe(0);
}

test("material alpha proof rejects actual source, mask, gradient, clipping and emission defects", async ({
  page,
}) => {
  const controls = [
    ["source-opacity", "paper", "alpha", "bodyMax"],
    ["wrapper-opacity", "clay", "opaque", "bodyMax"],
    ["mask-opacity", "clay", "alpha", "bodyMax"],
    ["gradient-opacity", "clay", "alpha&gradient", "bodyMax"],
    ["source-clip", "paper", "alpha&clip", "clippedExteriorMax"],
    ["glow-source-opacity", "glow", "alpha", "bodyMax"],
    ["halo-clip", "glow", "alpha&clip", "clippedExteriorMax"],
    ["flood-leak", "glow", "transparent", "actualPainted"],
    ["one-byte-transparent-leak", "clay", "transparent", "actualPainted"],
  ] as const;
  for (const [mutation, finish, paint, metric] of controls) {
    await page.goto(`${url}/?oracle&${paint}`);
    const proof = page.getByRole("region", { name: "Continuity proof" });
    const chart = proof.getByRole("application", { name: "Kind continuity" });
    await proof.scrollIntoViewIfNeeded();
    await page.addStyleTag({
      content:
        'html,body,section,[data-kind-ui="chart"] {background:transparent !important;} [data-kind-ui="pie-sector"] {visibility:hidden;} [data-alpha-proof] {visibility:visible !important;}',
    });
    await chart
      .locator(mark)
      .first()
      .evaluate((node) => node.setAttribute("data-alpha-proof", ""));
    const native = await pieLivePaint(chart);
    await proof.getByLabel("Oracle finish").selectOption(finish);
    await chart
      .locator(mark)
      .first()
      .evaluate((node) => node.setAttribute("data-alpha-proof", ""));
    const valid = await pieLivePaint(chart);
    assertPieAlpha(pieAlphaDifference(native, valid, alphaClipBounds(paint)), paint, finish);
    await chart.evaluate((node, mutation) => {
      const svg = node instanceof SVGSVGElement ? node : node.querySelector("svg");
      const source = svg?.querySelector("[data-alpha-proof]");
      const body = source?.parentElement?.parentElement;
      const tree = body?.parentElement;
      if (
        !(svg instanceof SVGSVGElement) ||
        !(source instanceof SVGElement) ||
        !(body instanceof SVGElement) ||
        !(tree instanceof SVGElement)
      )
        throw Error("Expected actual material tree");
      if (mutation === "source-opacity" || mutation === "glow-source-opacity")
        source.style.fillOpacity = "0.8";
      if (mutation === "wrapper-opacity") body.style.opacity = "0.5";
      if (mutation === "mask-opacity") {
        const use = tree.querySelector("mask use");
        if (!(use instanceof SVGElement)) throw Error("Expected actual material mask");
        use.style.opacity = "0.5";
      }
      if (mutation === "gradient-opacity") {
        const stops = svg.querySelectorAll("#host-gradient stop");
        if (!stops.length) throw Error("Expected consumer gradient stops");
        for (const stop of stops) (stop as SVGElement).style.stopOpacity = "0.1";
      }
      if (mutation === "source-clip") source.style.clipPath = "none";
      if (mutation === "halo-clip") {
        const halo = tree.querySelector('[data-kind-ui="pie-halo"]');
        if (!(halo instanceof SVGElement)) throw Error("Expected actual Glow halo");
        halo.style.clipPath = "none";
      }
      if (mutation === "flood-leak") {
        const filter = tree.querySelector("filter");
        if (!filter) throw Error("Expected actual Glow filter");
        const flood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
        flood.setAttribute("flood-color", "red");
        flood.setAttribute("flood-opacity", "1");
        filter.append(flood);
      }
      if (mutation === "one-byte-transparent-leak") {
        const leak = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        for (const [name, value] of Object.entries({
          x: "145",
          y: "135",
          width: "10",
          height: "10",
          fill: "red",
          "fill-opacity": String(1 / 255),
        }))
          leak.setAttribute(name, value);
        tree.append(leak);
      }
    }, mutation);
    const defective = await pieLivePaint(chart);
    const difference = pieAlphaDifference(native, defective, alphaClipBounds(paint));
    expect(difference[metric], `Actual alpha defect: ${mutation}`).toBeGreaterThan(
      metric === "bodyMax" ? 1 : 0,
    );
    if (mutation === "one-byte-transparent-leak") expect(difference.exteriorMax).toBe(1);
    expect(
      () => assertPieAlpha(difference, paint, finish),
      `Production alpha assertions reject ${mutation}`,
    ).toThrow();
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
}, info) => {
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
    // Compare native ownership independently of live-inline Chromium paint-cache drift.
    const native = await pieNativeOwnership(chart);
    await writeFile(
      info.outputPath(`native-ownership-${override}-plain.png`),
      Buffer.from(native.pngBase64, "base64"),
    );
    const captureBox = await chart.boundingBox();
    const nativeGeometry = await geometry(chart);
    const attemptedFinishes = await chart.evaluateHandle((node) => {
      const definitions: string[] = [];
      const observer = new MutationObserver((records) => {
        for (const record of records)
          for (const added of record.addedNodes) {
            if (!(added instanceof Element)) continue;
            const paints = added.matches('[data-kind-ui="pie-material"]')
              ? [added]
              : Array.from(added.querySelectorAll('[data-kind-ui="pie-material"]'));
            for (const paint of paints) definitions.push(paint.getAttribute("data-material") ?? "");
          }
      });
      observer.observe(node, { childList: true, subtree: true });
      return { definitions, observer };
    });
    for (const finish of finishes.slice(1)) {
      await proof.getByLabel("Oracle finish").selectOption(finish);
      await expect(chart.locator('[data-kind-ui="pie-material"]')).toHaveCount(0);
      expect(
        await attemptedFinishes.evaluate(({ definitions }) => definitions),
        `No transient finish: ${override}/${finish}`,
      ).toEqual([]);
      expect(await geometry(chart)).toEqual(nativeGeometry);
      expect(await chart.boundingBox(), `Stable capture: ${override}/${finish}`).toEqual(
        captureBox,
      );
      const actual = await pieNativeOwnership(chart);
      expect(actual.state, `Native topology and resolved paint: ${override}/${finish}`).toBe(
        native.state,
      );
      expect(actual.rgba === native.rgba, `Exact serialized RGBA: ${override}/${finish}`).toBe(
        true,
      );
      await writeFile(
        info.outputPath(`native-ownership-${override}-${finish}.png`),
        Buffer.from(actual.pngBase64, "base64"),
      );
    }
    await attemptedFinishes.evaluate(({ observer }) => observer.disconnect());
    await attemptedFinishes.dispose();
  }
});

test("native ownership oracle rejects paint, geometry, wrappers and resource mutations", async ({
  page,
}) => {
  await page.route("https://example.invalid/**", (route) => route.abort());
  for (const mutation of [
    "fill",
    "fill-opacity",
    "stroke",
    "geometry",
    "svg-transform",
    "css-transform",
    "individual-translate",
    "individual-rotate",
    "individual-scale",
    "css-3d",
    "clip-reference",
    "clip-geometry",
    "filter",
    "mask",
    "wrapper",
    "wrapper-opacity",
    "wrapper-transform",
    "ancestor-opacity",
    "ancestor-transform",
    "decoration",
    "gradient-resource",
    "redirected-reference",
    "broken-reference",
    "external-reference",
    "duplicate-id",
    "consumer-id",
  ]) {
    await page.goto(`${url}/?oracle&alpha&gradient&clip&css-transform`);
    const chart = page.getByRole("application", { name: "Kind continuity" });
    if (mutation === "consumer-id")
      await chart
        .locator(mark)
        .first()
        .evaluate((node) => node.setAttribute("id", "kind-ui-pie-consumer-one-paint"));
    const native = await pieNativeOwnership(chart);
    await chart.evaluate((node, mutation) => {
      const svg = node instanceof SVGSVGElement ? node : node.querySelector("svg");
      const path = svg?.querySelector('[data-kind-ui="pie-sector"]');
      if (!(svg instanceof SVGSVGElement) || !(path instanceof SVGElement))
        throw Error("Expected Pie fixture");
      const group = path.parentElement;
      if (!(group instanceof SVGElement)) throw Error("Expected native source wrapper");
      if (mutation === "consumer-id") path.id = "kind-ui-pie-consumer-two-paint";
      if (mutation === "fill") path.style.fill = "#ff0000";
      if (mutation === "fill-opacity") path.style.fillOpacity = "0.8";
      if (mutation === "stroke") {
        path.style.stroke = "#ff0000";
        path.style.strokeWidth = "8px";
      }
      if (mutation === "geometry") path.setAttribute("d", "M 120 90 L 150 90 L 150 190 Z");
      if (mutation === "svg-transform") path.setAttribute("transform", "translate(8 0)");
      if (mutation === "css-transform") path.style.transform = "translateX(40px)";
      if (mutation === "individual-translate") path.style.translate = "5px 0";
      if (mutation === "individual-rotate") path.style.rotate = "10deg";
      if (mutation === "individual-scale") path.style.scale = "0.95";
      if (mutation === "css-3d") path.style.transform = "translateZ(2px)";
      if (mutation === "clip-reference") path.style.clipPath = "none";
      if (mutation === "clip-geometry")
        svg.querySelector("#host-clip rect")?.setAttribute("width", "20");
      if (mutation === "filter") group.style.filter = "url(#host-filter)";
      if (mutation === "mask") {
        const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
        mask.id = "ownership-negative-mask";
        const rect = document.createElementNS(mask.namespaceURI, "rect");
        rect.setAttribute("width", "300");
        rect.setAttribute("height", "280");
        rect.setAttribute("fill", "white");
        mask.append(rect);
        svg.querySelector("defs")?.append(mask);
        group.style.mask = "url(#ownership-negative-mask)";
      }
      if (mutation === "wrapper") {
        const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.replaceChild(wrapper, path);
        wrapper.append(path);
      }
      if (mutation === "wrapper-opacity") group.style.opacity = "0.5";
      if (mutation === "wrapper-transform") group.setAttribute("transform", "translate(5 0)");
      if (mutation === "ancestor-opacity") svg.parentElement?.style.setProperty("opacity", "0.5");
      if (mutation === "ancestor-transform")
        svg.parentElement?.style.setProperty("transform", "translateX(5px)");
      if (mutation === "decoration") {
        const extra = path.cloneNode(true);
        if (!(extra instanceof SVGElement)) throw Error("Expected cloned path");
        extra.removeAttribute("id");
        group.append(extra);
      }
      if (mutation === "gradient-resource")
        svg.querySelector("#host-gradient stop")?.setAttribute("stop-color", "#00ff00");
      if (mutation === "redirected-reference") path.style.clipPath = "url(#host-filter)";
      if (mutation === "broken-reference") path.style.clipPath = "url(#ownership-missing)";
      if (mutation === "external-reference")
        path.style.fill = "url(https://example.invalid/paint.svg#color)";
      if (mutation === "duplicate-id")
        svg.querySelector("#host-gradient")?.setAttribute("id", "host-clip");
    }, mutation);
    if (["broken-reference", "external-reference", "duplicate-id"].includes(mutation)) {
      await expect(pieNativeOwnership(chart), mutation).rejects.toThrow(/fixture (resource|ID)/);
      continue;
    }
    const changed = await pieNativeOwnership(chart);
    expect(changed.state, `Ownership rejects ${mutation}`).not.toBe(native.state);
    // A neutral wrapper proves structure is checked independently of pixels.
    if (mutation === "wrapper") expect(changed.rgba).toBe(native.rgba);
    if (
      [
        "gradient-resource",
        "clip-geometry",
        "fill",
        "fill-opacity",
        "ancestor-opacity",
        "filter",
        "css-transform",
        "wrapper-transform",
      ].includes(mutation)
    )
      expect(changed.rgba === native.rgba, `Serialized resource mutation: ${mutation}`).toBe(false);
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
    const native = await pieNativeOwnership(chart);
    await proof.getByLabel("Oracle finish").selectOption("clay");
    await expect(definitions).toHaveCount(0);
    const actual = await pieNativeOwnership(chart);
    expect(actual.state).toBe(native.state);
    expect(actual.rgba === native.rgba, "Exact serialized native lifecycle RGBA").toBe(true);
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
  await page.evaluate(() => document.fonts.ready);
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
            if (document.elementFromPoint(screen.x, screen.y) === node) {
              const bounds = node.getBoundingClientRect();
              return { x: screen.x - bounds.left, y: screen.y - bounds.top };
            }
          }
        return undefined;
      });
      return interior !== undefined;
    })
    .toBeTruthy();
  if (!interior) throw Error("No hittable native slice interior");
  await slice.click({ position: interior });
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

for (const accessor of [false, true]) {
  test(`selective glow follows category identity and native ownership (${accessor ? "accessor" : "field"})`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${url}/?selective${accessor ? "&accessor" : ""}`);
    const response = await page.request.get(new URL("./ssr.json", page.url()).href);
    expect(response.ok()).toBeTruthy();
    const shells: { field: string; accessor: string } = await response.json();
    const markup = shells[accessor ? "accessor" : "field"];
    expect(typeof markup).toBe("string");
    expect(markup).not.toContain("pie-halo");
    const charts = page.getByRole("application", { name: /Selective glow/ });
    const first = charts.first();
    const halos = first.locator('[data-kind-ui="pie-halo"]');
    const allocation = page.getByRole("table", { name: "Glow allocation" });
    await expect(halos).toHaveCount(2);
    const native = await geometry(first);
    const table = await allocation.innerText();
    const glowing = () =>
      first
        .locator('[data-kind-ui="pie-halo"] + g path')
        .evaluateAll((paths) => paths.map((p) => p.getAttribute("data-category")));
    expect(await glowing()).toEqual(["beta", "alpha"]);
    await page.getByRole("button", { name: "Toggle glow" }).click();
    await expect(halos).toHaveCount(0);
    expect(await geometry(first)).toEqual(native);
    expect(await allocation.innerText()).toBe(table);
    await page.getByRole("button", { name: "Toggle glow" }).click();
    await expect(halos).toHaveCount(2);
    for (const finish of ["paper", "clay", "glow", "plain"]) {
      await page.getByLabel("Base finish").selectOption(finish);
      await expect(first.locator('[data-kind-ui="pie-material"]')).toHaveCount(
        finish === "plain" ? 2 : 4,
      );
      await expect(halos).toHaveCount(finish === "glow" ? 4 : 2);
      expect(await geometry(first)).toEqual(native);
    }
    await page.getByRole("button", { name: "Reorder glow" }).click();
    await expect(halos).toHaveCount(2);
    expect(await glowing()).toEqual(["beta", "alpha"]);
    await page.getByRole("button", { name: "Filter beta" }).click();
    await expect(halos).toHaveCount(1);
    expect(await glowing()).toEqual(["alpha"]);
    await page.getByRole("button", { name: "Filter beta" }).click();
    await expect(halos).toHaveCount(2);
    // Each chart/series/sector owns its resource IDs after filtering/remounting.
    const ids = await charts
      .locator('[data-kind-ui="pie-material"] filter')
      .evaluateAll((nodes) => nodes.map((n) => n.id));
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(
      await charts
        .locator('[data-kind-ui="pie-halo"] use')
        .evaluateAll((nodes) =>
          nodes.every((n) => document.getElementById((n.getAttribute("href") ?? "").slice(1))),
        ),
    ).toBe(true);
    const paint = await geometry(first);
    expect(await sectorContrast(first)).toBeGreaterThanOrEqual(3);
    await page.screenshot({ path: info.outputPath("selective-glow-light.png") });
    await page.getByRole("button", { name: "Theme", exact: true }).click();
    expect(await geometry(first)).toEqual(paint);
    expect(await sectorContrast(first)).toBeGreaterThanOrEqual(3);
    await page.screenshot({ path: info.outputPath("selective-glow-dark.png") });
    await page.emulateMedia({ forcedColors: "active" });
    await expect(allocation).toContainText("beta");
    await expect(allocation).toContainText("40");
    await page.emulateMedia({ forcedColors: "none" });
    for (const owner of ["filter", "shape"]) {
      await page.getByLabel("Paint owner").selectOption(owner);
      await expect(halos).toHaveCount(0);
    }
    await page.getByLabel("Paint owner").selectOption("none");
    await expect(halos).toHaveCount(2);
    // Real pointer/keyboard inspection remains native and does not select glow IDs.
    await first.locator('[data-category="beta"]').first().click();
    await expect(page.getByLabel("Glow event")).toHaveText("beta");
    await page.mouse.move(0, 0, { steps: 10 });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(first).toBeFocused();
    const tooltip = page
      .locator('[data-kind-ui="chart"]')
      .first()
      .locator('[data-kind-ui="chart-tooltip"]');
    await expect(tooltip).toContainText("Alpha");
    await expect(tooltip).toContainText("60");
    await page.getByLabel("Paint owner").selectOption("active");
    await first.locator('[data-category="beta"]').first().hover();
    await expect(first.locator('[data-host-shape][data-category="beta"]')).not.toHaveCount(0);
    await expect(halos).toHaveCount(1);
    expect(await allocation.innerText()).toContain("60");
    expect(errors).toEqual([]);
  });
}

async function sectorContrast(chart: Locator) {
  return chart.locator('[data-kind-ui="pie-sector"]').evaluateAll((paths) => {
    const luminance = (color: string) => {
      const channels = color
        .match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number);
      if (channels?.length !== 3) throw new Error(`Unresolved color: ${color}`);
      const linear = channels.map((value) => {
        const c = value / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return (linear[0] ?? 0) * 0.2126 + (linear[1] ?? 0) * 0.7152 + (linear[2] ?? 0) * 0.0722;
    };
    return Math.min(
      ...paths.map((path) => {
        const root = path.closest('[data-kind-ui="chart"]');
        if (!root) throw new Error("Missing Pie background");
        const fill = luminance(getComputedStyle(path).fill);
        const background = luminance(getComputedStyle(root).backgroundColor);
        return (Math.max(fill, background) + 0.05) / (Math.min(fill, background) + 0.05);
      }),
    );
  });
}
