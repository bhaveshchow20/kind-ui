import { ComposerRich, ComposerRichInput, type ComposerValue } from "@kind-ui/ai/composer-rich";
import { Conversation, ConversationContent } from "@kind-ui/ai/conversation";
import {
  PromptInput,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputQuoteContent,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@kind-ui/ai/prompt-input";
import type { Editor } from "@tiptap/core";
import { createRef, type RefCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useStickToBottom } from "use-stick-to-bottom";

function ConversationKeyboard() {
  const instance = useStickToBottom({ initial: false, resize: "instant" });
  const [cancel, setCancel] = useState(true);
  const [events, setEvents] = useState<string[]>([]);
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={cancel}
          onChange={(event) => setCancel(event.target.checked)}
        />
        Cancel conversation keyboard default
      </label>
      <Conversation
        initial={false}
        resize="instant"
        instance={{
          ...instance,
          stopScroll: () => {
            setEvents((previous) => [...previous, "stop"]);
            instance.stopScroll();
          },
        }}
      >
        <ConversationContent
          render={<div style={{ height: 100, overflowY: "auto" }} />}
          onKeyDown={(event) => {
            const entry = `consumer:${event.key}:${event.currentTarget.dataset.slot}`;
            setEvents((previous) => [...previous, entry]);
            if (cancel) event.preventDefault();
          }}
        >
          <div style={{ height: 500 }}>
            <button type="button">Nested conversation action</button>
          </div>
        </ConversationContent>
      </Conversation>
      <output aria-label="Conversation key events">{events.join("|")}</output>
    </>
  );
}

function ControlledEditor() {
  const [value, setValue] = useState<ComposerValue>({
    text: "Host draft",
    segments: [{ type: "text", value: "Host draft" }],
  });
  const [mode, setMode] = useState("reject");
  const proposal = useRef<ComposerValue>(value);
  const [proposed, setProposed] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [editorSubmitted, setEditorSubmitted] = useState("");
  return (
    <>
      <label>
        Host mode
        <select
          aria-label="Host mode"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
        >
          <option value="reject">Reject</option>
          <option value="accept">Accept</option>
          <option value="delay">Delay</option>
        </select>
      </label>
      <button type="button" onClick={() => setValue(proposal.current)}>
        Accept proposal
      </button>
      <PromptInput onSubmit={(message) => setSubmitted(message.text)}>
        <ComposerRich>
          <ComposerRichInput
            aria-label="Controlled message"
            value={value}
            onValueChange={(next) => {
              proposal.current = next;
              setProposed(next.text);
              if (mode === "accept") setValue(next);
            }}
            onSubmit={(next) => setEditorSubmitted(next.text)}
          />
        </ComposerRich>
        <PromptInputSubmit />
      </PromptInput>
      <output aria-label="Proposed value">{proposed}</output>
      <output aria-label="Submitted value">{submitted}</output>
      <output aria-label="Editor submitted value">{editorSubmitted}</output>
    </>
  );
}

function DragLeave() {
  const [cancel, setCancel] = useState(false);
  const [calls, setCalls] = useState(0);
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={cancel}
          onChange={(event) => setCancel(event.target.checked)}
        />
        Cancel drag leave
      </label>
      <PromptInput
        aria-label="Drop target"
        onSubmit={() => {}}
        onDragLeave={(event) => {
          setCalls((value) => value + 1);
          if (cancel) event.preventDefault();
        }}
      >
        <PromptInputTextarea />
      </PromptInput>
      <output aria-label="Drag leave calls">{calls}</output>
    </>
  );
}

function Screenshot() {
  const [disabled, setDisabled] = useState(true);
  const [canceled, setCanceled] = useState(0);
  return (
    <>
      <PromptInput disabled={disabled} onSubmit={() => {}}>
        <PromptInputActionMenu defaultOpen>
          <PromptInputActionMenuTrigger aria-label="Capture menu">
            Capture menu
          </PromptInputActionMenuTrigger>
          <PromptInputActionMenuContent>
            <button type="button" onClick={() => setDisabled(false)}>
              Enable prompt
            </button>
            <PromptInputActionAddScreenshot onCancel={() => setCanceled((value) => value + 1)} />
          </PromptInputActionMenuContent>
        </PromptInputActionMenu>
      </PromptInput>
      <output aria-label="Canceled captures">{canceled}</output>
    </>
  );
}

const counters: Record<string, { attached: number; cleaned: number; nulls: number }> = {};
function trackedRef<T>(name: string): RefCallback<T> {
  const count = { attached: 0, cleaned: 0, nulls: 0 };
  counters[name] = count;
  return (node) => {
    if (node === null) {
      count.nulls++;
      return;
    }
    count.attached++;
    return () => {
      count.cleaned++;
    };
  };
}
const formRef = trackedRef<HTMLFormElement>("form");
const textareaRef = trackedRef<HTMLTextAreaElement>("textarea");
const quoteRef = trackedRef<HTMLDivElement>("quote");
const richRef = trackedRef<HTMLDivElement>("rich");
const editorRef = trackedRef<Editor | null>("editor");
const legacyCount = { attached: 0, nulls: 0 };
const legacyRef: RefCallback<HTMLTextAreaElement> = (node) => {
  if (node === null) legacyCount.nulls++;
  else legacyCount.attached++;
};
const objectRef = createRef<HTMLFormElement>();
function Refs() {
  const [mounted, setMounted] = useState(true);
  const [snapshot, setSnapshot] = useState("");
  return (
    <>
      <button type="button" onClick={() => setMounted((value) => !value)}>
        Toggle refs
      </button>
      <button
        type="button"
        onClick={() =>
          setSnapshot(
            JSON.stringify({ counters, legacyCount, objectAttached: objectRef.current !== null }),
          )
        }
      >
        Snapshot refs
      </button>
      {mounted && (
        <>
          <PromptInput ref={formRef} onSubmit={() => {}}>
            <PromptInputTextarea ref={textareaRef} />
            <PromptInputQuoteContent ref={quoteRef}>Quoted text</PromptInputQuoteContent>
            <ComposerRich>
              <ComposerRichInput ref={richRef} editorRef={editorRef} aria-label="Ref editor" />
            </ComposerRich>
          </PromptInput>
          <PromptInput ref={objectRef} onSubmit={() => {}}>
            <PromptInputTextarea aria-label="Legacy input" ref={legacyRef} />
          </PromptInput>
        </>
      )}
      <output aria-label="Ref snapshot">{snapshot}</output>
    </>
  );
}

const scenario = new URLSearchParams(window.location.search).get("case");
const App =
  scenario === "conversation"
    ? ConversationKeyboard
    : scenario === "drag"
      ? DragLeave
      : scenario === "capture"
        ? Screenshot
        : scenario === "refs"
          ? Refs
          : ControlledEditor;
const root = document.getElementById("root");
if (!root) throw new Error("Missing regression fixture root.");
createRoot(root).render(<App />);
