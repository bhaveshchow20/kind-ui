import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1100, height: 1000 } });
const report = {};
const read = async (buf, points) =>
  p.evaluate(
    async ({ src, points }) => {
      const im = new Image();
      im.src = src;
      await im.decode();
      const c = document.createElement("canvas");
      c.width = im.width;
      c.height = im.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(im, 0, 0);
      return points.map(([x, y]) =>
        Array.from(ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data),
      );
    },
    { src: `data:image/png;base64,${buf.toString("base64")}`, points },
  );
const lum = (c) =>
  c
    .slice(0, 3)
    .map((v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, c) => (Math.max(lum(a), lum(c)) + 0.05) / (Math.min(lum(a), lum(c)) + 0.05);
for (const theme of ["light", "dark"]) {
  await p.goto(`http://127.0.0.1:6073/glass.html?theme=${theme}`);
  await p.waitForTimeout(400);
  const bar = await p.locator("[data-finish=glass] .recharts-rectangle").first().boundingBox();
  const points = [
    [bar.x + bar.width / 2, bar.y + 40],
    [bar.x - 8, bar.y + 40],
    [bar.x + bar.width / 2, bar.y + 0.8],
  ];
  const cells = await p.locator("[data-finish=glass] [role=gridcell]").all();
  for (const cell of cells) {
    const c = await cell.boundingBox();
    points.push([c.x + c.width * 0.2, c.y + c.height * 0.4]);
  }
  const px = await read(await p.screenshot(), points);
  report[theme] = {
    pixels: px,
    bodyContrast: ratio(px[0], px[1]),
    upperEdgeContrast: ratio(px[2], px[1]),
  };
}
await p.goto("http://127.0.0.1:6073/glass.html");
await p.waitForTimeout(300);
await p.locator("[data-finish=glass] .recharts-rectangle").first().hover();
await p.waitForTimeout(100);
const tip = p.locator("[data-finish=glass] [data-kind-ui=chart-tooltip]");
const one = await tip.screenshot();
await tip.evaluate((e) => {
  e.style.backdropFilter = "none";
  e.style.webkitBackdropFilter = "none";
});
const two = await tip.screenshot();
report.blurVsSameAlphaNoBlur = await p.evaluate(
  async ({ a, b }) => {
    const ims = await Promise.all(
      [a, b].map(async (src) => {
        const i = new Image();
        i.src = src;
        await i.decode();
        return i;
      }),
    );
    const c = document.createElement("canvas");
    c.width = ims[0].width;
    c.height = ims[0].height;
    const ctx = c.getContext("2d");
    const px = ims.map((i) => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(i, 0, 0);
      return ctx.getImageData(0, 0, c.width, c.height).data;
    });
    let changed = 0;
    for (let i = 0; i < px[0].length; i += 4)
      if ([0, 1, 2].some((k) => px[0][i + k] !== px[1][i + k])) changed++;
    return { changedPixels: changed, totalPixels: c.width * c.height };
  },
  {
    a: `data:image/png;base64,${one.toString("base64")}`,
    b: `data:image/png;base64,${two.toString("base64")}`,
  },
);
const cdp = await p.context().newCDPSession(p);
await cdp.send("Emulation.setEmulatedMedia", {
  features: [
    { name: "prefers-reduced-transparency", value: "reduce" },
    { name: "prefers-reduced-motion", value: "reduce" },
  ],
});
report.reducedTransparency = await p
  .locator("[data-finish=glass]")
  .evaluate((e) => ({
    matches: matchMedia("(prefers-reduced-transparency: reduce)").matches,
    blur: getComputedStyle(e).backdropFilter,
    markFilter: getComputedStyle(e.querySelector(".recharts-rectangle")).filter,
  }));
await writeFile("artifacts/glass/pixels.json", JSON.stringify(report, null, 2));
console.log(report);
await b.close();
