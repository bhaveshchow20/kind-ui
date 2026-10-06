import { expect, test } from "@playwright/test";

test("dash motion stays independent of reveal, native paint and lifecycle", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/dashed-lines.html");
  const path = page.locator('[data-example="line"] .recharts-line-curve');
  const combo = page.locator(".reverse-dashes .recharts-line-curve");
  const name = () => path.evaluate((node) => getComputedStyle(node).animationName);
  await expect.poll(name).toBe("kind-ui-line-dash");
  const geometry = await path.getAttribute("d");
  await expect(path).toHaveCSS("animation-duration", "0.8s");
  await expect(path).toHaveAttribute("stroke-dasharray", "6 4");
  await expect(path).toHaveAttribute("stroke-dashoffset", "3");
  await expect
    .poll(() => combo.evaluate((node) => getComputedStyle(node).animationDirection))
    .toBe("reverse");
  await expect(page.locator('[data-custom="owned"]')).toHaveCount(1);
  await expect(page.locator('[data-custom="owned"]')).not.toHaveCSS(
    "animation-name",
    "kind-ui-line-dash",
  );
  const offset = await path.evaluate((node) => getComputedStyle(node).strokeDashoffset);
  await expect
    .poll(() => path.evaluate((node) => getComputedStyle(node).strokeDashoffset))
    .not.toBe(offset);
  if (!geometry) throw new Error("Missing line geometry");
  await expect(path).toHaveAttribute("d", geometry);
  const styled = page.locator(".style-dashes .recharts-line-curve");
  await expect(styled).toHaveCSS("stroke-width", "5px");
  await expect(styled).toHaveCSS("animation-duration", "0.6s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(styled).toHaveCSS("stroke-dashoffset", "7px");
  await expect.poll(name).toBe("none");
  await expect(path).toHaveCSS("stroke-dashoffset", "3px");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByText("Toggle animation", { exact: true }).click();
  await expect.poll(name).toBe("none");
  await page.getByText("Toggle animation", { exact: true }).click();
  await expect.poll(name).toBe("kind-ui-line-dash");
  await page.getByText("Toggle loading", { exact: true }).click();
  await expect.poll(name).toBe("none");
  await page.getByText("Toggle loading", { exact: true }).click();
  await expect.poll(name).toBe("kind-ui-line-dash");
  await page.getByText("Toggle visibility", { exact: true }).click();
  await expect(page.locator('[data-example="line"] .kind-ui-line-dash')).toHaveCount(0);
  await page.getByText("Toggle visibility", { exact: true }).click();
  for (let count = 0; count < 3; count++) {
    await page.getByText("Toggle mount", { exact: true }).click();
    await expect(path).toHaveCount(0);
    await page.getByText("Toggle mount", { exact: true }).click();
    await expect.poll(name).toBe("kind-ui-line-dash");
  }
  expect(errors).toEqual([]);
});
