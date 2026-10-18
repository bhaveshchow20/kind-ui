import assert from "node:assert/strict";
import test from "node:test";
import { GuardrailNotice } from "@kind-ui/ai";
import * as subpath from "@kind-ui/ai/guardrail-notice";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const basic = {
  title: "Choose another request",
  explanation: "This request needs a different approach.",
};
const alternatives = [
  { id: "summary", text: "A safe summary" },
  { id: "example", text: "A safe example", disabled: true },
];

test("GuardrailNotice root and subpath expose the same component", () => {
  assert.equal(subpath.GuardrailNotice, GuardrailNotice);
});

for (const [entry, Component] of [
  ["root", GuardrailNotice],
  ["subpath", subpath.GuardrailNotice],
]) {
  test(`${entry} GuardrailNotice retains warning Callout semantics and omits empty recovery`, () => {
    for (const extra of [{}, { alternatives: [] }]) {
      const markup = render(h(Component, { ...basic, ...extra }));
      assert.match(markup, /role="note"/);
      assert.match(markup, /data-slot="callout"/);
      assert.match(markup, /data-tone="warning"/);
      assert.match(markup, /data-guardrail-notice=""/);
      assert.match(markup, /data-slot="callout-icon"/);
      assert.match(markup, /data-slot="callout-content"/);
      assert.match(markup, /Choose another request/);
      assert.match(markup, /This request needs a different approach\./);
      assert.doesNotMatch(markup, /Try instead|<ul|<button|data-slot="badge"|aria-live=/);
    }
  });

  test(`${entry} GuardrailNotice renders static alternatives without an action callback`, () => {
    const markup = render(h(Component, { ...basic, alternatives }));
    assert.match(markup, /Try instead/);
    assert.match(markup, /<ul/);
    assert.equal((markup.match(/<li[ >]/g) ?? []).length, 2);
    assert.match(markup, /A safe summary/);
    assert.match(markup, /A safe example/);
    assert.doesNotMatch(markup, /<button|aria-disabled|disabled=/);
  });

  test(`${entry} GuardrailNotice uses explicit non-submit actions and both disabled scopes`, () => {
    for (const disabled of [false, true]) {
      const markup = render(h(Component, { ...basic, alternatives, disabled, onPick() {} }));
      assert.equal((markup.match(/<button/g) ?? []).length, 2);
      assert.equal((markup.match(/type="button"/g) ?? []).length, 2);
      assert.equal((markup.match(/ disabled=""/g) ?? []).length, disabled ? 2 : 1);
      assert.doesNotMatch(markup, /aria-busy="true"/);
    }
  });

  test(`${entry} GuardrailNotice preserves supplied literal and empty optional strings`, () => {
    const markup = render(
      h(Component, {
        title: "<strong>Title</strong> & title",
        explanation: "<script>explanation</script>",
        policy: "<b>Policy</b>",
        alternativesLabel: "<i>Try</i>",
        alternatives: [{ id: "a", text: "<em>Choice</em>" }],
      }),
    );
    for (const text of [
      "&lt;strong&gt;Title&lt;/strong&gt; &amp; title",
      "&lt;script&gt;explanation&lt;/script&gt;",
      "&lt;b&gt;Policy&lt;/b&gt;",
      "&lt;i&gt;Try&lt;/i&gt;",
      "&lt;em&gt;Choice&lt;/em&gt;",
    ])
      assert.ok(markup.includes(text));
    assert.doesNotMatch(markup, /<strong|<script|<b>|<i>|<em>/);
    const empty = render(
      h(Component, { title: "", explanation: "", policy: "", alternativesLabel: "", alternatives }),
    );
    assert.match(empty, /data-slot="badge"/);
    assert.match(empty, /<ul/);
    assert.doesNotMatch(empty, /Try instead/);
  });

  test(`${entry} GuardrailNotice preserves root composition and consumer native naming`, () => {
    const markup = render(
      h(Component, {
        ...basic,
        id: "host-notice",
        title: "Notice title",
        role: "alert",
        "aria-label": "Request warning",
        "aria-live": "assertive",
        "aria-busy": true,
        className: "host-notice",
        style: { color: "tomato" },
        tabIndex: 0,
        render: h("section", { "data-host": "retained" }),
      }),
    );
    assert.match(markup, /^<section/);
    for (const attribute of [
      'id="host-notice"',
      'role="alert"',
      'aria-label="Request warning"',
      'aria-live="assertive"',
      'aria-busy="true"',
      'data-host="retained"',
      'tabindex="0"',
      "color:tomato",
    ])
      assert.ok(markup.includes(attribute));
    assert.match(markup, /host-notice/);
    assert.match(markup, /data-slot="callout"/);
    assert.doesNotMatch(markup, / title=/);
  });

  test(`${entry} GuardrailNotice rejects empty and duplicate IDs while accepting repeated text`, () => {
    assert.throws(
      () => render(h(Component, { ...basic, alternatives: [{ id: "", text: "Empty" }] })),
      /GuardrailNotice.*nonempty/i,
    );
    assert.throws(
      () => render(h(Component, { ...basic, alternatives: [alternatives[0], alternatives[0]] })),
      /GuardrailNotice.*duplicate.*summary/i,
    );
    assert.doesNotThrow(() =>
      render(
        h(Component, {
          ...basic,
          alternatives: [
            { id: "a", text: "Same" },
            { id: "b", text: "Same" },
          ],
        }),
      ),
    );
  });
}
