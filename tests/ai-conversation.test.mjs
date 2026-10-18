import assert from "node:assert/strict";
import test from "node:test";
import * as K from "@kind-ui/ai";
import { Conversation as ConversationSubpath } from "@kind-ui/ai/conversation";
import { Message as MessageSubpath } from "@kind-ui/ai/message";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("section subpaths resolve the public exports", async () => {
  assert.equal(ConversationSubpath, K.Conversation);
  assert.equal(MessageSubpath, K.Message);
  for (const [subpath, symbol, expected] of [
    ["composer-rich", "ComposerRichInput", K.ComposerRichInput],
    ["prompt-input", "PromptInput", K.PromptInput],
    ["model-selector", "ModelSelector", K.ModelSelector],
    ["suggestion", "Suggestion", K.Suggestion],
  ]) {
    assert.equal((await import(`@kind-ui/ai/${subpath}`))[symbol], expected);
  }
});

test("conversation serialization preserves host formatting and propagates errors", () => {
  const messages = [
    { role: "user", content: "First\nline", id: 1 },
    { role: "assistant", content: "", id: 2 },
  ];
  assert.equal(K.messagesToMarkdown([]), "");
  assert.equal(K.messagesToMarkdown(messages), "**User:** First\nline\n\n**Assistant:** ");
  assert.equal(
    K.messagesToMarkdown(messages, (message, index) => `${index}:${message.id}`),
    "0:1\n\n1:2",
  );
  assert.throws(
    () =>
      K.messagesToMarkdown(messages, () => {
        throw new Error("Host formatter failed");
      }),
    /Host formatter failed/,
  );
  assert.match(
    render(h(K.ConversationEmptyState, { title: "Empty", description: "Add a message" })),
    /Add a message/,
  );
});

test("parts requiring a provider fail with actionable errors", () => {
  for (const [Part, error] of [
    [K.ConversationContent, /useConversation must be used inside Conversation/],
    [K.MessageBranchPage, /Message branch parts require a MessageBranch parent/],
    [K.PromptInputTextarea, /PromptInputTextarea requires its PromptInput provider/],
    [K.ComposerSuggestions, /require ComposerRich/],
  ])
    assert.throws(() => render(h(Part)), error);
});

test("messages retain host lifecycle, safe Markdown and deterministic branch state", () => {
  const output = render(
    h(
      K.Message,
      { from: "assistant", status: "streaming", className: "consumer-message" },
      h(K.MessageResponse, { mode: "static" }, "[unsafe](javascript:alert(1))"),
    ),
  );
  assert.match(output, /data-state="streaming"/);
  assert.match(output, /aria-busy="true"/);
  assert.match(output, /consumer-message/);
  assert.doesNotMatch(output, /href="javascript:/);
  const branch = render(
    h(
      K.MessageBranch,
      { defaultBranch: 1 },
      h(
        K.MessageBranchContent,
        null,
        h("div", null, "First branch"),
        h("div", null, "Second branch"),
      ),
      h(
        K.MessageBranchSelector,
        null,
        h(K.MessageBranchPrevious),
        h(K.MessageBranchPage),
        h(K.MessageBranchNext),
      ),
    ),
  );
  assert.match(branch, /2 of 2/);
  assert.match(branch, /hidden="" data-slot="message-branch-panel" data-state="inactive"/);
  assert.match(branch, /aria-label="Previous branch"/);
  assert.match(branch, /Second branch/);
});

test("prompt controls retain names, native form state and explicit stop capability", () => {
  const renderPrompt = (status, onStop) =>
    render(
      h(
        K.PromptInput,
        { defaultValue: "Draft", onSubmit() {} },
        h(K.PromptInputTextarea),
        h(K.PromptInputSubmit, { status, onStop }),
      ),
    );
  assert.match(renderPrompt("ready"), /aria-label="Message"/);
  assert.match(renderPrompt("ready"), /name="message"[^>]*>Draft<\/textarea>/);
  const unavailable = renderPrompt("streaming");
  assert.match(unavailable, /<button[^>]*\sdisabled=""[^>]*aria-label="Stop response"/);
  const available = renderPrompt("streaming", () => {});
  assert.doesNotMatch(available, /<button[^>]*\sdisabled=""/);
  assert.match(
    render(h(K.PromptInputButton, { tooltip: "Add context" })),
    /aria-label="Add context"/,
  );
  assert.match(
    render(h(K.PromptInputButton, { tooltip: "Add context", "aria-label": "Choose files" })),
    /aria-label="Choose files"/,
  );
  assert.doesNotMatch(
    render(h(K.PromptInputButton, { tooltip: "Choose files" }, "Upload")),
    /aria-label=/,
  );
});

test("model selection composes primitive semantics and safe explicit provider assets", () => {
  const output = render(
    h(
      K.ModelSelector,
      { items: ["Atlas", "Field"], value: "Atlas", "aria-label": "Model" },
      h(K.ModelSelectorInput),
      h(
        K.ModelSelectorList,
        null,
        h(K.ModelSelectorItem, { value: "Atlas" }, "Atlas"),
        h(K.ModelSelectorItem, { value: "Field", disabled: true }, "Field"),
      ),
      h(K.ModelSelectorStatus, null, "Loading more models"),
    ),
  );
  assert.match(output, /role="combobox"/);
  assert.match(output, /aria-expanded="true"/);
  assert.match(output, /aria-selected="true"/);
  assert.match(output, /aria-disabled="true"/);
  assert.match(output, /Loading more models/);
  const fallback = render(
    h(K.ModelSelectorLogo, { provider: "Unknown", src: "javascript:alert(1)" }),
  );
  assert.match(fallback, /data-fallback="true"/);
  assert.match(fallback, /src="data:image\/svg\+xml,/);
  assert.doesNotMatch(fallback, /src="javascript:/);
  assert.match(
    render(
      h(K.ModelSelectorLogo, { provider: "Kind", src: "/providers/kind.svg", alt: "Kind model" }),
    ),
    /src="\/providers\/kind.svg"/,
  );
  const styled = render(
    h(K.ModelSelectorItemText, { className: "text-lg leading-tight text-red-500" }, "Model"),
  );
  assert.match(styled, /text-lg leading-tight text-red-500/);
  assert.doesNotMatch(styled, /text-ai-label/);
});

test("rich editor server shell and suggestions preserve composition without editor side effects", () => {
  const output = render(
    h(
      K.ComposerRich,
      null,
      h(K.ComposerRichInput, { placeholder: "Write here" }),
      h(K.ComposerSuggestions),
    ),
  );
  assert.match(output, /data-slot="composer-rich-input"/);
  assert.match(output, /Write here/);
  assert.doesNotMatch(output, /role="listbox"/);
});

test("suggestions retain native button semantics and public style helpers", () => {
  const output = render(
    h(
      K.Suggestions,
      null,
      h(K.Suggestion, { suggestion: "Explain", disabled: true, className: "consumer-suggestion" }),
    ),
  );
  assert.match(output, /<button[^>]*type="button"/);
  assert.match(output, /disabled=""/);
  assert.match(output, /consumer-suggestion/);
  assert.match(output, /Explain/);
  for (const helper of [K.suggestionVariants, K.messageTextVariants, K.modelSelectorVariants]) {
    assert.match(
      helper({ class: ["extra", { conditional: true }], className: "consumer" }),
      /extra conditional consumer/,
    );
  }
});
