import { expect } from "@playwright/test";

export async function expectHiddenPaint(mark) {
  await expect(mark).toHaveCount(1);
  await expect
    .poll(() =>
      mark.evaluate((node) => {
        let opacity = 1;
        for (let part = node; part instanceof SVGElement; part = part.parentElement)
          opacity *= Number(getComputedStyle(part).opacity);
        return opacity;
      }),
    )
    .toBe(0);
  await expect(mark).toHaveCSS("pointer-events", "none");
}

export async function expectDimmedSeries(chart, key) {
  await expect(
    chart.locator(
      `[data-kind-ui="series-interaction"][data-series="${key}"] > [data-kind-ui="series-interaction-paint"]`,
    ),
  ).toHaveCSS("opacity", "0.28");
}
