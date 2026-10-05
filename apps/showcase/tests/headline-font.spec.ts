import { expect, test } from "@playwright/test";

for (const width of [320, 375, 768, 1280]) {
  test(`hero renders bundled Instrument Serif with preserved metrics at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const fontResponses: string[] = [];
    page.on("response", (response) => {
      if (/\.(ttf|woff2?)(?:\?|$)/.test(response.url()) && response.ok()) {
        fontResponses.push(response.url());
      }
    });
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    const headline = page.locator(".hero h1");
    await expect(headline).toHaveText("Bring your datato life");
    const metrics = await headline.evaluate((node) => {
      const style = getComputedStyle(node);
      const heroNode = node.closest(".hero");
      if (!heroNode) throw new Error("Headline must remain inside the hero");
      const hero = heroNode.getBoundingClientRect();
      return {
        family: style.fontFamily,
        bodyFamily: getComputedStyle(document.body).fontFamily,
        weight: style.fontWeight,
        size: Number.parseFloat(style.fontSize),
        spacing: Number.parseFloat(style.letterSpacing),
        lineHeight: Number.parseFloat(style.lineHeight),
        heroHeight: hero.height,
        lines: Array.from(node.children, (line) => {
          const range = document.createRange();
          range.selectNodeContents(line);
          const bounds = range.getBoundingClientRect();
          return {
            rects: range.getClientRects().length,
            left: bounds.left,
            right: bounds.right,
            top: bounds.top,
            bottom: bounds.bottom,
          };
        }),
        heroTop: hero.top,
        heroBottom: hero.bottom,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    const size =
      width <= 650
        ? Math.min(72, Math.max(46, width * 0.128))
        : Math.min(100, Math.max(62, width * 0.073));
    expect(metrics.family).toMatch(/instrumentSerif/i);
    expect(metrics.bodyFamily).not.toMatch(/instrumentSerif/i);
    expect(metrics.weight).toBe("400");
    expect(metrics.size).toBeCloseTo(size, 2);
    expect(metrics.spacing).toBeCloseTo(size * -0.025, 2);
    expect(metrics.lineHeight).toBeCloseTo(size * (width <= 650 ? 0.98 : 0.96), 2);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(width);
    expect(metrics.lines).toHaveLength(2);
    for (const line of metrics.lines) {
      expect(line.rects).toBe(1);
      expect(line.left).toBeGreaterThanOrEqual(0);
      expect(line.right).toBeLessThanOrEqual(width);
      expect(line.top).toBeGreaterThan(metrics.heroTop);
      expect(line.bottom).toBeLessThan(metrics.heroBottom);
    }
    expect(fontResponses.length).toBeGreaterThan(0);
    expect(fontResponses.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(
      true,
    );

    // Computed CSS alone can pass while glyphs silently fall back to Georgia.
    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    const { root } = await session.send("DOM.getDocument");
    const { nodeIds } = await session.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: ".hero h1 span",
    });
    expect(nodeIds).toHaveLength(2);
    for (const nodeId of nodeIds) {
      const { fonts } = await session.send("CSS.getPlatformFontsForNode", { nodeId });
      expect(fonts).toHaveLength(1);
      expect(fonts[0].familyName).toBe("Instrument Serif");
      expect(fonts[0].isCustomFont).toBe(true);
      expect(fonts[0].glyphCount).toBeGreaterThan(0);
    }
    await session.detach();
    await test.info().attach("headline-metrics", {
      body: JSON.stringify(metrics, null, 2),
      contentType: "application/json",
    });
    await test.info().attach("hero", {
      body: await page.locator(".hero").screenshot(),
      contentType: "image/png",
    });
  });
}
