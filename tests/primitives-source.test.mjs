import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("primitive registry sources are generated from the maintained implementations", async () => {
  for (const name of await fs.readdir(new URL("packages/primitives/src/", root))) {
    if (!/\.(tsx?|css)$/.test(name) || name === "index.ts") continue;
    const source = (
      await fs.readFile(new URL(`packages/primitives/src/${name}`, root), "utf8")
    ).replace(/(from\s+["']\.\/[^"']+)\.js(["'])/g, "$1$2");
    const generated = await fs.readFile(
      new URL(
        `artifacts/primitives/registry/ui/${name.endsWith("css") ? "theme.css" : name}`,
        root,
      ),
      "utf8",
    );
    assert.equal(
      generated,
      `/* Generated from packages/primitives/src/${name}. Edit the maintained source. */\n${source}`,
      name,
    );
  }
});
