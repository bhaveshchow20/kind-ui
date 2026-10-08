import { expect, type Locator } from "@playwright/test";

/** Hidden data keeps its native geometry while its stable series owner fades paint and blocks hits. */
export async function expectHiddenPaint(mark: Locator) {
  const owner = mark
    .first()
    .locator('xpath=ancestor-or-self::*[@data-kind-ui="series-interaction"][1]');
  await expect(owner).toHaveAttribute("aria-hidden", "true");
  await expect(owner).toHaveAttribute("pointer-events", "none");
  await expect(owner.locator(':scope > [data-kind-ui="series-interaction-paint"]')).toHaveCSS(
    "opacity",
    "0",
  );
}

/** Focus retains inspection and geometry; only inactive paint dims. */
export async function expectDimmedPaint(mark: Locator) {
  const owner = mark
    .first()
    .locator('xpath=ancestor-or-self::*[@data-kind-ui="series-interaction"][1]');
  await expect(owner).not.toHaveAttribute("aria-hidden", "true");
  await expect(owner.locator(':scope > [data-kind-ui="series-interaction-paint"]')).toHaveCSS(
    "opacity",
    "0.28",
  );
}
