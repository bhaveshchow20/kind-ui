import assert from "node:assert/strict";
import test from "node:test";
import * as D from "@kind-ui/primitives/dialog";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("Dialog exposes independently composable public parts", () => {
  for (const part of [
    D.Dialog,
    D.DialogTrigger,
    D.DialogPortal,
    D.DialogBackdrop,
    D.DialogPopup,
    D.DialogTitle,
    D.DialogDescription,
    D.DialogClose,
    D.DialogContent,
  ])
    assert.equal(typeof part, "function");
});

test("Dialog trigger uses a single shared Button and preserves native attributes", () => {
  const output = render(
    h(
      D.Dialog,
      null,
      h(
        D.DialogTrigger,
        { disabled: true, name: "note", value: "edit", className: "rounded-none px-8" },
        "Edit note",
      ),
    ),
  );
  assert.equal((output.match(/<button\b/g) ?? []).length, 1);
  assert.match(output, /data-slot="dialog-trigger"/);
  assert.match(output, /data-slot="button-content"/);
  assert.match(output, /name="note"/);
  assert.match(output, /value="edit"/);
  assert.match(output, /disabled=""/);
  assert.match(output, /rounded-none/);
  assert.match(output, /px-8/);
});

test("Dialog custom renders and stateful classes preserve consumer ownership", () => {
  const output = render(
    h(
      D.Dialog,
      null,
      h(
        D.DialogTrigger,
        {
          disabled: true,
          className: (state) => (state.disabled ? "consumer-disabled" : "consumer-active"),
          render: (props, state) =>
            h("button", { ...props, type: "button", "data-custom-open": state.open }),
        },
        "Custom note",
      ),
      h(
        D.DialogClose,
        { render: h("button", { type: "button" }), className: "custom-close" },
        "Done",
      ),
    ),
  );
  assert.match(output, /consumer-disabled/);
  assert.match(output, /data-custom-open="false"/);
  assert.match(output, /custom-close/);
  assert.match(output, /Custom note/);
  assert.doesNotMatch(output, /data-slot="button-content"/);
});

test("Dialog text and close parts preserve native semantics, render callbacks and overrides during SSR", () => {
  const output = render(
    h(
      D.Dialog,
      { defaultOpen: true },
      h(D.DialogBackdrop, { className: "bg-black/70" }),
      h(D.DialogTitle, { render: h("h3"), className: "text-lg" }, "Working note"),
      h(D.DialogDescription, { className: "text-xs" }, "Choose the next step."),
      h(D.DialogClose, { name: "close-note" }, "Close note"),
    ),
  );
  assert.match(output, /bg-black\/70/);
  assert.doesNotMatch(output, /bg-black\/40/);
  assert.match(output, /<h3[^>]*data-slot="dialog-title"[^>]*>Working note<\/h3>/);
  assert.match(output, /text-lg/);
  assert.match(output, /data-slot="dialog-description"/);
  assert.match(output, /text-xs/);
  assert.match(output, /Choose the next step\./);
  assert.match(output, /motion-reduce:transition-none/);
  assert.match(output, /data-slot="button-content"/);
  assert.match(output, /name="close-note"/);
});

test("DialogPopup retains the required portal composition boundary", () => {
  assert.throws(
    () => render(h(D.Dialog, { defaultOpen: true }, h(D.DialogPopup, null, "Invalid surface"))),
    /<Dialog\.Portal> is missing/,
  );
});

test("Dialog portalled convenience remains safe during server rendering", () => {
  const output = render(
    h(
      D.Dialog,
      { defaultOpen: true },
      h(D.DialogTrigger, null, "Edit"),
      h(
        D.DialogContent,
        { keepMounted: true, themeSource: { current: null } },
        h(D.DialogTitle, null, "Client surface"),
      ),
    ),
  );
  assert.match(output, /Edit/);
  assert.doesNotMatch(output, /Client surface/);
});
