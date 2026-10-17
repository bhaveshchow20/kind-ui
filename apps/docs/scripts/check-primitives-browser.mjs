import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";

const ids = JSON.parse(readFileSync("content/primitives/meta.json", "utf8")).pages;

export async function checkPrimitiveDocs(browser, origin) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  mkdirSync("artifacts/screenshots", { recursive: true });
  try {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const id of ids) {
        console.log(`Primitive docs: ${id} at ${width}px`);
        const response = await page.goto(`${origin}/components/${id}/`);
        assert.equal(response.status(), 200, id);
        const preview = page.locator(".primitive-preview");
        await expect(preview).toBeVisible();
        await expect(preview.getByText("Loading preview…", { exact: true })).toHaveCount(0);
        assert.equal(await page.locator(".component-workbench").count(), 1, id);
        await expect(page.locator("h2#api-reference")).toBeVisible();
        assert.ok(await page.locator(".line-props-scroll tbody tr").count(), `${id}: empty API`);
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          `${id}: overflow at ${width}`,
        );
        if (width === 1440) {
          const links = await page
            .locator('#nd-sidebar a[href^="/components/"]')
            .evaluateAll((nodes) =>
              nodes.map((node) => node.getAttribute("href").replace(/\/$/, "")),
            );
          assert.deepEqual(
            [...new Set(links)].sort(),
            ids.map((slug) => `/components/${slug}`).sort(),
          );
          assert.equal(await page.locator('#nd-sidebar a[href^="/docs/"]').count(), 0);
          const tops = await page
            .locator('#nd-sidebar a[href^="/components/"]')
            .evaluateAll((nodes) => nodes.slice(1).map((node) => node.getBoundingClientRect().top));
          assert.ok(
            tops.every((top, index) => index === 0 || top > tops[index - 1]),
            "Sidebar components must form a vertical list",
          );
          if (id === "button") {
            const group = page
              .locator("#nd-sidebar")
              .getByRole("button", { name: "Components", exact: true });
            await expect(group).toHaveAttribute("aria-expanded", "true");
            await group.click();
            await expect(group).toHaveAttribute("aria-expanded", "false");
            await group.click();
            await expect(group).toHaveAttribute("aria-expanded", "true");
          }
        }
        await page.getByRole("tab", { name: "Code", exact: true }).click();
        const code = page.locator(".primitive-workbench .line-code-block pre");
        await expect(code).toBeVisible();
        assert.equal(
          await code.textContent(),
          readFileSync(`examples/primitives/${id}.tsx`, "utf8"),
        );
        await page.getByRole("tab", { name: "Preview", exact: true }).click();
        await expect(preview).toBeVisible();
      }
    }
    await page.getByRole("button", { name: "Open Sidebar", exact: true }).click();
    await page.getByRole("link", { name: "Button", exact: true }).last().click();
    await expect(page).toHaveURL(`${origin}/components/button/`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(
      page.locator(".primitive-preview").getByRole("button", { name: "Continue", exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: "artifacts/screenshots/primitives-button.png", fullPage: true });

    await page.goto(`${origin}/components/tooltip/`);
    await page.getByRole("button", { name: "Save for later", exact: true }).focus();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toHaveCount(0);

    await page.goto(`${origin}/components/popover/`);
    await page.getByRole("button", { name: "Notification preferences" }).click();
    await page.getByRole("radio", { name: "All activity" }).check();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(
      page.locator(".primitive-preview").getByText("All activity", { exact: true }),
    ).toBeVisible();

    await page.goto(`${origin}/components/menu/`);
    await page.getByRole("button", { name: "Research notes actions" }).focus();
    await page.keyboard.press("ArrowDown");
    await page.getByRole("menuitemcheckbox", { name: "Pin to top" }).click();
    await expect(page.getByRole("menuitemcheckbox", { name: "Pin to top" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.keyboard.press("Escape");

    await page.goto(`${origin}/components/collapsible/`);
    await page.getByRole("button", { name: "Read more" }).click();
    await expect(page.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.getByRole("button", { name: "Show less" }).click();
    await expect(page.getByRole("button", { name: "Read more" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await page.goto(`${origin}/components/dialog/`);
    const trigger = page.getByRole("button", { name: "Edit brief", exact: true });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Edit project brief" })).toBeVisible();
    await page
      .getByRole("textbox", { name: "Brief", exact: true })
      .fill("A clearer brief for everyone.");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(
      page.locator(".primitive-preview").getByText("A clearer brief for everyone."),
    ).toBeVisible();
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();

    await page.goto(`${origin}/components/combobox/`);
    const input = page.getByRole("combobox", { name: "Assign reviewer" });
    await input.fill("Taylor");
    await expect(page.getByRole("option", { name: "Taylor Kim" })).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Taylor Kim");

    await page.goto(`${origin}/components/code-block/`);
    await page
      .locator(".primitive-preview")
      .getByRole("button", { name: "Copy Code", exact: true })
      .click();
    await expect(page.locator(".primitive-preview p[role=status]")).toHaveText("Code copied");
    await page.getByRole("checkbox", { name: "Wrap lines" }).uncheck();
    const download = page.waitForEvent("download");
    await page
      .locator(".primitive-preview")
      .getByRole("button", { name: /Download/ })
      .click();
    assert.equal((await download).suggestedFilename(), "welcome.ts");

    await page.goto(`${origin}/components/hover-card/`);
    await page
      .locator(".primitive-preview")
      .getByRole("link", { name: "Kind UI", exact: true })
      .hover();
    await expect(page.getByText("Thoughtful React components", { exact: true })).toBeVisible();

    await page.goto(`${origin}/components/table/`);
    await page.getByRole("button", { name: /fullscreen/i }).click();
    await expect(page.getByRole("dialog", { name: "Team projects" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "artifacts/screenshots/primitives-table-mobile.png",
      fullPage: true,
    });

    assert.deepEqual(errors, []);
    writeFileSync(
      "artifacts/primitives-browser-results.json",
      JSON.stringify(
        { routes: ids, widths: [1440, 390], exactSource: "passed", interactions: "passed", errors },
        null,
        2,
      ),
    );
    console.log(
      "14 primitive routes, sidebar, exact Preview/Code source, mobile layout and keyboard/state interactions passed.",
    );
  } finally {
    await context.close();
  }
}

if (process.argv[1]?.endsWith("check-primitives-browser.mjs")) {
  const browser = await chromium.launch(
    process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
  );
  try {
    await checkPrimitiveDocs(
      browser,
      process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373",
    );
  } finally {
    await browser.close();
  }
}
