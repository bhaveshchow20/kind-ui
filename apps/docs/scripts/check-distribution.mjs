import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import { families } from "../examples/catalog.mjs";
import { registryName } from "../lib/registry-catalog.mjs";
import { publicPath } from "../lib/routing.mjs";

const origin = process.env.KIND_DOCS_ORIGIN || "http://127.0.0.1:6373";
const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
const results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 850 },
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const family of families) {
    await page.goto(`${origin}${publicPath(`/docs/components/${family.id}/`)}`);
    const name = registryName(family.id),
      install = page.locator(`[data-installation="${name}"]`);
    await install.getByRole("tab", { name: "CLI", exact: true }).waitFor();
    assert.equal(await page.getByLabel("Chart distribution").count(), 0);
    assert.equal(
      await page.evaluate(
        () =>
          document
            .querySelector("#installation")
            .compareDocumentPosition(document.querySelector("#usage")) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      4,
    );
    const preview = page.locator("[data-component]").first();
    const chart = await preview
      .locator('svg, [data-kind-ui="heatmap-grid"]')
      .first()
      .elementHandle();
    assert.ok(
      await install
        .locator(':scope > [role="tabpanel"]')
        .innerText()
        .then((s) => s.includes(`npx shadcn@latest add @kind-ui/${name}`)),
    );
    assert.ok(
      await install
        .locator(':scope > [role="tabpanel"]')
        .innerText()
        .then((s) => s.includes("installation guide")),
    );
    const cli = install.getByRole("tab", { name: "CLI", exact: true });
    await cli.focus();
    await page.keyboard.press("ArrowRight");
    const manual = install.getByRole("tab", { name: "Manual", exact: true });
    await expect(manual).toHaveAttribute("aria-selected", "true");
    const panel = install.locator(':scope > [role="tabpanel"]');
    assert.ok((await panel.innerText()).includes(`components/charts/${name}.tsx`));
    assert.equal(await panel.locator(".fd-steps > .fd-step").count(), 3);
    assert.equal(await panel.getByText("components/charts/LICENSE", { exact: true }).count(), 0);
    assert.ok(await panel.locator("pre .line").count(), "Manual source lacks syntax highlighting");
    assert.ok((await panel.innerText()).includes("npm install @kind-ui/charts@0.4.0"));
    if (chart)
      assert.equal(
        await chart.evaluate((node) => node.isConnected),
        true,
        "Changing installation remounted the preview",
      );
    await page.keyboard.press("ArrowLeft");
    await expect(cli).toHaveAttribute("aria-selected", "true");
    const blocks = install.locator(':scope > [role="tabpanel"]').locator("pre:visible");
    const command = blocks.last();
    assert.equal((await command.innerText()).trim(), `npx shadcn@latest add @kind-ui/${name}`);
    const block = command.locator("xpath=ancestor::figure[1]");
    await block.getByRole("button").last().click();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      `npx shadcn@latest add @kind-ui/${name}`,
    );
    for (const [manager, prefix] of [
      ["pnpm", "pnpm dlx"],
      ["yarn", "yarn dlx"],
      ["bun", "bunx --bun"],
      ["npm", "npx"],
    ]) {
      await install.getByRole("tab", { name: manager, exact: true }).click();
      const commandBlock = install.locator("pre:visible");
      assert.equal(
        (await commandBlock.innerText()).trim(),
        `${prefix} shadcn@latest add @kind-ui/${name}`,
      );
    }
    assert.ok(
      await install.locator(".preview-tabs").count(),
      "Installation must reuse the preview switcher",
    );
    assert.doesNotMatch(await install.innerText(), /127\.0\.0\.1|localhost|registry\.json|LICENSE/);
    results.push({ family: family.id, name, tabs: true, steps: true, clipboard: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}${publicPath("/docs/components/area/")}`);
  const install = page.locator('[data-installation="area-chart"]');
  await install.getByRole("tab", { name: "Manual", exact: true }).click();
  await page.waitForTimeout(250);
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
    "Manual source caused mobile page overflow",
  );
  mkdirSync("artifacts/browser", { recursive: true });
  await page.screenshot({ path: "artifacts/browser/registry-manual-mobile.png", fullPage: false });
  assert.deepEqual(errors, []);
  writeFileSync(
    "artifacts/browser/registry-installation-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log(
    `${results.length} family installations passed visible tabs, keyboard, step order, literal command copy and mobile containment.`,
  );
} finally {
  await browser.close();
}
