import { expect, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const development = `http://127.0.0.1:${4200 + offset}`;
const production = `http://127.0.0.1:${4201 + offset}`;

for (const mode of ["missing", "present", "delayed", "production", "custom"] as const) {
  test(`stylesheet diagnostic: ${mode}, two roots and hydration`, async ({ page }) => {
    const warnings: string[] = [];
    const errors: string[] = [];
    page.on("console", (entry) => {
      if (entry.type() === "warning" && entry.text().startsWith("Kind UI chart styles"))
        warnings.push(entry.text());
      if (entry.type() === "error") errors.push(entry.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    if (mode === "production") {
      await page.addInitScript(() => {
        const original = CSSStyleDeclaration.prototype.getPropertyValue;
        let reads = 0;
        CSSStyleDeclaration.prototype.getPropertyValue = function (name) {
          if (name === "--kind-ui-styles-loaded") reads++;
          return original.call(this, name);
        };
        Object.assign(window, { diagnosticStyleReads: () => reads });
      });
    }
    let release = () => {};
    if (mode === "delayed") {
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route("**/styles.css", async (route) => {
        await gate;
        await route.continue();
      });
    }
    if (mode === "custom") {
      await page.route("**/styles.css", (route) =>
        route.fulfill({
          contentType: "text/css",
          body: '[data-kind-ui="chart"] { --kind-ui-styles-loaded: 1; }',
        }),
      );
    }
    await page.goto(
      `${mode === "production" ? production : development}/${
        ["present", "delayed", "custom"].includes(mode) ? "?styles" : ""
      }`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.locator("body")).toHaveAttribute("data-hydrated", "true");
    await expect(page.locator('[data-kind-ui="chart"]')).toHaveCount(2);
    if (mode === "delayed") {
      await page.waitForTimeout(150);
      expect(warnings).toEqual([]);
      release();
      await expect
        .poll(() =>
          page
            .locator('[data-kind-ui="chart"]')
            .first()
            .evaluate((node) =>
              getComputedStyle(node).getPropertyValue("--kind-ui-styles-loaded").trim(),
            ),
        )
        .toBe("1");
    }
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    if (mode === "missing") {
      await expect.poll(() => warnings.length).toBe(1);
      expect(warnings[0]).toContain('Import "@kind-ui/charts/styles.css" once');
      await page.getByRole("button", { name: "Unmount", exact: true }).click();
      await page.getByRole("button", { name: "Mount", exact: true }).click();
      await expect(page.locator('[data-kind-ui="chart"]')).toHaveCount(2);
      await page.waitForTimeout(100);
      expect(warnings).toHaveLength(1);
    } else expect(warnings).toEqual([]);
    if (mode === "production")
      expect(
        await page.evaluate(() =>
          (window as unknown as { diagnosticStyleReads(): number }).diagnosticStyleReads(),
        ),
      ).toBe(0);
    expect(errors).toEqual([]);
  });
}

test("CSS added after document load delays checks for nested roots", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (entry) => {
    if (entry.text().startsWith("Kind UI chart styles")) warnings.push(entry.text());
  });
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/styles.css", async (route) => {
    await gate;
    await route.fulfill({
      contentType: "text/css",
      body: '#first > [data-kind-ui="chart"], #second > [data-kind-ui="chart"] { --kind-ui-styles-loaded: 1; }',
    });
  });
  await page.goto(`${development}/?late`);
  expect(await page.evaluate(() => document.readyState)).toBe("complete");
  await page.getByRole("button", { name: "Load CSS and mount nested charts" }).click();
  await expect(page.locator('[data-kind-ui="chart"]')).toHaveCount(4);
  await page.waitForTimeout(150);
  expect(warnings).toEqual([]);
  release();
  await expect
    .poll(() =>
      page
        .locator('[data-kind-ui="chart"]')
        .last()
        .evaluate((node) =>
          getComputedStyle(node).getPropertyValue("--kind-ui-styles-loaded").trim(),
        ),
    )
    .toBe("1");
  await page.waitForTimeout(100);
  expect(warnings).toEqual([]);
});

test("failed stylesheet before the deferred check does not suppress the warning", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (entry) => {
    if (entry.text().startsWith("Kind UI chart styles")) warnings.push(entry.text());
  });
  await page.route("**/styles.css", (route) => route.fulfill({ status: 404, body: "Missing CSS" }));
  await page.goto(`${development}/?styles`);
  await expect(page.locator("body")).toHaveAttribute("data-hydrated", "true");
  await expect.poll(() => warnings.length).toBe(1);
});

test("unmount cancels deferred development checks", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (entry) => {
    if (entry.text().startsWith("Kind UI chart styles")) warnings.push(entry.text());
  });
  await page.addInitScript(() => {
    const frames = new Map<number, FrameRequestCallback>();
    let next = 0;
    window.requestAnimationFrame = (callback) => {
      frames.set(++next, callback);
      return next;
    };
    window.cancelAnimationFrame = (id) => {
      frames.delete(id);
    };
    Object.assign(window, {
      pendingStyleFrames: () => frames.size,
      flushStyleFrames: () => {
        for (const [id, callback] of [...frames]) {
          frames.delete(id);
          callback(performance.now());
        }
      },
    });
  });
  await page.goto(development);
  await expect(page.locator("body")).toHaveAttribute("data-hydrated", "true");
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { pendingStyleFrames(): number }).pendingStyleFrames(),
      ),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Unmount", exact: true }).click();
  await expect(page.locator('[data-kind-ui="chart"]')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      (window as unknown as { pendingStyleFrames(): number }).pendingStyleFrames(),
    ),
  ).toBe(0);
  expect(warnings).toEqual([]);
});
