import {
  ComposerRich,
  ComposerRichInput,
  ComposerSuggestions,
  type ComposerTrigger,
  type ComposerValue,
  Conversation,
  ConversationContent,
  ConversationDownload,
  type ConversationHandle,
  Message,
  MessageResponse,
  ModelSelector,
  ModelSelectorCollection,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  Suggestion,
} from "@kind-ui/ai";
import type { Editor } from "@tiptap/core";
import { createRef } from "react";

const conversationRef = createRef<ConversationHandle>();
const editorRef = createRef<Editor>();
const draft: ComposerValue<{ url: string }> = {
  text: "Read",
  segments: [
    { type: "chip", trigger: "@", item: { id: "doc", label: "Doc", data: { url: "/doc" } } },
  ],
};
const triggers: Record<string, ComposerTrigger<{ url: string }>> = {
  "@": {
    items: async (_query, { signal }) =>
      signal.aborted ? [] : [{ id: "doc", label: "Doc", data: { url: "/doc" } }],
    onSelect(item, context) {
      item.data?.url.toUpperCase();
      context.insertChip(item);
    },
  },
};

export const conversation = (
  <Conversation contextRef={conversationRef}>
    <ConversationContent>
      <Message from="assistant" status="streaming">
        <MessageResponse>Reply</MessageResponse>
      </Message>
    </ConversationContent>
    <ConversationDownload
      messages={[{ role: "user", content: "Hi", id: 1 }]}
      formatMessage={(message) => String(message.id)}
    />
  </Conversation>
);
export const prompt = (
  <PromptInput
    onSubmit={async (message: PromptInputMessage) => {
      message.files[0]?.file.arrayBuffer();
    }}
  >
    <PromptInputTextarea submitOnEnter={false} />
    <PromptInputSubmit />
  </PromptInput>
);
export const rich = (
  <ComposerRich>
    <ComposerRichInput
      editorRef={editorRef}
      value={draft}
      triggers={triggers}
      onValueChange={(value) => {
        value.segments[0]?.type;
      }}
    />
    <ComposerSuggestions />
  </ComposerRich>
);
const models = [{ id: "atlas", label: "Atlas" }];
export const picker = (
  <ModelSelector<(typeof models)[number]>
    items={models}
    itemToStringLabel={(model) => model.label}
    onValueChange={(model) => {
      model?.id.toUpperCase();
    }}
  >
    <ModelSelectorInput />
    <ModelSelectorList<(typeof models)[number]>>
      <ModelSelectorCollection<(typeof models)[number]>>
        {(model) => (
          <ModelSelectorItem
            value={model}
            onSelect={(selected) => {
              selected.id.toUpperCase();
            }}
          >
            {model.label}
          </ModelSelectorItem>
        )}
      </ModelSelectorCollection>
    </ModelSelectorList>
  </ModelSelector>
);
export const suggestion = (
  <Suggestion
    suggestion="Explain"
    onClick={(value, event) => {
      value.toUpperCase();
      event.preventDefault();
    }}
  />
);

// @ts-expect-error SDK-specific roles do not leak into the neutral message contract.
export const invalidRole = <Message from="developer" />;
// @ts-expect-error Submission receives a structured message, not just a string.
export const invalidSubmit = <PromptInput onSubmit={(message: string) => message.toUpperCase()} />;
// @ts-expect-error Rich values must contain structured segments.
export const invalidRich = <ComposerRichInput value={{ text: "draft" }} />;
