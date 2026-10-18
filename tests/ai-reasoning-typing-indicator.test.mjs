import assert from "node:assert/strict";
import test from "node:test";
import * as K from "@kind-ui/ai";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("TypingIndicator and ThinkingDots share their root and subpath exports", async () => {
  assert.equal(typeof K.TypingIndicator, "function");
  const typing = await import("@kind-ui/ai/typing-indicator");
  const dots = await import("@kind-ui/ai/thinking-dots");
  assert.equal(typing.TypingIndicator, K.TypingIndicator);
  assert.equal(dots.ThinkingDots, K.ThinkingDots);
});

test("TypingIndicator defaults to one named status with three decorative dots", () => {
  const markup = render(h(K.TypingIndicator));
  assert.match(markup, /^<div\b/);
  assert.match(markup, /data-slot="typing-indicator"/);
  assert.match(markup, /aria-label="Assistant is typing"/);
  assert.equal((markup.match(/role="status"/g) ?? []).length, 1);
  assert.equal((markup.match(/aria-hidden="true"/g) ?? []).length, 1);
  assert.match(markup, /<span[^>]*aria-hidden="true"[^>]*data-slot="thinking-dots"/);
  assert.equal((markup.match(/class="size-0\.5 rounded-full bg-current"/g) ?? []).length, 3);
  assert.doesNotMatch(markup, /aria-live=|kind-surface/);
});

test("TypingIndicator preserves host naming, roles, native attributes and styles", () => {
  const markup = render(
    h(K.TypingIndicator, {
      role: "note",
      "aria-label": "Drafting a reply",
      "aria-labelledby": "host-label",
      "aria-live": "off",
      id: "host-typing",
      title: "Current activity",
      lang: "en",
      tabIndex: 0,
      className: "host-surface",
      style: { color: "tomato" },
      "data-host": "present",
    }),
  );
  for (const attribute of [
    'role="note"',
    'aria-label="Drafting a reply"',
    'aria-labelledby="host-label"',
    'aria-live="off"',
    'id="host-typing"',
    'title="Current activity"',
    'lang="en"',
    'tabindex="0"',
    'class="host-surface"',
    "color:tomato",
    'data-host="present"',
  ])
    assert.ok(markup.includes(attribute), attribute);
  assert.doesNotMatch(markup, /role="status"|Assistant is typing/);
});

test("ThinkingDots preserves its zero-prop appearance and forwards native span props", () => {
  const original = render(h(K.ThinkingDots));
  assert.match(original, /^<span aria-hidden="true" data-slot="thinking-dots"/);
  assert.match(
    original,
    /inline-flex h-4 w-4 shrink-0 items-center justify-center gap-0\.5 text-muted-foreground/,
  );
  assert.equal((original.match(/class="size-0\.5 rounded-full bg-current"/g) ?? []).length, 3);
  const markup = render(
    h(K.ThinkingDots, {
      id: "host-dots",
      title: "Decorative activity",
      className: "host-dots",
      style: { width: 30, color: "tomato" },
      "data-host": "present",
      tabIndex: -1,
    }),
  );
  for (const attribute of [
    'id="host-dots"',
    'title="Decorative activity"',
    'data-host="present"',
    'tabindex="-1"',
    "host-dots",
    "width:30px",
    "color:tomato",
  ])
    assert.ok(markup.includes(attribute), attribute);
  assert.match(markup, /aria-hidden="true"/);
  assert.doesNotMatch(markup, /role="status"/);
});

test("fixed dots and wrapper contents cannot be replaced by untyped children", () => {
  const dots = render(h(K.ThinkingDots, { "aria-hidden": false }, "Replacement"));
  assert.match(dots, /aria-hidden="true"/);
  assert.equal((dots.match(/class="size-0\.5 rounded-full bg-current"/g) ?? []).length, 3);
  assert.doesNotMatch(dots, /Replacement|aria-hidden="false"/);
  const typing = render(h(K.TypingIndicator, null, "Replacement"));
  assert.match(typing, /data-slot="thinking-dots"/);
  assert.doesNotMatch(typing, /Replacement/);
});
