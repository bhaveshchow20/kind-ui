import assert from "node:assert/strict";
import test from "node:test";
import * as K from "@kind-ui/ai";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("StreamingText root and subpath expose the same component", async () => {
  assert.equal(typeof K.StreamingText, "function");
  const subpath = await import("@kind-ui/ai/streaming-text");
  assert.equal(subpath.StreamingText, K.StreamingText);
});

test("StreamingText defaults to a complete native paragraph without live announcements", () => {
  const markup = render(h(K.StreamingText, null, "A finished response."));
  assert.match(markup, /^<p\b/);
  assert.match(markup, /aria-busy="false"/);
  assert.match(markup, />A finished response\.<\/p>$/);
  assert.doesNotMatch(markup, /role=|aria-live=|streaming-text-caret/);
});

test("StreamingText preserves whitespace, Unicode, partial words and literal markup", () => {
  const markup = render(
    h(
      K.StreamingText,
      { state: "streaming", caret: false },
      "  Hello\n\t世界 👩🏽‍💻 par <b>literal</b> & ",
    ),
  );
  assert.match(markup, /> {2}Hello\n\t世界 👩🏽‍💻 par &lt;b&gt;literal&lt;\/b&gt; &amp; <\/p>$/);
  assert.doesNotMatch(markup, /<b>|streaming-text-caret/);
});

test("StreamingText shows a decorative caret only for nonblank streaming text", () => {
  assert.match(
    render(h(K.StreamingText, { state: "streaming" }, "Partial")),
    /data-slot="streaming-text-caret"/,
  );
  for (const [state, text, caret, visible] of [
    ["streaming", "Partial", true, true],
    ["streaming", "Partial", false, false],
    ["streaming", "", true, false],
    ["streaming", " \n\t\u00a0", true, false],
    ["complete", "Retained", true, false],
    ["interrupted", "Retained", true, false],
  ]) {
    const markup = render(h(K.StreamingText, { state, caret }, text));
    assert.equal(markup.includes('data-slot="streaming-text-caret"'), visible);
    assert.equal(markup.includes('aria-busy="true"'), state === "streaming");
    if (visible) assert.match(markup, /<span[^>]*aria-hidden="true"[^>]*><\/span>/);
  }
});

test("StreamingText retains native attributes and explicit accessibility overrides", () => {
  const markup = render(
    h(
      K.StreamingText,
      {
        state: "streaming",
        id: "response",
        title: "Current response",
        className: "consumer-text",
        style: { whiteSpace: "break-spaces", color: "rgb(1, 2, 3)" },
        lang: "ja",
        dir: "auto",
        tabIndex: 0,
        "aria-busy": false,
        "aria-label": "Answer",
        "aria-live": "off",
        role: "note",
      },
      "回答",
    ),
  );
  for (const attribute of [
    'id="response"',
    'title="Current response"',
    'lang="ja"',
    'dir="auto"',
    'tabindex="0"',
    'aria-busy="false"',
    'aria-label="Answer"',
    'aria-live="off"',
    'role="note"',
    "consumer-text",
    "white-space:break-spaces",
    "color:rgb(1, 2, 3)",
  ]) {
    assert.ok(markup.includes(attribute), attribute);
  }
  assert.doesNotMatch(markup, /\s(?:state|caret|animated)=/);
  assert.match(
    render(h(K.StreamingText, { state: "complete", "aria-busy": true }, "Retained")),
    /aria-busy="true"/,
  );
});

test("StreamingText opts only its decorative caret into a motion-safe pulse", () => {
  const animated = render(h(K.StreamingText, { state: "streaming", animated: true }, "Partial"));
  assert.match(animated, /<span[^>]*class="[^"]*motion-safe:animate-pulse[^"]*"[^>]*><\/span>/);
  assert.doesNotMatch(animated.match(/^<p[^>]*>/)?.[0] ?? "", /animate-pulse/);
  assert.doesNotMatch(
    render(h(K.StreamingText, { state: "streaming" }, "Partial")),
    /animate-pulse/,
  );
  assert.doesNotMatch(
    render(h(K.StreamingText, { state: "complete", animated: true }, "Retained")),
    /animate-pulse|streaming-text-caret/,
  );
});
