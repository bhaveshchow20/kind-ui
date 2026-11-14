import assert from "node:assert/strict";
import test from "node:test";
import * as H from "@kind-ui/primitives/hover-card";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

for (const [name, Root, Trigger] of [["HoverCard", H.HoverCard, H.HoverCardTrigger]]) {
  test(`${name} preserves native informative anchor semantics and consumer props`, () => {
    const output = render(
      h(
        Root,
        { openDelay: 150, closeDelay: 80 },
        h(
          Trigger,
          {
            href: "#brief",
            title: "Read the complete brief",
            ref: () => {},
            delay: 25,
            closeDelay: 50,
            className: (state) => (state.open ? "consumer-open" : "consumer-closed"),
            style: () => ({ color: "rebeccapurple" }),
            "data-owner": "consumer",
          },
          h("strong", null, "Launch brief"),
        ),
      ),
    );
    assert.match(output, /^<a /);
    assert.match(output, /href="#brief"/);
    assert.match(output, /title="Read the complete brief"/);
    assert.match(output, /data-owner="consumer"/);
    assert.match(output, /consumer-closed/);
    assert.match(output, /color:rebeccapurple/);
    assert.match(output, /<strong>Launch brief<\/strong>/);
    assert.doesNotMatch(output, /aria-haspopup|role="button"|openDelay=|closeDelay=| delay=/);
  });
}

test("HoverCard supports payload render children and trigger render composition", () => {
  const output = render(
    h(H.HoverCard, null, ({ payload }) =>
      h(
        H.HoverCardTrigger,
        { payload: { title: "Brief" }, render: h("a", { href: "#brief", lang: "en" }) },
        payload?.title ?? "Read the brief",
      ),
    ),
  );
  assert.match(output, /href="#brief"/);
  assert.match(output, /lang="en"/);
  assert.match(output, />Read the brief<\/a>/);
});

test("HoverCard convenience content retain portal composition during SSR", () => {
  for (const [Root, Trigger, Content] of [[H.HoverCard, H.HoverCardTrigger, H.HoverCardContent]]) {
    const output = render(
      h(
        Root,
        { defaultOpen: true },
        h(Trigger, { href: "#brief" }, "Launch brief"),
        h(
          Content,
          {
            side: "left",
            sideOffset: 12,
            alignOffset: 4,
            positionerProps: { className: "z-70" },
            portalProps: { "data-owner": "consumer" },
          },
          "Portalled preview",
        ),
      ),
    );
    assert.match(output, /Launch brief/);
    assert.doesNotMatch(output, /Portalled preview|positionerProps|portalProps/);
  }
});
