import { expect, test } from "@playwright/test";

for (const width of [320, 375, 768, 1280]) {
  test(`Geist fonts render locally without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const fonts: string[] = [];
    page.on("response", (response) => {
      if (/\.(ttf|woff2?)(?:\?|$)/.test(response.url()) && response.ok())
        fonts.push(response.url());
    });
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".hero h1")).toHaveAccessibleName(
      "Interactive charts for React.js and Next.js, built on Recharts and Motion and ready for Codex, Claude, Gemini, Grok and your agents.",
    );
    await expect(page.locator(".brand-pill-framework .brand-pill-face")).toHaveText("React.js");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    for (const [group, labels] of Object.entries({
      framework: ["React.js", "Next.js"],
      stack: ["Recharts", "Motion"],
      agent: ["Codex", "Claude", "Gemini", "Grok", "your agents"],
    })) {
      const pill = page.locator(`.brand-pill-${group}`);
      for (const label of labels) {
        await expect(pill.locator(".brand-pill-face")).toHaveText(
          label === "your agents" ? `🤖${label}` : label,
        );
        await expect
          .poll(() =>
            pill.evaluate((element) => {
              const face = element.querySelector(".brand-pill-face");
              if (!face) return false;
              const outer = element.getBoundingClientRect();
              const inner = face.getBoundingClientRect();
              const padding = Number.parseFloat(getComputedStyle(element).paddingRight);
              return (
                inner.left >= outer.left + padding - 1 && inner.right <= outer.right - padding + 1
              );
            }),
          )
          .toBe(true);
        await pill.click();
      }
    }
    expect(fonts.length).toBeGreaterThan(0);
    expect(fonts.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    const { root } = await session.send("DOM.getDocument");
    const { nodeIds } = await session.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: ".hero h1",
    });
    expect(nodeIds).toHaveLength(1);
    for (const nodeId of nodeIds) {
      const { fonts: platformFonts } = await session.send("CSS.getPlatformFontsForNode", {
        nodeId,
      });
      expect(
        platformFonts
          .filter((font) => font.glyphCount > 0)
          .every(
            (font) =>
              (/Geist/.test(font.familyName) && font.isCustomFont) || /Emoji/.test(font.familyName),
          ),
      ).toBe(true);
    }
  });
}

test("framework pill switches with a click and stays still with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const pill = page.getByRole("button", { name: "Switch between React.js and Next.js" });
  await expect(pill.locator(".brand-pill-face")).toHaveText("React.js");
  await pill.click();
  await expect(pill.locator(".brand-pill-face")).toHaveText("Next.js");
  await pill.press("Enter");
  await expect(pill.locator(".brand-pill-face")).toHaveText("React.js");
  await expect(page.locator(".hero-description, .hero-toys")).toHaveCount(0);
});

test("pills animate to the width of their current label", async ({ page }) => {
  await page.goto("./");
  const pill = page.locator(".brand-pill-stack");
  await expect(pill.locator(".brand-pill-face").last()).toHaveText("Recharts");
  await page.evaluate(() => document.fonts.ready);
  const before = await pill.evaluate((element) => element.getBoundingClientRect().width);
  await pill.click();
  await expect(pill.locator(".brand-pill-face").last()).toHaveText("Motion");
  await expect
    .poll(() => pill.evaluate((element) => element.getBoundingClientRect().width))
    .toBeLessThan(before - 15);
  await expect(pill.locator(".brand-pill-face img.brand-motion")).toBeVisible();
});

test("one random pill changes at a time with a pause before the next", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.clock.install();
  await page.goto("./");
  const framework = page.locator(".brand-pill-framework .brand-pill-sizer");
  const stack = page.locator(".brand-pill-stack .brand-pill-sizer");
  const agent = page.locator(".brand-pill-agent .brand-pill-sizer");
  await expect(framework).toHaveText("React.js");
  await page.clock.runFor(2600);
  await expect(framework).toHaveText("Next.js");
  await expect(stack).toHaveText("Recharts");
  await expect(agent).toHaveText("Codex");
  await page.clock.runFor(1000);
  await expect(stack).toHaveText("Recharts");
  await page.clock.runFor(1000);
  await expect(stack).toHaveText("Motion");
  await expect(framework).toHaveText("Next.js");
  await expect(agent).toHaveText("Codex");
});
