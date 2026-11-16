import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

function publishedRegistryNames(root: string): string[] {
  // Use Node's ESM loader for the catalog's import.meta-based discovery.
  const result: unknown = JSON.parse(
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        "const { registryItems } = await import(process.argv[1]); process.stdout.write(JSON.stringify(registryItems.map(item => item.name)));",
        pathToFileURL(resolve(root, "../../../registry/catalog.mjs")).href,
      ],
      { encoding: "utf8" },
    ),
  );
  if (!Array.isArray(result) || !result.every((name: unknown) => typeof name === "string"))
    throw new Error("Registry catalog must contain string installation names");
  return result as string[];
}

import { siteLinks } from "../lib/site-links";

test("homepage advertises registry commands only for the canonical chart compositions", async ({
  page,
}) => {
  const registryNames = publishedRegistryNames(test.info().config.rootDir);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          sessionStorage.setItem("install-command", text);
        },
      },
    });
  });
  await page.goto("./");
  await expect(page.getByRole("tab", { name: "Treemap", exact: true })).toBeVisible();
  const install = page.getByRole("region", { name: "Install Kind UI Charts" });
  await install.getByRole("tab", { name: "shadcn", exact: true }).click();
  const picker = install.getByRole("button", { name: /^Switch chart type:/ });
  const advertised: string[] = [];
  for (let index = 0; index < registryNames.length; index++) {
    const name = (await picker.textContent())?.trim();
    if (!name) throw new Error("Missing advertised registry name");
    advertised.push(name);

    await install
      .getByRole("button", { name: /^(Copy install command|Install command copied)$/ })
      .click();
    expect(await page.evaluate(() => sessionStorage.getItem("install-command"))).toBe(
      `npx shadcn@latest add @kind-ui/${name}`,
    );
    await picker.click();
  }
  expect([...advertised].sort()).toEqual([...registryNames].sort());
  await expect(picker).toHaveText(advertised[0] ?? "line-chart");
  expect(advertised).toContain("treemap-chart");
});

test("homepage documentation search includes the Treemap documentation route", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Search documentation", exact: true }).click();
  const link = page
    .locator(".documentation-search-results")
    .getByRole("link", { name: "Treemap Chart", exact: true });
  await expect(link).toHaveAttribute("href", `${siteLinks.docs}components/treemap/`);
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeFocused();
});
