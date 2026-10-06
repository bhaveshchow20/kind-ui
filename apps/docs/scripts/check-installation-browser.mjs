import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import commands from "../lib/installation-commands.json" with { type: "json" };
import { publicPath } from "../lib/routing.mjs";

export async function checkInstallation(browser, origin) {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    const context = await browser.newContext({
      reducedMotion,
      viewport: { width: 390, height: 844 },
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${origin}${publicPath("/docs/start/installation/")}`);
      const tabs = page.getByRole("tablist", { name: "Package manager", exact: true });
      const panel = page.getByRole("tabpanel");
      await tabs.getByRole("tab", { name: "npm", exact: true }).waitFor();
      assert.equal(
        await tabs.getByRole("tab", { name: "npm", exact: true }).getAttribute("aria-selected"),
        "true",
      );
      assert.equal((await panel.textContent()).trim(), commands.npm);
      await tabs.getByRole("tab", { name: "npm", exact: true }).focus();
      for (const manager of ["pnpm", "yarn", "bun", "npm"]) {
        await page.keyboard.press("ArrowRight");
        const tab = tabs.getByRole("tab", { name: manager, exact: true });
        await expect(tab).toHaveAttribute("aria-selected", "true");
        assert.equal(await tab.evaluate((element) => element === document.activeElement), true);
        assert.equal((await panel.textContent()).trim(), commands[manager]);
        assert.equal(await tab.getAttribute("aria-controls"), await panel.getAttribute("id"));
      }
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
}
