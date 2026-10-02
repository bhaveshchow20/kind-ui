import { expect, type Page, test } from "./browser";

// Temporary diagnostic: no runtime instrumentation or replacement browser APIs.
async function observe(page: Page) {
  await page.addInitScript(() => {
    const records: unknown[] = [];
    const identities = new WeakMap<Node, number>();
    let sequence = 0;
    const id = (node: Node) => {
      if (!identities.has(node)) identities.set(node, ++sequence);
      return identities.get(node);
    };
    const record = (type: string, details: object) =>
      records.push({ type, t: performance.now(), ...details });
    const tips = (node: Node) =>
      node instanceof Element
        ? [
            ...(node.matches('[data-kind-ui="tooltip-motion"]') ? [node] : []),
            ...node.querySelectorAll('[data-kind-ui="tooltip-motion"]'),
          ]
        : [];
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes)
            for (const tip of tips(node))
              record("mount", {
                id: id(tip),
                style: tip.getAttribute("style"),
                text: tip.textContent,
              });
          for (const node of mutation.removedNodes)
            for (const tip of tips(node))
              record("unmount", { id: id(tip), style: tip.getAttribute("style") });
        } else if (
          mutation.target instanceof HTMLElement &&
          mutation.target.dataset.kindUi === "tooltip-motion"
        ) {
          record("transform", {
            id: id(mutation.target),
            style: mutation.target.style.transform,
            previous: mutation.oldValue,
          });
        }
      }
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["style"],
    });
    document.fonts.addEventListener("loading", () => record("fonts", { status: "loading" }));
    document.fonts.addEventListener("loadingdone", () => record("fonts", { status: "loaded" }));
    document.addEventListener(
      "mousemove",
      (event) => {
        const wrapper = (event.target as Element).closest(".recharts-wrapper");
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        record("native-move", {
          x: event.clientX,
          y: event.clientY,
          chartX: rect.x,
          chartY: rect.y,
          chartWidth: rect.width,
        });
        requestAnimationFrame(() => {
          const next = wrapper.getBoundingClientRect();
          record("move-raf", { chartX: next.x, chartY: next.y, chartWidth: next.width });
        });
      },
      true,
    );
    Object.assign(window, {
      __barRecords: records,
      __barSnapshot: (step: string, chart: Element) => {
        const tip = chart?.querySelector('[data-kind-ui="tooltip-motion"]');
        const frame = chart?.querySelector('[data-kind-ui="tooltip-frame"]');
        const wrapper = chart?.querySelector(".recharts-wrapper");
        const rect = wrapper?.getBoundingClientRect();
        const data = {
          step,
          id: tip ? id(tip) : null,
          style: tip?.getAttribute("style"),
          computed: tip ? getComputedStyle(tip).transform : null,
          text: tip?.textContent,
          frameWidth: frame?.getBoundingClientRect().width,
          bars: [...chart.querySelectorAll(".recharts-bar-rectangle path")].map((bar) => {
            const rect = bar.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }),
          chartX: rect?.x,
          chartY: rect?.y,
          chartWidth: rect?.width,
          fonts: document.fonts.status,
          motion: document.querySelector("main")?.getAttribute("data-motion"),
        };
        record("step", data);
        return data;
      },
    });
  });
}
async function snapshot(page: Page, step: string) {
  await page.getByRole("region", { name: "Vertical", exact: true }).evaluate((chart, step) => {
    (
      window as unknown as { __barSnapshot: (step: string, chart: Element) => unknown }
    ).__barSnapshot(step, chart);
  }, step);
}
test.afterEach(async ({ page }, info) => {
  const records = await page.evaluate(
    () => (window as unknown as { __barRecords: unknown[] }).__barRecords,
  );
  await info.attach("bar-return-events", {
    body: JSON.stringify(records, null, 2),
    contentType: "application/json",
  });
  console.log("[bar-return-events]", JSON.stringify(records));
});
test("bar tooltip retargets and settles mid-flight when reduced motion or explicit off changes", async ({
  page,
}, info) => {
  await page.clock.install();
  // Keep the 80 ms retarget observations independent of time spent in browser calls.
  await page.clock.pauseAt(new Date());
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await observe(page);
  await page.goto("/bars.html");
  await page.getByLabel("Motion", { exact: true }).check();
  await page.clock.runFor(1100);
  const chart = page.getByRole("region", { name: "Vertical", exact: true });
  const bars = chart.locator(".recharts-bar-rectangle path");
  const start = await bars.first().boundingBox(),
    end = await bars.last().boundingBox();
  if (!start || !end) throw new Error("Expected nonzero bars");
  const tip = chart.locator('[data-kind-ui="tooltip-motion"]');
  const readX = () => tip.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41);
  await page.mouse.move(start.x + start.width / 2, start.y + 10);
  await page.clock.runFor(1500);
  const firstX = await readX();
  await snapshot(page, "first-settled");
  await page.mouse.move(end.x + end.width / 2, end.y + 10);
  await page.clock.runFor(80);
  const outboundX = await readX();
  await snapshot(page, "outbound-80");
  expect(outboundX).toBeGreaterThan(firstX);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "off");
  await page.clock.runFor(32);
  const finalX = await readX();
  await snapshot(page, "reduced-32");
  const chartBox = await chart.locator(".recharts-wrapper").boundingBox();
  const frameBox = await chart.locator('[data-kind-ui="tooltip-frame"]').boundingBox();
  if (!chartBox || !frameBox) throw new Error("Expected chart and tooltip bounds");
  const targetX = Math.max(
    0,
    Math.min(Math.round(end.x + end.width / 2 - chartBox.x) + 12, chartBox.width - frameBox.width),
  );
  expect(finalX).toBeCloseTo(targetX, 1);
  expect(outboundX).toBeLessThan(finalX);
  expect(finalX).toBeGreaterThan(firstX);
  await page.clock.runFor(1000);
  expect(await readX()).toBe(finalX);
  await expect(chart.getByRole("status")).toContainText("34 tasks");
  await snapshot(page, "before-screenshot");
  await page.screenshot({ path: info.outputPath("bars-hover.png"), fullPage: true });
  await snapshot(page, "after-screenshot");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "on");
  await snapshot(page, "reenabled-before-return");
  await page.mouse.move(start.x + start.width / 2, start.y + 10);
  await page.clock.runFor(80);
  const returningX = await readX();
  await snapshot(page, "return-80");
  expect(returningX).toBeGreaterThan(firstX);
  expect(returningX).toBeLessThan(finalX);
  await page
    .getByLabel("Motion", { exact: true })
    .evaluate((node) => (node as HTMLInputElement).click());
  await page.clock.runFor(32);
  expect(await readX()).toBeCloseTo(firstX, 1);
});

test("diagnostic new tooltip origin at 80 ms", async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await observe(page);
  await page.goto("/bars.html");
  await page.getByLabel("Motion", { exact: true }).check();
  await page.clock.runFor(1100);
  await snapshot(page, "new-before-hover");
  const bar = await page
    .getByRole("region", { name: "Vertical", exact: true })
    .locator(".recharts-bar-rectangle path")
    .first()
    .boundingBox();
  if (!bar) throw new Error("Expected first bar");
  await page.mouse.move(bar.x + bar.width / 2, bar.y + 10);
  await page.clock.runFor(80);
  await snapshot(page, "new-hover-80");
});
