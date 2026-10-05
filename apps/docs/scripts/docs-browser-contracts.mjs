import assert from "node:assert/strict";

export async function assertToc(page, expected) {
  const links = page.locator("#nd-toc a");
  assert.deepEqual(
    (await links.allTextContents()).map((text) => text.trim()),
    expected,
  );
  for (const href of await links.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("href")),
  )) {
    const id = decodeURIComponent(href.split("#")[1]);
    assert.ok(
      await page.evaluate((id) => document.getElementById(id)?.tagName === "H2", id),
      `Missing section target: ${href}`,
    );
  }
}
