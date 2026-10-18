import assert from "node:assert/strict";
import test from "node:test";
import { Loader, loaderVariants, Shimmer } from "@kind-ui/ai";
import * as subpath from "@kind-ui/ai/loader";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("Loader subpath retains the root runtime exports", () => {
  assert.equal(subpath.Loader, Loader);
  assert.equal(subpath.Shimmer, Shimmer);
  assert.equal(subpath.loaderVariants, loaderVariants);
});

for (const [entry, LoaderComponent, ShimmerComponent] of [
  ["root", Loader, Shimmer],
  ["subpath", subpath.Loader, subpath.Shimmer],
]) {
  test(`${entry} Loader infers names only from string children`, () => {
    assert.match(render(h(LoaderComponent)), /aria-label="Loading"/);
    assert.match(render(h(LoaderComponent, null, "Searching")), /aria-label="Searching"/);
    assert.match(render(h(LoaderComponent, null, "")), /aria-label=""/);
    for (const child of [0, 42, h("strong", null, "Preparing"), null, false]) {
      const markup = render(h(LoaderComponent, null, child));
      assert.doesNotMatch(markup, /aria-label=/);
      assert.match(markup, /role="status"/);
    }
    assert.match(render(h(LoaderComponent, null, 0)), />0</);
    assert.match(
      render(h(LoaderComponent, null, h("strong", null, "Preparing"))),
      /<strong>Preparing<\/strong>/,
    );
  });

  test(`${entry} Loader preserves native naming, role and render composition`, () => {
    const markup = render(
      h(
        LoaderComponent,
        {
          role: "note",
          "aria-label": "Host label",
          "aria-labelledby": "host-label",
          "aria-live": "off",
          id: "host-loader",
          title: "Host title",
          render: h("output", { "data-host": "present" }),
        },
        "Searching",
      ),
    );
    assert.match(markup, /^<output/);
    assert.match(markup, /role="note"/);
    assert.match(markup, /aria-label="Host label"/);
    assert.match(markup, /aria-labelledby="host-label"/);
    assert.match(markup, /aria-live="off"/);
    assert.match(markup, /id="host-loader"/);
    assert.match(markup, /title="Host title"/);
    assert.match(markup, /data-host="present"/);
    assert.doesNotMatch(
      render(h(LoaderComponent, { "aria-label": undefined }, "Searching")),
      /aria-label=/,
    );
  });

  test(`${entry} Loader normalizes duration and percentage spread to finite values`, () => {
    for (const variant of ["pulse", "shimmer", null]) {
      const fallback = variant === "pulse" ? "1.4s" : "2.2s";
      for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
        const markup = render(h(LoaderComponent, { variant, duration: value, spread: value }));
        assert.ok(markup.includes(`--kind-loader-duration:${fallback}`));
        assert.ok(markup.includes("--kind-loader-spread:40%"));
        assert.doesNotMatch(markup, /NaN|Infinity/);
      }
    }
    for (const [duration, spread, expectedDuration, expectedSpread] of [
      [-1, -1, "0.1s", "0%"],
      [0, 0, "0.1s", "0%"],
      [Number.MIN_VALUE, 1e308, "0.1s", "100%"],
      [1e308, 65, "1e+308s", "65%"],
    ]) {
      const markup = render(h(LoaderComponent, { duration, spread }));
      assert.ok(markup.includes(`--kind-loader-duration:${expectedDuration}`));
      assert.ok(markup.includes(`--kind-loader-spread:${expectedSpread}`));
    }
  });

  test(`${entry} Shimmer normalizes nonfinite inputs and spread multiplication overflow`, () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const markup = render(h(ShimmerComponent, { duration: value, spread: value }, "Kind"));
      assert.ok(markup.includes("--kind-loader-duration:2s"));
      assert.ok(markup.includes("--kind-loader-spread:8px"));
      assert.doesNotMatch(markup, /NaN|Infinity/);
    }
    for (const [children, spread, expected] of [
      ["Kind", Number.MAX_VALUE, "8px"],
      ["🙂", Number.MAX_VALUE, "4px"],
      ["K", 1e308, "1e+308px"],
      ["", Number.MAX_VALUE, "0px"],
      ["Kind", -2, "0px"],
      ["Kind", 0, "0px"],
    ]) {
      const markup = render(h(ShimmerComponent, { duration: -1, spread }, children));
      assert.ok(markup.includes(`--kind-loader-spread:${expected}`));
      assert.ok(markup.includes("--kind-loader-duration:0.1s"));
      assert.doesNotMatch(markup, /NaN|Infinity/);
    }
  });

  test(`${entry} Loader and Shimmer preserve consumer styles after normalization`, () => {
    for (const Component of [LoaderComponent, ShimmerComponent]) {
      const markup = render(
        h(
          Component,
          {
            duration: Number.NaN,
            spread: Number.POSITIVE_INFINITY,
            className: "host-class",
            style: {
              "--kind-loader-duration": "7s",
              "--kind-loader-spread": "12px",
              color: "tomato",
            },
          },
          "Text",
        ),
      );
      assert.ok(markup.includes("--kind-loader-duration:7s"));
      assert.ok(markup.includes("--kind-loader-spread:12px"));
      assert.ok(markup.includes("color:tomato"));
      assert.match(markup, /host-class/);
    }
    assert.match(
      render(h(ShimmerComponent, { as: "span", id: "host-shimmer" }, "Text")),
      /^<span id="host-shimmer"/,
    );
  });
}
