import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { TailwindHost } from "./ssr/host.js";

const entry = new URL("./index.html", import.meta.url);
const template = await readFile(entry, "utf8");
assert.equal(template.split("<!--kind-ui-ssr-->").length, 3);
const markup = renderToString(createElement(StrictMode, null, createElement(TailwindHost)));
assert.match(markup, /data-kind-ui="chart"/);
await writeFile(entry, template.replaceAll("<!--kind-ui-ssr-->", markup));
