import { expect, test } from "@playwright/test";

test.use({ video: "on" });

const widths = [320, 339, 359, 360, 375, 640, 641, 767, 768, 769, 1024, 1280, 1440, 1920, 2560];

type Sample = {
  height: number;
  installY: number;
  lines: number;
  overflow: number;
  width: number;
  beforeX: number;
  afterX: number;
  labels: string[];
  wordRows: number[];
};

async function prepare(page: import("@playwright/test").Page) {
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  // Finish the hero's entrance before checking label-driven movement.
  await expect(page.locator(".kind-hero-copy")).toHaveCSS("transform", "none");
  // Exercise every combination through the real buttons without random advances.
  await page.locator(".brand-pill").evaluateAll((buttons) => {
    for (const button of buttons)
      button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  });
}

async function record(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const samples: Sample[] = [];
    let running = true;
    const sample = () => {
      if (!running) return;
      const headline = document.querySelector<HTMLElement>("#hero-title")!;
      const tops: number[] = [];
      const wordRows: number[] = [];
      const walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement!;
        if (!node.textContent?.trim() || parent.closest(".brand-pill-face, [aria-hidden='true']"))
          continue;
        const range = document.createRange();
        for (const word of node.textContent!.matchAll(/\S+/g)) {
          range.setStart(node, word.index!);
          range.setEnd(node, word.index! + word[0].length);
          wordRows.push(range.getBoundingClientRect().top);
        }
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (
            rect.width > 0 &&
            !tops.some(
              (top) =>
                Math.abs(top - rect.top) <
                Number.parseFloat(getComputedStyle(headline).lineHeight) / 2,
            )
          )
            tops.push(rect.top);
        }
      }
      samples.push({
        height: headline.getBoundingClientRect().height,
        installY: document.querySelector(".hero-install")!.getBoundingClientRect().top,
        lines: tops.length,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        width: document.querySelector(".brand-pill-stack")!.getBoundingClientRect().width,
        beforeX: document.querySelector(".hero-stack-phrase")!.getBoundingClientRect().left,
        afterX: document.querySelector(".hero-ready-words")!.getBoundingClientRect().left,
        wordRows,
        labels: [...headline.querySelectorAll(".brand-pill-sizer")].map(
          (node) => node.textContent!,
        ),
      });
      requestAnimationFrame(sample);
    };
    sample();
    const target = window as typeof window & { stopHeroRecording: () => Sample[] };
    target.stopHeroRecording = () => {
      running = false;
      return samples;
    };
  });
}

async function stop(page: import("@playwright/test").Page) {
  return page.evaluate(() =>
    (window as typeof window & { stopHeroRecording: () => Sample[] }).stopHeroRecording(),
  );
}

for (const width of widths) {
  test(`headline flows without row jumps through every label combination at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await prepare(page);
    await record(page);
    // 2 frameworks × 2 stacks × 5 agents, including the widest combination.
    for (let framework = 0; framework < 2; framework++) {
      for (let stack = 0; stack < 2; stack++) {
        for (let agent = 0; agent < 5; agent++) {
          await page.waitForTimeout(550);
          await page
            .locator(".brand-pill-agent")
            .evaluate((button: HTMLButtonElement) => button.click());
        }
        await page
          .locator(".brand-pill-stack")
          .evaluate((button: HTMLButtonElement) => button.click());
      }
      await page
        .locator(".brand-pill-framework")
        .evaluate((button: HTMLButtonElement) => button.click());
    }
    await page.waitForTimeout(550);
    const samples = await stop(page);
    await testInfo.attach("continuous-hero-geometry", {
      body: JSON.stringify(samples),
      contentType: "application/json",
    });
    expect(samples.length).toBeGreaterThan(100);
    expect(
      Math.max(...samples.map((s) => s.height)) - Math.min(...samples.map((s) => s.height)),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.max(...samples.map((s) => s.installY)) - Math.min(...samples.map((s) => s.installY)),
    ).toBeLessThanOrEqual(1);
    expect([...new Set(samples.map((s) => s.lines))]).toEqual([
      width >= 768 ? 2 : width >= 641 ? 3 : width >= 360 ? 4 : 5,
    ]);
    for (const sample of samples) {
      expect(sample.wordRows).toHaveLength(samples[0].wordRows.length);
      for (const [index, top] of sample.wordRows.entries()) {
        expect(Math.abs(top - samples[0].wordRows[index])).toBeLessThanOrEqual(1);
      }
    }
    expect(Math.max(...samples.map((s) => s.overflow))).toBeLessThanOrEqual(0);
    expect(new Set(samples.map((s) => s.labels.join("|"))).size).toBe(20);
    for (const [index, count] of [2, 2, 5].entries()) {
      expect(new Set(samples.map((s) => s.labels[index])).size).toBe(count);
    }
  });
}

test("a resizing pill continuously pushes adjacent inline text in both directions", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page);
  await record(page);
  await page.locator(".brand-pill-stack").evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(700);
  const samples = await stop(page);
  await testInfo.attach("inline-push-geometry", {
    body: JSON.stringify(samples),
    contentType: "application/json",
  });
  const first = samples[0];
  const last = samples[samples.length - 1];
  expect(first.width - last.width).toBeGreaterThan(15);
  expect(new Set(samples.map((s) => Math.round(s.width * 10))).size).toBeGreaterThan(8);
  for (const sample of samples) {
    const halfWidthDelta = (sample.width - first.width) / 2;
    expect(Math.abs(sample.beforeX - first.beforeX + halfWidthDelta)).toBeLessThan(1);
    expect(Math.abs(sample.afterX - first.afterX - halfWidthDelta)).toBeLessThan(1);
  }
});

test("longest labels retain their fit across viewport changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await prepare(page);
  const agent = page.locator(".brand-pill-agent");
  for (let index = 0; index < 4; index++) await agent.click();
  await expect(agent.locator(".brand-pill-face")).toHaveText("🤖your agents");
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    for (const button of await page.locator(".brand-pill").all()) {
      await expect
        .poll(() =>
          button.evaluate((element) => {
            const face = element.querySelector(".brand-pill-face")!.getBoundingClientRect();
            const outer = element.getBoundingClientRect();
            const padding = Number.parseFloat(getComputedStyle(element).paddingRight);
            return face.left >= outer.left + padding - 1 && face.right <= outer.right - padding + 1;
          }),
        )
        .toBe(true);
    }
  }
});

test("late local fonts preserve two rows with the longest labels", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const fontGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\.(?:ttf|woff2?)(?:\?|$)/, async (route) => {
    await fontGate;
    await route.continue();
  });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".brand-pill-agent")).toBeVisible();
  for (let index = 0; index < 4; index++) {
    await page.locator(".brand-pill-agent").evaluate((button: HTMLButtonElement) => button.click());
  }
  await expect(page.locator(".brand-pill-agent .brand-pill-face")).toHaveText("🤖your agents");
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loading");
  await record(page);
  release();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const samples = await stop(page);
  expect(new Set(samples.map((s) => s.lines))).toEqual(new Set([2]));
  expect(Math.max(...samples.map((s) => s.overflow))).toBeLessThanOrEqual(0);
  expect(
    Math.max(...samples.map((s) => s.height)) - Math.min(...samples.map((s) => s.height)),
  ).toBeLessThanOrEqual(1);
});
