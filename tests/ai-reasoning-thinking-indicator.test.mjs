import assert from "node:assert/strict";
import test from "node:test";
import { ThinkingIndicator } from "@kind-ui/ai";
import * as subpath from "@kind-ui/ai/thinking-indicator";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("ThinkingIndicator subpath retains the root runtime export", () => {
  assert.equal(subpath.ThinkingIndicator, ThinkingIndicator);
});

for (const [entry, Component] of [
  ["root", ThinkingIndicator],
  ["subpath", subpath.ThinkingIndicator],
]) {
  test(`${entry} ThinkingIndicator limits status semantics to its static label`, () => {
    const markup = render(h(Component, { label: "Reviewing sources", elapsed: "0s" }));
    assert.match(markup, /^<div[^>]*data-slot="thinking-indicator"/);
    assert.doesNotMatch(markup.match(/^<div[^>]*>/)?.[0] ?? "", /role=|aria-live=/);
    assert.equal((markup.match(/role="status"/g) ?? []).length, 1);
    assert.match(
      markup,
      /<span[^>]*role="status"[^>]*aria-live="polite"[^>]*>Reviewing sources<\/span>/,
    );
    assert.match(markup, /data-state="inflight"/);
    assert.match(markup, /data-size="sm"/);
    assert.doesNotMatch(
      markup.match(/data-slot="loader"[^>]*>/)?.[0] ?? "",
      /animate|kind-shimmer/,
    );
    assert.match(
      markup,
      /<span[^>]*data-slot="thinking-indicator-elapsed"[^>]*>0s<\/span><\/div>$/,
    );
  });

  test(`${entry} ThinkingIndicator omits elapsed only when undefined`, () => {
    assert.doesNotMatch(render(h(Component, { label: "Thinking" })), /thinking-indicator-elapsed/);
    for (const elapsed of ["", "0s", "<1s", "12 seconds"]) {
      const markup = render(h(Component, { label: "Thinking", elapsed }));
      assert.match(markup, /data-slot="thinking-indicator-elapsed"/);
      assert.ok(markup.includes(elapsed.replaceAll("<", "&lt;")));
    }
  });

  test(`${entry} ThinkingIndicator preserves a supplied empty label`, () => {
    const markup = render(h(Component, { label: "", elapsed: "0s" }));
    assert.match(markup, /role="status"[^>]*aria-label=""[^>]*><\/span>/);
    assert.doesNotMatch(markup, /Loading/);
  });

  test(`${entry} ThinkingIndicator preserves literal strings and consumer root semantics`, () => {
    const markup = render(
      h(Component, {
        label: "<search> & compare",
        elapsed: "<1s",
        live: "off",
        role: "note",
        "aria-live": "assertive",
        "aria-label": "Host context",
        id: "host-thinking",
        title: "Host title",
        className: "host-class",
        style: { color: "tomato" },
        render: h("section", { "data-host": "present" }),
      }),
    );
    assert.match(markup, /^<section/);
    assert.match(markup, /role="note"/);
    assert.match(markup, /aria-label="Host context"/);
    assert.match(markup, /aria-live="assertive"/);
    assert.match(markup, /role="status"[^>]*aria-live="off"/);
    assert.match(markup, /id="host-thinking"/);
    assert.match(markup, /title="Host title"/);
    assert.match(markup, /host-class/);
    assert.match(markup, /color:tomato/);
    assert.match(markup, /data-host="present"/);
    assert.match(markup, /&lt;search&gt; &amp; compare/);
    assert.match(markup, /&lt;1s/);
  });
}
