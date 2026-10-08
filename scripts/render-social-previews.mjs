import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const root = new URL("../apps/showcase/public/", import.meta.url);
const data = (path, type) =>
  `data:${type};base64,${readFileSync(new URL(path, root)).toString("base64")}`;
const cloud = data("footer-clouds.webp", "image/webp");
const blossom = data("cherry-blossom.png", "image/png");
const fonts = `@font-face{font-family:Geist;src:url(${data("fonts/geist-variable.ttf", "font/ttf")});font-weight:100 900}@font-face{font-family:Mono;src:url(${data("fonts/geist-mono-variable.ttf", "font/ttf")})}`;
const css = `${fonts}\n${readFileSync(new URL("social-preview.css", import.meta.url), "utf8")}`;
const arrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const brand = () =>
  `<div class="brand"><img src="${blossom}" alt="Kind UI blossom"><div class="wordmark">kind<span>ui</span><b class="slash">/</b>charts</div></div>`;
const bar = `<svg class="chart" viewBox="0 0 262 147"><path class="grid" d="M0 16H262M0 62H262M0 108H262"/>${[38, 65, 55, 87, 79, 105, 124].map((h, i) => `<rect x="${i * 38 + 4}" y="${139 - h}" width="23" height="${h}" rx="4" fill="${i === 6 ? "#733bff" : "#4b91ff"}"/>`).join("")}</svg>`;
const area = `<svg class="chart" viewBox="0 0 285 140"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#733bff" stop-opacity=".19"/><stop offset="1" stop-color="#733bff" stop-opacity=".015"/></linearGradient></defs><path class="grid" d="M0 15H285M0 60H285M0 105H285"/><path d="M0 119C25 119 22 87 49 88S78 104 105 84S133 49 162 66S184 94 209 60S254 13 285 18V140H0Z" fill="url(#area)"/><path d="M0 119C25 119 22 87 49 88S78 104 105 84S133 49 162 66S184 94 209 60S254 13 285 18" fill="none" stroke="#733bff" stroke-width="2.8" stroke-linecap="round"/><circle cx="209" cy="60" r="4" fill="#fff" stroke="#733bff" stroke-width="2.4"/></svg>`;
const donut = `<svg class="chart" viewBox="0 0 144 144"><g fill="none" stroke-width="18" transform="rotate(-90 72 72)"><circle cx="72" cy="72" r="51" stroke="#f0edfa"/><circle cx="72" cy="72" r="51" stroke="#733bff" stroke-dasharray="153 321" stroke-linecap="round"/><circle cx="72" cy="72" r="51" stroke="#4b91ff" stroke-dasharray="87 321" stroke-dashoffset="-162" stroke-linecap="round"/><circle cx="72" cy="72" r="51" stroke="#edb866" stroke-dasharray="49 321" stroke-dashoffset="-259" stroke-linecap="round"/></g><text x="72" y="75" text-anchor="middle" font-family="Geist" font-size="27" font-weight="500" fill="#343433">100%</text></svg>`;
const docsChart = `<svg class="chart" viewBox="0 0 452 160"><path class="grid" d="M5 18H450M5 61H450M5 104H450"/><path d="M8 109C67 109 82 58 140 58S207 79 250 73S302 21 355 28S413 31 445 9" fill="none" stroke="#733bff" stroke-width="3" stroke-linecap="round"/>${[
  [8, 109],
  [140, 58],
  [250, 73],
  [355, 28],
  [445, 9],
]
  .map(
    ([x, y]) => `<circle cx="${x}" cy="${y}" r="4" stroke="#733bff" stroke-width="2" fill="#fff"/>`,
  )
  .join(
    "",
  )}<text class="chart-label" x="8" y="149">Jan</text><text class="chart-label" x="130" y="149">Feb</text><text class="chart-label" x="240" y="149">Mar</text><text class="chart-label" x="345" y="149">Apr</text><text class="chart-label" x="424" y="149">May</text></svg>`;
const content = {
  homepage: `<h1 class="headline">Interactive<br>React charts.</h1><div class="tile bars"><div style="height:30px"></div>${bar}</div><div class="tile area"><div style="height:30px"></div>${area}</div><div class="tile donut"><div style="height:25px"></div>${donut}</div>`,
  documentation: `<h1 class="headline">Chart docs.</h1><div class="tile"><div style="height:30px"></div>${docsChart}<div class="code">&lt;<span class="token">Chart.LineChart</span> {...props}&gt;
  &lt;<span class="token">Chart.LineSeries</span> <span class="attr">dataKey</span>=<span class="value">"visitors"</span> /&gt;
&lt;/<span class="token">Chart.LineChart</span>&gt;</div></div>`,
};
const browser = await chromium.launch();
for (const kind of ["homepage", "documentation"]) {
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Kind UI ${kind} social preview</title><style>${css}</style></head><body><main class="canvas ${kind}"><img class="clouds" src="${cloud}" alt=""><div class="wash"></div>${brand()}${content[kind]}<div class="url">kindui.dev/charts${kind === "documentation" ? "/docs" : ""} ${arrow}</div></main></body></html>`;

  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  await page.screenshot({
    path: new URL(
      kind === "homepage"
        ? "../apps/showcase/public/social/homepage-v1.png"
        : "../apps/docs/public/social/documentation-v1.png",
      import.meta.url,
    ).pathname,
  });
  const textOverflow = await page.locator(".headline,.brand,.url,.code").evaluateAll((nodes) =>
    nodes.map((node) => ({
      text: node.textContent.trim(),
      width: node.getBoundingClientRect().width,
      right: node.getBoundingClientRect().right,
      bottom: node.getBoundingClientRect().bottom,
      overflow: node.scrollWidth > node.clientWidth,
    })),
  );
  for (const text of textOverflow) {
    assert.ok(
      !text.overflow && text.right <= 1200 && text.bottom <= 630,
      `Clipped text: ${text.text}`,
    );
  }
  console.log(`${kind}: 1200 × 630 PNG, text fits the canvas`);
  await page.close();
}
await browser.close();
