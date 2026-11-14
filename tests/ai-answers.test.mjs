import assert from "node:assert/strict";
import test from "node:test";
import * as K from "@kind-ui/ai";
import { Status as PrimitiveStatus, statusVariants } from "@kind-ui/primitives/status";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("Status is the identical primitive compatibility export", () => {
  assert.equal(K.Status, PrimitiveStatus);
  assert.equal(K.statusVariants, statusVariants);
});

test("Question keeps native choices, labels, initial values and shared textarea/button", () => {
  const output = render(
    h(
      K.Question,
      {
        selectionMode: "multiple",
        defaultValue: { selectedValues: ["one"], text: "Existing answer" },
      },
      h(K.QuestionPrompt, null, "Pick answers"),
      h(K.QuestionOptions, null, h(K.QuestionOption, { value: "one" }, "First")),
      h(K.QuestionInput),
      h(K.QuestionSubmit),
    ),
  );
  assert.match(output, /<form/);
  assert.match(output, /<fieldset[^>]*aria-labelledby=/);
  assert.match(output, /<input[^>]*type="checkbox"[^>]*checked=""/);
  assert.match(output, /data-slot="question-input"/);
  assert.match(output, /Existing answer/);
  assert.match(output, /data-slot="button-content"/);
});

test("Prompt renders only its current step and retains the submit composition", () => {
  const output = render(
    h(
      K.Prompt,
      { defaultValues: { first: "yes" } },
      h(
        K.PromptStep,
        { name: "first" },
        h(K.PromptQuestion, null, "First question"),
        h(K.PromptOption, { value: "yes" }, "Yes"),
      ),
      h(K.PromptStep, { name: "second" }, h(K.PromptQuestion, null, "Second question")),
      h(K.PromptSubmit),
    ),
  );
  assert.match(output, /First question/);
  assert.doesNotMatch(output, /Second question/);
  assert.match(output, /<input[^>]*type="radio"[^>]*checked=""/);
  assert.match(output, /data-slot="prompt-submit"/);
});

test("Prompt Continue reflects enabled choices, write-in eligibility and consumer disabling", () => {
  for (const { options, promptProps, submitProps, disabled } of [
    { options: [], disabled: true },
    { options: [h(K.PromptOption, { value: "a", disabled: true }, "A")], disabled: true },
    { options: [h(K.PromptOption, { value: "a" }, "A")], disabled: false },
    { options: [h(K.PromptOptionOther, { key: "other" })], disabled: true },
    {
      options: [h(K.PromptOptionOther, { key: "other" })],
      promptProps: { defaultValues: { choice: "   " } },
      disabled: true,
    },
    {
      options: [h(K.PromptOptionOther, { key: "other" })],
      promptProps: { defaultValues: { choice: "Custom" } },
      disabled: false,
    },
    {
      options: [h(K.PromptOption, { value: "a" }, "A")],
      promptProps: { disabled: true },
      disabled: true,
    },
    {
      options: [h(K.PromptOption, { value: "a" }, "A")],
      submitProps: { disabled: true },
      disabled: true,
    },
  ]) {
    const output = render(
      h(
        K.Prompt,
        promptProps,
        h(K.PromptStep, { name: "choice" }, ...options),
        h(K.PromptSubmit, submitProps),
      ),
    );
    const button = output.match(/<button[^>]*data-slot="prompt-submit"[^>]*>/)?.[0];
    assert.ok(button);
    assert.equal(button.includes('disabled=""'), disabled, button);
  }
  const empty = render(h(K.Prompt, null, h(K.PromptSubmit)));
  assert.match(empty, /<button(?=[^>]*data-slot="prompt-submit")(?=[^>]*disabled="")[^>]*>/);
});

test("GeneratedImage renders explicit lifecycle states and only supplied capabilities", () => {
  for (const state of ["queued", "generating", "complete", "error"]) {
    const output = render(
      h(
        K.GeneratedImage,
        { state },
        h(K.GeneratedImagePlaceholder, null, "Queued"),
        h(K.GeneratedImageLoading, null, "Generating"),
        h(K.GeneratedImageError, null, "Failed"),
        h(K.GeneratedImageProgress, { value: 0 }),
        h(K.GeneratedImageRetry),
        h(K.GeneratedImageCancel),
      ),
    );
    assert.match(output, new RegExp(`data-state="${state}"`));
    assert.equal(output.includes('data-slot="generated-image-placeholder"'), state === "queued");
    assert.equal(output.includes('data-slot="generated-image-loading"'), state === "generating");
    assert.equal(output.includes('data-slot="generated-image-error"'), state === "error");
    if (state === "generating") assert.match(output, /<progress[^>]*value="0"/);
    if (state !== "complete") assert.match(output, /<button[^>]*disabled=""/);
  }
});

test("GeneratedImage image URLs retain supported sources and reject unsafe protocols", () => {
  for (const src of [
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "//remote/image.png",
  ]) {
    const output = render(h(K.GeneratedImageContent, { src, alt: "Image description" }));
    assert.doesNotMatch(output, /<img[^>]*src=/);
    assert.match(output, /alt="Image description"/);
  }
  const output = render(h(K.GeneratedImageContent, { src: "/local.png", alt: "Local" }));
  assert.match(output, /src="\/local.png"/);
  assert.match(output, /referrerPolicy="no-referrer"/i);
});

test("Transcript timestamps retain seek capability and invalid-time semantics", () => {
  for (const [start, label] of [
    [0, "0:00"],
    [3661, "1:01:01"],
    [-1, "–:––"],
  ]) {
    const output = render(
      h(
        K.Transcript,
        { currentTime: 0 },
        h(
          K.TranscriptContent,
          null,
          h(
            K.TranscriptItem,
            { start },
            h(K.TranscriptTime),
            h(K.TranscriptText, { interim: true }, "Words"),
          ),
        ),
      ),
    );
    assert.ok(output.includes(`Seek to ${label}`));
    assert.match(output, /<button[^>]*disabled=""/);
    assert.match(output, /data-interim=""/);
    assert.match(output, /tabindex="0"/);
  }
});

test("FeedbackBar, Callout and Loader preserve visibility, semantics and consumer composition", () => {
  assert.equal(render(h(K.FeedbackBar, { open: false }, "Hidden")), "");
  assert.match(render(h(K.FeedbackBar, null, h(K.FeedbackBarDismiss))), /Dismiss feedback/);
  assert.match(
    render(h(K.Callout, { tone: "danger" }, h(K.CalloutContent, null, "Failure"))),
    /role="alert"/,
  );
  assert.match(render(h(K.Callout, { tone: "info" })), /role="note"/);
  assert.match(render(h(K.Loader, { dots: true }, "Working")), /data-slot="thinking-dots"/);
  assert.match(
    render(h(K.Loader, { render: h("output") }, "Working")),
    /<output[^>]*role="status"/,
  );
  assert.match(render(h(K.Shimmer, { as: "h2", duration: 3 }, "Working")), /<h2/);
});

test("orphan compound parts fail with actionable parent requirements", () => {
  for (const [Part, props, message] of [
    [K.QuestionInput, {}, /Question parent/],
    [K.PromptSubmit, {}, /Prompt parent/],
    [K.GeneratedImageRetry, {}, /within GeneratedImage/],
    [K.DocumentContent, {}, /require <Document>/],
    [K.TranscriptTime, {}, /TranscriptItem parent/],
    [K.FeedbackBarDismiss, {}, /requires FeedbackBar/],
  ])
    assert.throws(() => render(h(Part, props)), message);
});

test("section variant helpers retain conditional classes and nullable omission", () => {
  for (const helper of [
    K.calloutVariants,
    K.statusVariants,
    K.loaderVariants,
    K.generatedImageVariants,
    K.generatedImageOverlayVariants,
    K.generatedImageActionVariants,
  ]) {
    assert.match(
      helper({
        class: ["consumer-extra", { "conditional-extra": true }],
        className: "consumer-name",
      }),
      /consumer-extra/,
    );
    assert.match(helper({ class: { "conditional-extra": true } }), /conditional-extra/);
  }
  assert.doesNotMatch(K.loaderVariants({ variant: null }), /animate-pulse|kind-shimmer/);
});

test("Markdown rejects script links and raw HTML while retaining relative links", () => {
  const output = render(
    h(
      K.Markdown,
      { mode: "static", linkSafety: { enabled: false } },
      "[unsafe](javascript:alert%281%29) [relative](notes.md) <img src=x onerror=alert(1)>",
    ),
  );
  assert.doesNotMatch(output, /href="javascript:/);
  assert.doesNotMatch(output, /<img[^>]*onerror/);
  assert.match(output, /href="notes.md"/);
});

test("Markdown tables retain artifact actions and a keyboard focus target", () => {
  const output = render(
    h(
      K.Markdown,
      { mode: "static" },
      "| Audience | Outcome |\n| --- | --- |\n| Teams | A shared brief |",
    ),
  );
  assert.match(output, /<table[^>]*tabindex="0"/);
  assert.match(output, /Copy table/);
  assert.match(output, /Download table/);
  assert.match(output, /View fullscreen/);
  assert.match(output, /data-slot="table-container"/);
  assert.match(output, /data-slot="table-head"/);
  assert.match(output, /data-slot="button-content"/);
  assert.doesNotMatch(output, /data-streamdown="table-wrapper"/);
});

test("Markdown table controls, alignment and rich native cells pass through the shared Table", () => {
  const source = "| Name | Count |\n| :--- | ---: |\n| **Teams** | 0 |";
  for (const wrap of [
    (child) => child,
    (child) => h(K.Document, { open: true }, h(K.DocumentContent, null, child)),
  ]) {
    const output = render(wrap(h(K.Markdown, { mode: "static" }, source)));
    assert.equal((output.match(/data-slot="table-container"/g) ?? []).length, 1);
    assert.match(output, /<span[^>]*data-streamdown="strong"[^>]*>Teams<\/span>/);
    assert.match(output, /text-align:right/);
    assert.match(output, />0<\/td>/);
  }
  const hiddenControls = render(
    h(K.Markdown, { mode: "static", controls: { table: false } }, source),
  );
  assert.match(hiddenControls, /data-slot="table"/);
  assert.doesNotMatch(hiddenControls, /data-slot="table-toolbar"/);
  const downloadOnly = render(
    h(
      K.Markdown,
      {
        mode: "static",
        controls: { table: { copy: false, fullscreen: false } },
        translations: { downloadTable: "Save this data" },
      },
      source,
    ),
  );
  assert.match(downloadOnly, /aria-label="Save this data"/);
  assert.doesNotMatch(
    downloadOnly,
    /data-slot="table-copy-menu"|data-slot="table-fullscreen-trigger"/,
  );
  const customCell = render(
    h(
      K.Markdown,
      {
        mode: "static",
        components: { td: ({ children }) => h("td", { "data-consumer-cell": true }, children) },
      },
      source,
    ),
  );
  assert.match(customCell, /data-consumer-cell="true"/);
  assert.doesNotMatch(customCell, /data-slot="table-cell"/);
  const customTable = render(
    h(
      K.Markdown,
      {
        mode: "static",
        components: {
          table: ({ children }) => h("table", { "data-consumer-table": true }, children),
        },
      },
      source,
    ),
  );
  assert.match(customTable, /data-consumer-table="true"/);
  assert.doesNotMatch(customTable, /data-slot="table-container"/);
  const streaming = render(h(K.Markdown, { streaming: true }, source));
  assert.match(streaming, /<button(?=[^>]*data-slot="table-copy-menu")(?=[^>]*disabled="")[^>]*>/);
});

test("Markdown and Document share CodeBlock while preserving inline code and control options", () => {
  const source = "Inline `value`.\n\n```ts\nconst value = 1;\n\nvalue;\n```";
  for (const wrap of [
    (child) => child,
    (child) => h(K.Document, { open: true }, h(K.DocumentContent, null, child)),
  ]) {
    const output = render(wrap(h(K.Markdown, { mode: "static" }, source)));
    assert.equal((output.match(/data-slot="code-block"/g) ?? []).length, 1);
    assert.match(output, /data-slot="code-block-content"/);
    assert.match(output, /data-slot="button-content"/);
    assert.match(output, /data-streamdown="inline-code"/);
    assert.doesNotMatch(output, /data-streamdown="code-block"/);
  }
  const disabled = render(h(K.Markdown, { mode: "static", controls: { code: false } }, source));
  assert.match(disabled, /data-slot="code-block-content"/);
  assert.doesNotMatch(disabled, /data-slot="code-block-actions"/);
  const copyOnly = render(
    h(
      K.Markdown,
      {
        mode: "static",
        controls: { code: { download: false } },
        translations: { copyCode: "Copy snippet" },
      },
      source,
    ),
  );
  assert.match(copyOnly, /aria-label="Copy snippet"/);
  assert.doesNotMatch(copyOnly, /data-slot="code-block-download-button"/);
  const streaming = render(h(K.Markdown, { streaming: true }, source));
  assert.match(
    streaming,
    /<button(?=[^>]*data-slot="code-block-copy-button")(?=[^>]*disabled="")[^>]*>/,
  );
});

test("Markdown custom pre, code and language renderers retain consumer ownership", () => {
  const source = "```ts\nconst value = 1;\n```";
  const customCode = render(
    h(
      K.Markdown,
      {
        mode: "static",
        components: { code: ({ children }) => h("code", { "data-custom-code": true }, children) },
      },
      source,
    ),
  );
  assert.match(customCode, /data-custom-code="true"/);
  assert.doesNotMatch(customCode, /data-slot="code-block"/);
  const customPre = render(
    h(
      K.Markdown,
      {
        mode: "static",
        components: { pre: () => h("pre", { "data-custom-pre": true }, "Consumer code") },
      },
      source,
    ),
  );
  assert.match(customPre, /data-custom-pre="true"/);
  assert.doesNotMatch(customPre, /data-slot="code-block"/);
  const customLanguage = render(
    h(
      K.Markdown,
      {
        mode: "static",
        plugins: {
          renderers: [{ language: "ts", component: ({ code }) => h("output", null, code) }],
        },
      },
      source,
    ),
  );
  assert.match(customLanguage, /<output>const value = 1;/);
  assert.doesNotMatch(customLanguage, /data-slot="code-block"/);
  const plain = render(
    h(K.Markdown, { mode: "static", plugins: {} }, "```unknown\n<literal>\n```"),
  );
  assert.match(plain, /data-slot="code-block"/);
  assert.match(plain, /&lt;literal&gt;/);
});

test("Document consumer max-height overrides stay on the original content box", () => {
  for (const [maxHeight, serialized] of [
    [400, "400px"],
    ["none", "none"],
    ["50%", "50%"],
  ]) {
    const output = render(
      h(
        K.Document,
        { contentId: "sized-document", collapsedHeight: 200 },
        h(K.DocumentContent, { style: { maxHeight } }, "Sized preview content"),
      ),
    );
    const outer = output.match(/<div[^>]*data-slot="document-content"[^>]*>/)?.[0];
    const viewport = output.match(/<div[^>]*data-slot="collapsible-preview-viewport"[^>]*>/)?.[0];
    assert.ok(outer);
    assert.ok(viewport);
    assert.ok(outer.includes(`max-height:${serialized}`), outer);
    assert.doesNotMatch(viewport, /max-height:/);
    assert.equal((output.match(/Sized preview content/g) ?? []).length, 1);
  }
});
