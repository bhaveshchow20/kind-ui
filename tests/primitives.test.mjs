import assert from "node:assert/strict";
import test from "node:test";
import * as P from "@kind-ui/primitives";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("code surface theme styles remain separate from scroll-container dimensions", () => {
  const output = render(
    h(
      P.CodeBlock,
      { code: "const value = 1;" },
      h(P.CodeBlockContent, {
        style: { maxHeight: 200 },
        preStyle: { fontFamily: "serif", fontStyle: "italic" },
      }),
    ),
  );
  const content = output.match(/<div[^>]*data-slot="code-block-content"[^>]*>/)?.[0];
  const pre = output.match(/<pre[^>]*data-slot="code-block-pre"[^>]*>/)?.[0];
  assert.ok(content?.includes("max-height:200px"));
  assert.ok(pre?.includes("font-family:serif"));
  assert.ok(pre?.includes("font-style:italic"));
  assert.ok(!pre?.includes("max-height"));
});

test("default shared disclosure and overlay triggers use the complete Button runtime", () => {
  for (const [Root, Trigger] of [
    [P.Collapsible, P.CollapsibleTrigger],
    [P.Popover, P.PopoverTrigger],
    [P.Menu, P.MenuTrigger],
  ]) {
    const output = render(h(Root, null, h(Trigger, null, "Details")));
    assert.equal((output.match(/<button\b/g) ?? []).length, 1);
    assert.match(output, /data-slot="button-content"/);
  }
});

test("badge composition preserves native attributes, custom markup and consumer overrides", () => {
  const output = render(
    h(
      P.Badge,
      {
        tone: "danger",
        size: "lg",
        render: h("output"),
        "aria-label": "Unresolved items",
        className: "rounded-none bg-blue-500 text-white text-lg",
      },
      0,
    ),
  );
  assert.match(output, /^<output /);
  assert.match(output, /aria-label="Unresolved items"/);
  assert.match(output, /rounded-none/);
  assert.match(output, /bg-blue-500/);
  assert.match(output, /text-white/);
  assert.doesNotMatch(output, /text-danger-text|bg-destructive\/5|rounded-full/);
  assert.match(output, />0<\/output>/);
});

test("status conveys a label alongside color and permits a zero-value label", () => {
  const output = render(h(P.Status, { state: "pending", pulse: true }, 0));
  assert.match(output, /data-state="pending"/);
  assert.match(output, /aria-hidden="true"/);
  assert.match(output, /motion-safe:animate-pulse/);
  assert.match(output, /<\/span>0<\/span>/);
});

test("shared class merging keeps typography and foreground overrides independent", () => {
  assert.equal(
    P.cn("text-sm text-muted-foreground", "text-ai-label text-white"),
    "text-ai-label text-white",
  );
});

test("loading Button prevents repeated submission while native props and zero counts survive", () => {
  const loading = render(
    h(P.Button, { type: "submit", loading: true, loadingText: "Saving" }, "Save"),
  );
  assert.match(loading, /type="submit"/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /disabled=""/);
  assert.match(loading, /Saving/);
  const idle = render(h(P.Button, { count: 0 }, "Items"));
  assert.match(idle, /data-slot="button-count"[^>]*>0<\/span>/);
});

test("Textarea retains form semantics and explicit fixed sizing", () => {
  const output = render(
    h(P.Textarea, {
      name: "note",
      rows: 3,
      defaultValue: "A note",
      autoGrow: false,
      readOnly: true,
      "aria-label": "Note",
    }),
  );
  assert.match(output, /name="note"/);
  assert.match(output, /rows="3"/);
  assert.match(output, /readOnly=""/i);
  assert.match(output, /field-sizing-fixed/);
  assert.match(output, />A note<\/textarea>/);
});

test("controlled disclosure state, native trigger state and class callbacks survive composition", () => {
  const output = render(
    h(
      P.Collapsible,
      { open: true, className: (state) => (state.open ? "consumer-open" : "consumer-closed") },
      h(P.CollapsibleTrigger, { disabled: true }, "Details"),
      h(P.CollapsibleContent, null, "Visible detail"),
    ),
  );
  assert.match(output, /consumer-open/);
  assert.match(output, /aria-expanded="true"/);
  assert.match(output, /aria-disabled="true"/);
  assert.match(output, /Visible detail/);
});

test("overlay triggers preserve native semantics and custom button rendering during SSR", () => {
  const popover = render(
    h(
      P.Popover,
      { open: true },
      h(
        P.PopoverTrigger,
        { render: h("button", { type: "button" }), "aria-label": "Edit note" },
        "Edit",
      ),
    ),
  );
  assert.match(popover, /<button /);
  assert.match(popover, /type="button"/);
  assert.match(popover, /aria-label="Edit note"/);
  const menu = render(h(P.Menu, { open: true }, h(P.MenuTrigger, null, "Actions")));
  assert.match(menu, /aria-haspopup="menu"/);
  assert.match(menu, /Actions/);
});

test("CodeBlock provides shared default layout, actions, gutter and native overrides", () => {
  const output = render(
    h(P.CodeBlock, {
      code: "const answer = 42;\n\nreturn answer;\n",
      language: "typescript",
      filename: "answer.ts",
      startLine: 8,
      title: "Code example",
      className: "rounded-none",
      style: { maxHeight: 240 },
      "data-owner": "reader",
    }),
  );
  assert.match(output, /^<div[^>]*data-slot="code-block"/);
  assert.match(output, /data-owner="reader"/);
  assert.match(output, /title="Code example"/);
  assert.match(output, /rounded-none/);
  assert.match(output, /max-height:240px/);
  assert.match(output, /data-slot="code-block-language"[^>]*>typescript</);
  assert.match(output, /data-slot="code-block-header"/);
  assert.match(output, /data-slot="code-block-actions"/);
  assert.match(output, /data-slot="code-block-pre"/);
  assert.match(output, /data-wrap="true"/);
  assert.match(output, /data-line-numbers="true"/);
  assert.match(output, /counter-reset:line 7/);
  assert.equal((output.match(/class="[^"]*\bblock relative min-h-\[1lh\]/g) ?? []).length, 3);
  assert.equal((output.match(/data-slot="button-content"/g) ?? []).length, 2);
  assert.ok(
    output.indexOf('aria-label="Download file"') < output.indexOf('aria-label="Copy Code"'),
  );
  assert.match(output, /whitespace-pre-wrap/);
  assert.match(output, /before:absolute/);
});

test("CodeBlock composition preserves explicit children, labels and horizontal scrolling", () => {
  const output = render(
    h(
      P.CodeBlock,
      { code: "one\ntwo", wrap: false, lineNumbers: false },
      h(
        P.CodeBlockHeader,
        { title: "Custom header" },
        h(P.CodeBlockLanguage, null, "Source"),
        h(
          P.CodeBlockActions,
          null,
          h(P.CodeBlockCopyButton, { "aria-label": "Copy source", disabled: true }, "Copy"),
        ),
      ),
      h(P.CodeBlockContent, { "aria-label": "Source code", className: "custom-code" }),
    ),
  );
  assert.match(output, /title="Custom header"/);
  assert.match(output, />Source</);
  assert.match(output, /aria-label="Copy source"/);
  assert.match(output, /disabled=""/);
  assert.match(output, /tabindex="0"/);
  assert.match(output, /aria-label="Source code"/);
  assert.match(output, /custom-code/);
  assert.match(output, /overflow-x-auto/);
  assert.doesNotMatch(output, /before:absolute|Download file/);
  assert.doesNotMatch(render(h(P.CodeBlock, { code: "hidden" }, null)), />hidden</);
});

test("CodeBlock renders token text safely and retains theme colors and supported attributes", () => {
  const output = render(
    h(P.CodeBlock, {
      code: '<script>alert("code")</script>',
      tokens: [
        [
          {
            content: "<script>unsafe</script>",
            color: "#f00",
            bgColor: "#000",
            htmlStyle: { "--shiki-dark": "#0f0", "font-style": "italic" },
            htmlAttrs: {
              class: "consumer-token",
              "data-symbol": "script",
              title: "A token tooltip",
              id: "highlight-token",
              "aria-label": "Script token",
              lang: "en",
              tabindex: "0",
              contenteditable: "false",
              itemprop: "code",
              onClick: "unsafe()",
              children: "replacement-token-text",
              ref: "unsafe-ref",
              onmouseover: "unsafe()",
              dangerouslySetInnerHTML: "unsafe",
              style: "color:pink",
            },
          },
        ],
        [],
      ],
    }),
  );
  assert.match(output, /&lt;script&gt;unsafe&lt;\/script&gt;/);
  assert.match(output, /--sdm-c:#f00/);
  assert.match(output, /--sdm-tbg:#000/);
  assert.match(output, /--shiki-dark:#0f0/);
  assert.match(output, /font-style:italic/);
  assert.match(output, /consumer-token/);
  assert.match(output, /data-symbol="script"/);
  assert.match(output, /title="A token tooltip"/);
  assert.match(output, /id="highlight-token"/);
  assert.match(output, /aria-label="Script token"/);
  assert.match(output, /lang="en"/);
  assert.match(output, /tabindex="0"/);
  assert.match(output, /contentEditable="false"/);
  assert.match(output, /itemProp="code"/);
  assert.doesNotMatch(output, /onClick|replacement-token-text|unsafe-ref/);
  assert.doesNotMatch(output, /<script>|onmouseover|dangerouslySetInnerHTML|color:pink/);
  assert.equal((output.match(/class="[^"]*\bblock relative min-h-\[1lh\]/g) ?? []).length, 2);
});

test("CodeBlock keeps one blank line for empty input and requires action context", () => {
  const output = render(h(P.CodeBlock, { code: "", tokens: [] }));
  assert.equal((output.match(/class="[^"]*\bblock relative min-h-\[1lh\]/g) ?? []).length, 1);
  for (const Part of [
    P.CodeBlockLanguage,
    P.CodeBlockContent,
    P.CodeBlockCopyButton,
    P.CodeBlockDownloadButton,
  ]) {
    assert.throws(() => render(h(Part)), /must be used within CodeBlock/);
  }
});

test("CodeBlock gutter fits large line numbers and normalizes invalid starting lines", () => {
  const output = render(h(P.CodeBlock, { code: "first\nsecond", startLine: 10000 }));
  assert.match(output, /counter-reset:line 9999/);
  assert.match(output, /--kind-code-gutter:max\(2\.5rem, calc\(5ch \+ 0\.75rem\)\)/);
  assert.match(output, /ps-\[var\(--kind-code-gutter\)\]/);
  assert.match(output, /before:w-\[calc\(var\(--kind-code-gutter\)-0\.75rem\)\]/);
  const boundary = render(h(P.CodeBlock, { code: "first\nsecond", startLine: 9999 }));
  assert.match(boundary, /--kind-code-gutter:max\(2\.5rem, calc\(5ch \+ 0\.75rem\)\)/);
  for (const startLine of [0, -1, 1.5, NaN, Infinity, -Infinity]) {
    assert.match(render(h(P.CodeBlock, { code: "source", startLine })), /counter-reset:line 0/);
  }
});
