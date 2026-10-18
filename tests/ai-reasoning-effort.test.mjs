import assert from "node:assert/strict";
import test from "node:test";
import { ReasoningEffort } from "@kind-ui/ai";
import * as subpath from "@kind-ui/ai/reasoning-effort";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const levels = [
  { key: "low", label: "Quick", budget: 10 },
  { key: "high", label: "Thorough", budget: 100 },
];

test("ReasoningEffort root and subpath expose the same component", () => {
  assert.equal(subpath.ReasoningEffort, ReasoningEffort);
});

for (const [entry, Component] of [
  ["root", ReasoningEffort],
  ["subpath", subpath.ReasoningEffort],
]) {
  test(`${entry} ReasoningEffort retains controlled selection and raw consumption`, () => {
    const markup = render(h(Component, { levels, selectedKey: "low", spent: 15, onSelect() {} }));
    assert.match(markup, /<fieldset[^>]*aria-label="Thinking"/);
    assert.match(markup, /type="button"/);
    assert.equal((markup.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.equal((markup.match(/aria-pressed="false"/g) ?? []).length, 1);
    assert.match(markup, /role="meter"/);
    assert.match(markup, /aria-label="Thinking budget used"/);
    assert.match(markup, /aria-valuetext="15 \/ 10 used"/);
    assert.match(markup, /aria-valuenow="1"/);
    assert.match(markup, /aria-valuemin="0"/);
    assert.match(markup, /aria-valuemax="1"/);
    assert.match(markup, />15 \/ 10 used</);
    assert.doesNotMatch(markup, /role="progressbar"|complete/i);
  });

  test(`${entry} ReasoningEffort displays static current labels and valid zero`, () => {
    const markup = render(h(Component, { levels, selectedKey: "high", spent: 0 }));
    assert.doesNotMatch(markup, /<button|aria-pressed/);
    assert.match(markup, /aria-current="true"[^>]*>Thorough</);
    assert.match(markup, /aria-valuenow="0"/);
    assert.match(markup, /aria-valuetext="0 \/ 100 used"/);
  });

  test(`${entry} ReasoningEffort animation preserves current semantics and actual consumption`, () => {
    for (const animated of [false, true]) {
      const markup = render(
        h(Component, { levels, selectedKey: "high", spent: 150, animated, onSelect() {} }),
      );
      assert.match(markup, /aria-valuetext="150 \/ 100 used"/);
      assert.match(markup, /aria-valuenow="1"/);
      assert.match(markup, />150 \/ 100 used</);
      assert.equal((markup.match(/aria-pressed="true"/g) ?? []).length, 1);
      assert.doesNotMatch(markup, /NaN|Infinity|role="progressbar"/);
    }
  });

  for (const scenario of [
    { name: "unknown selection", levels, selectedKey: "missing", spent: 0, text: /unavailable/i },
    { name: "empty levels", levels: [], selectedKey: "low", spent: 0, text: /unavailable/i },
    {
      name: "zero budget",
      levels: [{ key: "low", label: "Quick", budget: 0 }],
      selectedKey: "low",
      spent: 2,
      text: /no budget/i,
    },
    {
      name: "negative budget",
      levels: [{ key: "low", label: "Quick", budget: -1 }],
      selectedKey: "low",
      spent: 2,
      text: /unavailable/i,
    },
    {
      name: "nonfinite budget",
      levels: [{ key: "low", label: "Quick", budget: Infinity }],
      selectedKey: "low",
      spent: 2,
      text: /unavailable/i,
    },
    { name: "negative spend", levels, selectedKey: "low", spent: -1, text: /unavailable/i },
    { name: "nonfinite spend", levels, selectedKey: "low", spent: NaN, text: /unavailable/i },
  ]) {
    test(`${entry} ReasoningEffort omits the meter for ${scenario.name}`, () => {
      const markup = render(
        h(Component, {
          levels: scenario.levels,
          selectedKey: scenario.selectedKey,
          spent: scenario.spent,
        }),
      );
      assert.doesNotMatch(markup, /role="meter"|aria-valuenow/);
      if (scenario.name === "unknown selection") assert.doesNotMatch(markup, /aria-current="true"/);
      assert.match(markup, scenario.text);
      assert.doesNotMatch(markup, /NaN|Infinity/);
    });
  }

  test(`${entry} ReasoningEffort keeps normalized CSS finite for extreme consumption`, () => {
    for (const [spent, budget, now] of [
      [1e308, 1e308, "1"],
      [1e308, Number.MIN_VALUE, "1"],
      [Number.MIN_VALUE, 1e308, "0"],
      [Number.MIN_VALUE, Number.MIN_VALUE, "1"],
    ]) {
      const markup = render(
        h(Component, {
          levels: [{ key: "only", label: "Only", budget }],
          selectedKey: "only",
          spent,
        }),
      );
      assert.match(markup, /role="meter"/);
      assert.ok(markup.includes(`aria-valuenow="${now}"`));
      assert.ok(markup.includes(`aria-valuetext="${String(spent)} / ${String(budget)} used"`));
      assert.doesNotMatch(markup, /NaN|Infinity/);
    }
  });

  test(`${entry} ReasoningEffort rejects duplicate keys without rejecting duplicate wording`, () => {
    assert.throws(
      () => render(h(Component, { levels: [levels[0], levels[0]], selectedKey: "low", spent: 0 })),
      /ReasoningEffort.*duplicate.*low/i,
    );
    assert.doesNotThrow(() =>
      render(
        h(Component, {
          levels: [
            { key: "a", label: "Same", budget: 1 },
            { key: "b", label: "Same", budget: 2 },
          ],
          selectedKey: "b",
          spent: 0,
        }),
      ),
    );
  });

  test(`${entry} ReasoningEffort forwards native props and renders supplied strings literally`, () => {
    const markup = render(
      h(Component, {
        levels: [{ key: "a", label: "<quick> & useful", budget: 8 }],
        selectedKey: "a",
        spent: 2,
        label: "Effort choice",
        meterLabel: "Measured use",
        disabled: true,
        onSelect() {},
        id: "effort",
        role: "note",
        className: "host-effort",
        title: "Host",
        style: { color: "tomato" },
      }),
    );
    assert.match(markup, /^<div[^>]*id="effort"/);
    assert.match(markup, /role="note"/);
    assert.match(markup, /host-effort/);
    assert.match(markup, /color:tomato/);
    assert.match(markup, /aria-label="Effort choice"/);
    assert.match(markup, /aria-label="Measured use"/);
    assert.match(markup, /&lt;quick&gt; &amp; useful/);
    assert.match(markup, /disabled=""/);
    assert.match(markup, /aria-pressed="true"/);
  });
}
