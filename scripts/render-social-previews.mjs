import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const assets = new URL("../apps/showcase/public/", import.meta.url);
const data = (file, type) =>
  `data:${type};base64,${readFileSync(new URL(file, assets)).toString("base64")}`;
const fonts = `@font-face{font-family:Geist;src:url(${data("fonts/geist-variable.ttf", "font/ttf")});font-weight:100 900}`;
// Static SVGs and heatmap colors captured from Kind UI homepage examples in both themes.
const charts = JSON.parse(
  readFileSync(new URL("social-preview-charts.json", import.meta.url), "utf8"),
);
const css = `${fonts}\n${readFileSync(new URL("social-preview.css", import.meta.url), "utf8")}`;
function unique(svg, prefix) {
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids)
    svg = svg
      .replaceAll(`id="${id}"`, `id="${prefix}-${id}"`)
      .replaceAll(`#${id})`, `#${prefix}-${id})`)
      .replaceAll(`#${id}&quot;`, `#${prefix}-${id}&quot;`)
      .replaceAll(`href="#${id}"`, `href="#${prefix}-${id}"`);
  return svg;
}
function heatmap(theme) {
  const rows = charts[theme].heatmapCells;
  const ink = theme === "light" ? "#888" : "#999";
  let body = "";
  for (let c = 1; c < 6; c++)
    body += `<text x="${66 + (c - 1) * 36 + 16}" y="15" text-anchor="middle">${rows[0][c].text}</text>`;
  for (let r = 1; r < 5; r++) {
    body += `<text x="58" y="${35 + (r - 1) * 33 + 12}" text-anchor="end">${rows[r][0].text}</text>`;
    for (let c = 1; c < 6; c++)
      body += `<rect x="${66 + (c - 1) * 36}" y="${27 + (r - 1) * 33}" width="32" height="29" rx="5" fill="${rows[r][c].background}"/>`;
  }
  return `<svg viewBox="0 0 248 165" xmlns="http://www.w3.org/2000/svg"><g font-family="Geist" font-size="8" fill="${ink}">${body}</g></svg>`;
}
function zoom(svg, family) {
  if (family === "radar") return svg.replace(/viewBox="[^"]+"/, 'viewBox="98 9 304 233"');
  return svg.replace(/viewBox="[^"]+"/, 'viewBox="0 0 505 270"');
}
const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"]) {
    const item = (family, index, n, round = false) =>
      `<div class="card${round ? " round" : ""}">${unique(zoom(charts[theme][family][index], family), `${theme}-${n}`)}</div>`;
    const graph = `<div class="collage"><div class="column">${item("line", 0, 0)}${item("area", 0, 1)}${item("bar", 0, 2)}</div><div class="column"><div class="card">${heatmap(theme)}</div>${item("radar", 0, 4, true)}${item("sankey", 0, 5)}</div></div>`;
    const kind = theme === "light" ? "charts" : "docs";
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body><main class="${theme}"><img class="clouds" src="${data("footer-clouds.webp", "image/webp")}" alt=""><div class="brand"><img src="${data("cherry-blossom.png", "image/png")}" alt="Kind UI"><div class="wordmark">kind<span>ui</span></div></div><h1 class="heading">${theme === "light" ? "Charts" : "Documentation"}</h1><p class="description">Composable, interactive charts <br>for React and Next.js. <br>Designed for builders and AI agents.</p><div class="route">kindui.dev/charts${theme === "dark" ? "/docs" : ""}</div>${graph}</main></body></html>`;
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1,
    });
    await page.setContent(html);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    await page.screenshot({
      path: new URL(
        theme === "light"
          ? "../apps/showcase/public/social/homepage-v1.png"
          : "../apps/docs/public/social/documentation-v1.png",
        import.meta.url,
      ).pathname,
    });
    const bounds = await page.locator(".heading,.description,.brand,.route").evaluateAll((nodes) =>
      nodes.map((n) => ({
        text: n.textContent,
        right: n.getBoundingClientRect().right,
        bottom: n.getBoundingClientRect().bottom,
        overflow: n.scrollWidth > n.clientWidth,
      })),
    );
    for (const text of bounds)
      assert.ok(
        !text.overflow && text.right <= 1200 && text.bottom <= 630,
        `Clipped text: ${text.text}`,
      );
    console.log(`${kind}: 1200 × 630 PNG, text fits the canvas`);
    await page.close();
  }
} finally {
  await browser.close();
}
