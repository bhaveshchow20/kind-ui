import { expect, type Locator } from "@playwright/test";

/** A legend request cannot hide the final item; external visibility remains consumer-owned. */
export async function expectLastVisibleGuard(
  control: Locator,
  paint: Locator,
  activate: () => Promise<unknown> = () => control.click(),
) {
  const snapshot = () =>
    paint.evaluateAll((nodes) =>
      nodes.map((node) =>
        [node, ...node.querySelectorAll("*")].map((part) =>
          [...part.attributes]
            .filter((attr) =>
              [
                "d",
                "x",
                "y",
                "cx",
                "cy",
                "r",
                "width",
                "height",
                "transform",
                "fill",
                "stroke",
                "fill-opacity",
                "opacity",
                "stroke-width",
                "stroke-dasharray",
                "stroke-dashoffset",
                "filter",
              ].includes(attr.name),
            )
            .map((attr) => [attr.name, attr.value])
            .concat([
              ["computed-fill", getComputedStyle(part).fill],
              ["computed-stroke", getComputedStyle(part).stroke],
              ["computed-background", getComputedStyle(part).backgroundColor],
            ]),
        ),
      ),
    );
  const feedback = control
    .locator('xpath=ancestor::*[@data-kind-ui="chart"][1]')
    .locator('[data-kind-ui="chart-interaction-status"]');
  const previousAnnouncement = await feedback.locator("span").elementHandle();
  if (!previousAnnouncement) throw new Error("Missing scoped interaction live region");
  const before = await snapshot();
  expect(before.length).toBeGreaterThan(0);
  await activate();
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await expect(feedback).toHaveText("At least one item must remain visible.");
  // Repeated requests must announce again, rather than pass against stale feedback.
  await expect.poll(() => previousAnnouncement.evaluate((node) => node.isConnected)).toBe(false);
  await previousAnnouncement.dispose();
  await expect.poll(snapshot).toEqual(before);
}
