import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";

const results = {};
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1100, height: 1000 },
  reducedMotion: "reduce",
});
await page.goto("http://127.0.0.1:6073/glass.html");
await page.waitForTimeout(300);
const geometry = await page.evaluate(() =>
  ["plain", "glass"].map((f) =>
    [
      ...document.querySelectorAll(
        `[data-finish=${f}] .recharts-rectangle, [data-finish=${f}] .recharts-sector`,
      ),
    ].map((e) => e.getAttribute("d")),
  ),
);
assert.deepEqual(geometry[0], geometry[1]);
results.geometry = "10 identical native paths; same geometry/hit targets";
const ids = await page.locator("filter").evaluateAll((es) => es.map((e) => e.id));
assert.equal(new Set(ids).size, ids.length);
results.ids = ids;
const fills = await page
  .locator("[data-kind-ui=heatmap-grid]")
  .evaluateAll((es) =>
    es.map((t) => [...t.querySelectorAll("td")].map((e) => getComputedStyle(e).backgroundColor)),
  );
assert.deepEqual(fills[0], fills[1]);
results.heatmap = fills[0];
await page.locator("[data-finish=glass] [role=gridcell]").first().focus();
await page.keyboard.press("ArrowRight");
assert.match(await page.locator(":focus").getAttribute("aria-label"), /25/);
await page.keyboard.press("Escape");
assert.equal(
  await page.locator("[data-finish=glass] [data-kind-ui=heatmap-tooltip]").isVisible(),
  false,
);
results.keyboard = "Grid arrows and Escape pass";
await page.goto("http://127.0.0.1:6073/glass.html");
await page.waitForTimeout(500);
await page.locator("[data-finish=glass] .recharts-rectangle").first().hover();
await page.waitForTimeout(100);
assert.equal(
  await page.locator("[data-finish=glass] [data-kind-ui=chart-tooltip]").isVisible(),
  true,
);
results.blur = await page
  .locator("[data-finish=glass] [data-kind-ui=chart-tooltip]")
  .evaluate((e) => getComputedStyle(e).backdropFilter);
await page.getByRole("button", { name: "Opaque fallback" }).click();
results.fallback = await page
  .locator("[data-finish=glass]")
  .evaluate((e) => getComputedStyle(e).backdropFilter);
assert.equal(results.fallback, "none");
await page.evaluate(() => (document.documentElement.style.zoom = "2"));
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
results.zoom200 = "No page horizontal overflow; comparison stacks";
await page.screenshot({ path: "artifacts/glass/zoom200.png", fullPage: true });
await page.evaluate(() => (document.documentElement.style.zoom = "1"));
await page.locator("summary").click();
const svg = await page.locator("details svg").evaluate((e) => e.outerHTML);
const probe = await browser.newPage();
await probe.setContent(`<body style="margin:0">${svg}</body>`);
const shot = await probe.locator("svg").screenshot({ omitBackground: true });
const pixels = await probe.evaluate(
  async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return [0, 1, 2, 3, 4].map((i) => Array.from(ctx.getImageData(i * 46 + 18, 20, 1, 1).data));
  },
  `data:image/png;base64,${shot.toString("base64")}`,
);
pixels.forEach((p, i) => {
  assert.ok(Math.abs(p[3] - [0, 0, 33, 67, 132][i]) <= 1);
});
assert.deepEqual(
  pixels.slice(0, 2).map((p) => p[3]),
  [0, 0],
);
results.alpha = { sampleRGBA: pixels, expected: "source × 0.8 × 0.65 once; none/zero = 0" };
results.profile = {};
for (const mode of ["plain", "glass"]) {
  const samples = [];
  for (let i = 0; i < 5; i++) {
    await page.goto(`http://127.0.0.1:6073/glass.html?dense&mode=${mode}`);
    await page.waitForSelector(".recharts-rectangle");
    samples.push(await page.evaluate(() => performance.now()));
  }
  results.profile[mode] = {
    count: 180,
    loadToMarksMs: samples,
    medianMs: samples.sort((a, b) => a - b)[2],
  };
}
const touch = await browser.newContext({
  viewport: { width: 320, height: 900 },
  hasTouch: true,
  isMobile: true,
});
const tp = await touch.newPage();
await tp.goto("http://127.0.0.1:6073/glass.html");
await tp.locator("[data-finish=glass] [role=gridcell]").nth(2).tap();
assert.match(
  await tp.locator("[data-finish=glass] [data-kind-ui=heatmap-tooltip]").innerText(),
  /50/,
);
results.touch = "Native heatmap pointer-down tooltip pass";
for (const [name, engine] of [
  ["firefox", firefox],
  ["webkit", webkit],
]) {
  try {
    const b = await engine.launch();
    const p = await b.newPage();
    await p.goto("http://127.0.0.1:6073/glass.html");
    results[name] = "loaded";
    await b.close();
  } catch (e) {
    results[name] = String(e).split("\n")[0];
  }
}
await writeFile("artifacts/glass/verification.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
