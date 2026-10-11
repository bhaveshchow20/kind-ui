import { expect, test } from "./browser";

test("dash motion stays independent of reveal, native paint and lifecycle", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/contracts.html#dashed-lines");
  const example = page.getByRole("region", { name: "Animated dashed strokes" });
  const path = example.locator('[data-example="line"] .recharts-line-curve');
  const combo = example.locator(".reverse-dashes .recharts-line-curve");
  const name = () => path.evaluate((node) => getComputedStyle(node).animationName);
  await expect.poll(name).toBe("kind-ui-line-dash");
  const geometry = await path.getAttribute("d");
  await expect(path).toHaveCSS("animation-duration", "0.8s");
  await expect(path).toHaveAttribute("stroke-dasharray", "6 4");
  await expect(path).toHaveAttribute("stroke-dashoffset", "3");
  await expect
    .poll(() => combo.evaluate((node) => getComputedStyle(node).animationDirection))
    .toBe("reverse");
  await expect(example.locator('[data-custom="owned"]')).toHaveCount(1);
  await expect(example.locator('[data-custom="owned"]')).not.toHaveCSS(
    "animation-name",
    "kind-ui-line-dash",
  );
  const offset = await path.evaluate((node) => getComputedStyle(node).strokeDashoffset);
  await expect
    .poll(() => path.evaluate((node) => getComputedStyle(node).strokeDashoffset))
    .not.toBe(offset);
  if (!geometry) throw new Error("Missing line geometry");
  await expect(path).toHaveAttribute("d", geometry);
  const styled = example.locator(".style-dashes .recharts-line-curve");
  await expect(styled).toHaveCSS("stroke-width", "5px");
  await expect(styled).toHaveCSS("animation-duration", "0.6s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(styled).toHaveCSS("stroke-dashoffset", "7px");
  await expect.poll(name).toBe("none");
  await expect(path).toHaveCSS("stroke-dashoffset", "3px");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await example.getByText("Toggle animation", { exact: true }).click();
  await expect.poll(name).toBe("none");
  await example.getByText("Toggle animation", { exact: true }).click();
  await expect.poll(name).toBe("kind-ui-line-dash");
  await example.getByText("Toggle loading", { exact: true }).click();
  await expect.poll(name).toBe("none");
  await example.getByText("Toggle loading", { exact: true }).click();
  await expect.poll(name).toBe("kind-ui-line-dash");
  await example.getByText("Toggle visibility", { exact: true }).click();
  await expect(example.locator('[data-example="line"] .kind-ui-line-dash')).toHaveCount(0);
  await example.getByText("Toggle visibility", { exact: true }).click();
  for (let count = 0; count < 3; count++) {
    await example.getByText("Toggle mount", { exact: true }).click();
    await expect(path).toHaveCount(0);
    await example.getByText("Toggle mount", { exact: true }).click();
    await expect.poll(name).toBe("kind-ui-line-dash");
  }
  expect(errors).toEqual([]);
});

test("reduced motion stops generated CSS dashes without a React commit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Capture public rendered markup with its utilities and SVG keyframes, plus
  // the consumer-generated stylesheet. The legacy marker class has no styles.
  await page.goto("/contracts.html#dashed-lines");
  const example = page.getByRole("region", { name: "Animated dashed strokes" });
  const surface = example.locator('[data-example="line"] .recharts-surface');
  await expect(surface.locator(".recharts-line-curve")).toHaveCSS(
    "animation-name",
    "kind-ui-line-dash",
  );
  const standalone = await surface.evaluate((node) => node.outerHTML);
  const stylesheetUrls = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  expect(stylesheetUrls.length).toBeGreaterThan(0);
  const stylesheets = await Promise.all(
    stylesheetUrls.map(async (url) => {
      const response = await page.request.get(url);
      expect(response.ok()).toBe(true);
      return response.text();
    }),
  );
  // Discard the fixture's React document before exercising the standalone SVG.
  await page.goto("about:blank");
  await page.setContent(standalone);
  await page.addStyleTag({ content: stylesheets.join("\n") });
  const path = page.locator(".recharts-line-curve");
  await expect(path).toHaveCSS("animation-name", "kind-ui-line-dash");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(path).toHaveCSS("animation-name", "none");
  await expect(path).toHaveCSS("stroke-dashoffset", "3px");
});

test("unsupported Area dashes preserve native paint and diagnose only in development", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await page.goto("/contracts.html?unsupported-area#dashed-lines");
  const example = page.getByRole("region", { name: "Animated dashed strokes" });
  const area = example.locator(".recharts-area-area");
  await expect(area).toHaveCount(1);
  await expect(area).toHaveAttribute("fill-opacity", "0.2");
  await expect(area).not.toHaveCSS("animation-name", "kind-ui-line-dash");
  await expect(example.locator("[dashAnimation], [dashanimation]")).toHaveCount(0);
  const unsupported = warnings.filter((message) =>
    message.includes("AreaSeries does not support dashAnimation"),
  );
  if (process.env.KIND_UI_TEST_DEVELOPMENT === "1") {
    expect(unsupported).toHaveLength(1);
    expect(unsupported[0]).toContain("Remove it or use LineSeries with strokeDasharray");
  } else {
    expect(unsupported).toEqual([]);
  }
});

test("nonce-authorized loading and dash keyframes work under CSP", async ({ page }) => {
  await page.route("**/contracts.html", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        "content-security-policy": "style-src-elem 'self' 'nonce-request-nonce'",
      },
    });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/contracts.html#dashed-lines");
  const example = page.getByRole("region", { name: "Animated dashed strokes" });
  const path = example.locator('[data-example="line"] .recharts-line-curve');
  await expect(path).toHaveCSS("animation-name", "kind-ui-line-dash");
  const before = await path.evaluate((node) => getComputedStyle(node).strokeDashoffset);
  await expect
    .poll(() => path.evaluate((node) => getComputedStyle(node).strokeDashoffset))
    .not.toBe(before);
  await example.getByText("Toggle loading", { exact: true }).click();
  const skeleton = example.locator('[data-example="line"] [data-kind-ui="chart-loading-skeleton"]');
  await expect(skeleton).toHaveCSS("animation-name", "kind-ui-loading-pulse");
  expect(await skeleton.locator("style").evaluate((node) => node.nonce)).toBe("request-nonce");
  await expect
    .poll(() =>
      skeleton.evaluate((node) =>
        node.getAnimations().some((animation) => animation.playState === "running"),
      ),
    )
    .toBe(true);
});
