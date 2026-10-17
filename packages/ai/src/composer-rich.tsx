"use client";

import {
  Popover,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
} from "@kind-ui/primitives/popover";
import { type Editor, Extension, type JSONContent, Node } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { PluginKey } from "@tiptap/pm/state";
import {
  EditorContent,
  NodeViewWrapper,
  type ReactNodeViewProps,
  ReactNodeViewRenderer,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Suggestion, { exitSuggestion, type SuggestionProps } from "@tiptap/suggestion";
import { ChevronRight } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePromptInputEditor } from "./prompt-input.js";
import { cn } from "./utils.js";

export interface ComposerItem<T = unknown> {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  children?: ComposerItem<T>[];
  data?: T;
  disabled?: boolean;
  keywords?: string[];
  group?: string;
}
export interface SelectContext<T = unknown> {
  trigger: string;
  query: string;
  insertChip: (item: ComposerItem<T>) => void;
  clearTrigger: () => void;
  close: () => void;
}
export interface ComposerTrigger<T = unknown> {
  items:
    | ComposerItem<T>[]
    | ((
        query: string,
        context: { signal: AbortSignal },
      ) => ComposerItem<T>[] | Promise<ComposerItem<T>[]>);
  action?: "execute" | "insert";
  onSelect?: (item: ComposerItem<T>, context: SelectContext<T>) => void;
  filter?: (item: ComposerItem<T>, query: string) => boolean;
  renderChip?: (item: ComposerItem<T>) => ReactNode;
  hideOnEmpty?: boolean;
}
export type ComposerSegment<T = unknown> =
  | { type: "text"; value: string }
  | { type: "chip"; trigger: string; item: ComposerItem<T> };
export interface ComposerValue<T = unknown> {
  text: string;
  segments: ComposerSegment<T>[];
}
interface Popup {
  trigger: string;
  query: string;
  range: { from: number; to: number };
  items: ComposerItem[];
  parents: ComposerItem[];
  highlighted: number;
  loading: boolean;
  error: unknown;
}
interface RichState {
  popup: Popup | null;
  listId: string;
  anchor: RefObject<HTMLDivElement | null>;
  pick: (item: ComposerItem) => void;
  back: () => void;
  close: () => void;
  highlight: (index: number) => void;
  triggers: Record<string, ComposerTrigger>;
}
const EMPTY_TRIGGERS: Record<string, ComposerTrigger> = {};
const RichContext = createContext<{
  state: RichState | null;
  setState: (value: RichState | null) => void;
} | null>(null);
function useRich() {
  const value = useContext(RichContext);
  if (!value) throw new Error("ComposerRichInput and ComposerSuggestions require ComposerRich.");
  return value;
}
export type ComposerRichProps = ComponentProps<"div">;
/** Coordinates one rich input and its sibling suggestions; submission remains host-owned. */
export function ComposerRich({ className, ...props }: ComposerRichProps) {
  const [state, setState] = useState<RichState | null>(null);
  return (
    <RichContext.Provider value={{ state, setState }}>
      <div data-slot="composer-rich" className={cn("relative min-w-0", className)} {...props} />
    </RichContext.Provider>
  );
}
const ChipRenderContext = createContext<{ triggers: Record<string, ComposerTrigger> } | null>(null);
function ChipView({ node }: ReactNodeViewProps) {
  const renderers = useContext(ChipRenderContext);
  const item = node.attrs.item as ComposerItem;
  const trigger = String(node.attrs.trigger);
  return (
    <NodeViewWrapper
      as="span"
      contentEditable={false}
      data-composer-chip=""
      data-trigger={trigger}
      className="mx-0.5 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/60 bg-inset px-1.5 py-0.5 align-baseline text-ai-label font-medium text-foreground"
    >
      {renderers?.triggers[trigger]?.renderChip?.(item) ?? (
        <>
          {item.icon && (
            <span
              aria-hidden="true"
              className="inline-flex shrink-0 text-muted-foreground [&>svg]:size-3.5"
            >
              {item.icon}
            </span>
          )}
          <span className="min-w-0 whitespace-normal [overflow-wrap:anywhere]">{item.label}</span>
        </>
      )}
    </NodeViewWrapper>
  );
}
// Item objects live as in-memory node attributes; external HTML never creates trusted chips.
const Chip = Node.create({
  name: "kindComposerChip",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      trigger: { default: "@", rendered: false },
      item: { default: { id: "", label: "" }, rendered: false },
    };
  },
  parseHTML() {
    return [];
  },
  renderHTML({ node }) {
    const item = node.attrs.item as ComposerItem;
    return ["span", { "data-kind-composer-chip": "" }, item.label];
  },
  renderText({ node }) {
    const item = node.attrs.item as ComposerItem;
    return `{{${String(node.attrs.trigger)}:${item.id}}}`;
  },
  addNodeView() {
    return ReactNodeViewRenderer(ChipView);
  },
});
function content(value: ComposerValue): JSONContent {
  const paragraphs: JSONContent[] = [];
  let inline: JSONContent[] = [];
  const flush = () => {
    paragraphs.push({ type: "paragraph", content: inline });
    inline = [];
  };
  for (const segment of value.segments) {
    if (segment.type === "chip")
      inline.push({ type: Chip.name, attrs: { trigger: segment.trigger, item: segment.item } });
    else
      segment.value.split("\n").forEach((line, index) => {
        if (index) flush();
        if (line) inline.push({ type: "text", text: line });
      });
  }
  flush();
  return { type: "doc", content: paragraphs };
}
function serialize(editor: Editor): ComposerValue {
  const segments: ComposerSegment[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) segments.push({ type: "text", value: buffer });
    buffer = "";
  };
  editor.state.doc.forEach((block, _offset, index) => {
    if (index) buffer += "\n";
    block.descendants((node) => {
      if (node.type.name === Chip.name) {
        flush();
        segments.push({
          type: "chip",
          trigger: String(node.attrs.trigger),
          item: node.attrs.item as ComposerItem,
        });
        return false;
      }
      if (node.type.name === "hardBreak") buffer += "\n";
      else if (node.isText) buffer += node.text ?? "";
      return true;
    });
  });
  flush();
  return {
    segments,
    text: segments
      .map((s) => (s.type === "text" ? s.value : `{{${s.trigger}:${s.item.id}}}`))
      .join(""),
  };
}
function equal(a: ComposerValue, b: ComposerValue) {
  return (
    a.text === b.text &&
    a.segments.length === b.segments.length &&
    a.segments.every((s, index) => {
      const next = b.segments[index];
      return s.type === "text"
        ? next?.type === "text" && next.value === s.value
        : next?.type === "chip" && next.trigger === s.trigger && next.item === s.item;
    })
  );
}
function defaultFilter(item: ComposerItem, query: string) {
  const term = query.toLocaleLowerCase();
  return [item.label, item.description, ...(item.keywords ?? [])].some((text) =>
    text?.toLocaleLowerCase().includes(term),
  );
}
export type ComposerRichInputProps<T = unknown> = Omit<
  ComponentProps<"div">,
  "onSubmit" | "onChange" | "defaultValue" | "children" | "onError"
> & {
  triggers?: Record<string, ComposerTrigger<T>>;
  value?: ComposerValue<T>;
  defaultValue?: ComposerValue<T>;
  onValueChange?: (value: ComposerValue<T>) => void;
  onSubmit?: (value: ComposerValue<T>) => void | Promise<void>;
  onError?: (error: unknown) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  submitOnEnter?: boolean;
  clearOnSubmit?: boolean;
  editorRef?: React.Ref<Editor | null>;
  /** Bridge to a host form/controller. Receives serialized text on every edit. */
  onTextChange?: (text: string) => void;
};
export function ComposerRichInput<T = unknown>(props: ComposerRichInputProps<T>) {
  // The editor stores only this input's T-valued items. Context erases T solely
  // to coordinate sibling renderers; public callbacks remain generic.
  return <RichInput {...(props as unknown as ComposerRichInputProps)} />;
}
function RichInput({
  triggers = EMPTY_TRIGGERS,
  value,
  defaultValue = { text: "", segments: [] },
  onValueChange,
  onSubmit,
  onError,
  placeholder = "Write a message…",
  autoFocus = false,
  disabled = false,
  readOnly = false,
  submitOnEnter = true,
  clearOnSubmit = true,
  editorRef,
  onTextChange,
  className,
  onKeyDown,
  onKeyDownCapture,
  onPaste,
  onPasteCapture,
  "aria-label": label = "Message",
  ...props
}: ComposerRichInputProps) {
  const { setState } = useRich();
  const integration = usePromptInputEditor();
  const integrationRef = useRef(integration);
  integrationRef.current = integration;
  disabled = disabled || !!integration?.disabled;
  const anchor = useRef<HTMLDivElement | null>(null);
  const listId = useId();
  const [popup, setPopup] = useState<Popup | null>(null);
  const popupRef = useRef(popup);
  popupRef.current = popup;
  const placeholderRef = useRef(placeholder);
  placeholderRef.current = placeholder;
  const latest = useRef({
    triggers,
    value,
    onValueChange,
    onSubmit,
    onError,
    disabled,
    readOnly,
    onTextChange,
  });
  latest.current = {
    triggers,
    value,
    onValueChange,
    onSubmit,
    onError,
    disabled,
    readOnly,
    onTextChange,
  };
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(false);
  const last = useRef<ComposerValue>(value ?? defaultValue);
  const editorInstance = useRef<Editor | null>(null);
  const parents = useRef<ComposerItem[]>([]);
  const keys = useRef(new Map<string, PluginKey>());
  const publish = useCallback((next: Popup | null) => {
    popupRef.current = next;
    if (mounted.current) setPopup(next);
  }, []);
  const cancel = useCallback(() => {
    generation.current++;
    request.current?.abort();
    request.current = null;
  }, []);
  const close = () => {
    cancel();
    const editor = editorInstance.current;
    const active = popupRef.current;
    publish(null);
    parents.current = [];
    if (editor && !editor.isDestroyed && active) {
      const key = keys.current.get(active.trigger);
      if (key) exitSuggestion(editor.view, key);
    }
  };
  const load = async (trigger: string, query: string, range: Popup["range"]) => {
    cancel();
    const ticket = generation.current;
    const controller = new AbortController();
    request.current = controller;
    const config = latest.current.triggers[trigger];
    if (!config) return;
    const base: Popup = {
      trigger,
      query,
      range,
      items: [],
      parents: [...parents.current],
      highlighted: -1,
      loading: true,
      error: null,
    };
    publish(base);
    try {
      const parent = parents.current.at(-1);
      const rows =
        parent?.children ??
        (typeof config.items === "function"
          ? await config.items(query, { signal: controller.signal })
          : config.items);
      if (ticket !== generation.current || controller.signal.aborted || !mounted.current) return;
      const items = rows.filter((item) => (config.filter ?? defaultFilter)(item, query));
      publish({
        ...base,
        items,
        highlighted: items.findIndex((item) => !item.disabled),
        loading: false,
      });
    } catch (error) {
      if (ticket !== generation.current || controller.signal.aborted || !mounted.current) return;
      latest.current.onError?.(error);
      publish({
        ...base,
        loading: false,
        error: error ?? new Error("Suggestions could not be loaded."),
      });
    }
  };
  const back = () => {
    const active = popupRef.current;
    if (!active) return;
    if (!parents.current.length) {
      close();
      return;
    }
    parents.current = parents.current.slice(0, -1);
    editorInstance.current?.commands.insertContentAt(active.range, {
      type: "text",
      text: active.trigger,
    });
    void load(active.trigger, "", {
      from: active.range.from,
      to: active.range.from + active.trigger.length,
    });
  };
  const pick = (item: ComposerItem) => {
    const active = popupRef.current;
    const editor = editorInstance.current;
    if (!active || !editor || item.disabled || latest.current.disabled || latest.current.readOnly)
      return;
    if (item.children?.length) {
      parents.current = [...parents.current, item];
      // Keep just the trigger under the caret so a submenu starts with a fresh query.
      editor.commands.insertContentAt(active.range, { type: "text", text: active.trigger });
      void load(active.trigger, "", {
        from: active.range.from,
        to: active.range.from + active.trigger.length,
      });
      return;
    }
    const config = latest.current.triggers[active.trigger];
    if (!config) return;
    let edited = false;
    const context: SelectContext = {
      trigger: active.trigger,
      query: active.query,
      close,
      insertChip: (selected) => {
        if (edited || editor.isDestroyed) return;
        edited = true;
        editor
          .chain()
          .focus()
          .insertContentAt(active.range, [
            { type: Chip.name, attrs: { trigger: active.trigger, item: selected } },
            { type: "text", text: " " },
          ])
          .run();
      },
      clearTrigger: () => {
        if (edited || editor.isDestroyed) return;
        edited = true;
        editor.chain().focus().deleteRange(active.range).run();
      },
    };
    try {
      if (config.onSelect) config.onSelect(item, context);
      else if ((config.action ?? (active.trigger === "@" ? "insert" : "execute")) === "insert")
        context.insertChip(item);
      else context.clearTrigger();
    } catch (error) {
      latest.current.onError?.(error);
    } finally {
      close();
    }
  };
  const api = useRef({ load, pick, close, back });
  api.current = { load, pick, close, back };
  const triggerNames = Object.keys(triggers).sort().join("\u0000");
  const extensions = useMemo(() => {
    keys.current.clear();
    const result = [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
      }),
      Placeholder.configure({ placeholder: () => placeholderRef.current }),
      Chip,
    ];
    for (const trigger of triggerNames.split("\u0000").filter(Boolean)) {
      const key = new PluginKey(`kind-composer-${trigger}`);
      keys.current.set(trigger, key);
      result.push(
        Extension.create({
          name: `kindTrigger${Array.from(trigger)
            .map((c) => c.codePointAt(0))
            .join("_")}`,
          addProseMirrorPlugins() {
            return [
              Suggestion<ComposerItem>({
                editor: this.editor,
                char: trigger,
                pluginKey: key,
                allowSpaces: true,
                items: () => [],
                render: () => ({
                  onStart: (state: SuggestionProps<ComposerItem>) => {
                    parents.current = [];
                    void api.current.load(trigger, state.query, state.range);
                  },
                  onUpdate: (state: SuggestionProps<ComposerItem>) => {
                    void api.current.load(trigger, state.query, state.range);
                  },
                  onExit: () => {
                    cancel();
                    publish(null);
                    parents.current = [];
                  },
                  onKeyDown: ({ event }) => {
                    if (
                      event.isComposing ||
                      event.keyCode === 229 ||
                      editorInstance.current?.view.composing
                    )
                      return false;
                    const active = popupRef.current;
                    if (!active) return false;
                    if (event.key === "Escape") {
                      api.current.back();
                      return true;
                    }
                    if (event.key === "ArrowLeft" && parents.current.length) {
                      api.current.back();
                      return true;
                    }
                    const hidden =
                      !active.loading &&
                      active.error === null &&
                      !active.items.length &&
                      (latest.current.triggers[trigger]?.hideOnEmpty ?? true);
                    if (hidden) return false;
                    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                      const direction = event.key === "ArrowDown" ? 1 : -1;
                      let index = active.highlighted + direction;
                      while (
                        index >= 0 &&
                        index < active.items.length &&
                        active.items[index]?.disabled
                      )
                        index += direction;
                      if (index >= 0 && index < active.items.length)
                        publish({ ...active, highlighted: index });
                      return true;
                    }
                    const item = active.items[active.highlighted];
                    if (
                      (event.key === "Enter" ||
                        event.key === "Tab" ||
                        (event.key === "ArrowRight" && item?.children?.length)) &&
                      item
                    ) {
                      api.current.pick(item);
                      return true;
                    }
                    return event.key === "Enter" && (active.loading || active.error !== null);
                  },
                }),
              }),
            ];
          },
        }),
      );
    }
    return result;
  }, [triggerNames, cancel, publish]);
  const submit = async (editor: Editor) => {
    if (busy.current || latest.current.disabled || latest.current.readOnly || editor.isEmpty)
      return;
    const snapshot = serialize(editor);
    if (!snapshot.segments.some((s) => s.type === "chip" || s.value.trim())) return;
    busy.current = true;
    try {
      await latest.current.onSubmit?.(snapshot);
      if (
        mounted.current &&
        !editor.isDestroyed &&
        editorInstance.current === editor &&
        clearOnSubmit &&
        latest.current.value === undefined &&
        equal(snapshot, serialize(editor))
      )
        editor.commands.clearContent();
    } catch (error) {
      if (mounted.current && editorInstance.current === editor) latest.current.onError?.(error);
    } finally {
      busy.current = false;
    }
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: content(value ?? last.current),
      autofocus: autoFocus && !disabled && !readOnly,
      editable: !disabled && !readOnly,
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": label,
          "data-slot": "composer-rich-editor",
          class:
            "min-h-10 max-h-60 overflow-y-auto overscroll-contain whitespace-pre-wrap px-2.5 py-1.5 text-ai-prose outline-none [overflow-wrap:anywhere] [&_p]:m-0 [&_p.is-editor-empty:first-child]:before:float-start [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:text-placeholder [&_p.is-editor-empty:first-child]:before:text-ai-label [&_p.is-editor-empty:first-child]:before:leading-[inherit] [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        },
        handlePaste: (_view, event) => {
          const text = event.clipboardData?.getData("text/plain");
          if (text === undefined) return false;
          const current = editorInstance.current;
          if (!current || latest.current.disabled || latest.current.readOnly) return true;
          const segments: ComposerValue = { text, segments: [{ type: "text", value: text }] };
          current.commands.insertContent(content(segments).content ?? []);
          return true;
        },
        handleKeyDown: (_view, event) => {
          if (
            event.isComposing ||
            event.keyCode === 229 ||
            event.defaultPrevented ||
            editorInstance.current?.view.composing
          )
            return false;
          if (event.key !== "Enter" || event.shiftKey || !submitOnEnter) return false;
          const active = popupRef.current;
          const visible =
            active &&
            (active.loading ||
              active.error !== null ||
              active.items.length > 0 ||
              latest.current.triggers[active.trigger]?.hideOnEmpty === false);
          if (visible) return false;
          event.preventDefault();
          const current = editorInstance.current;
          if (current) {
            if (integrationRef.current) integrationRef.current.submit();
            else if (latest.current.onSubmit) void submitRef.current(current);
            else anchor.current?.closest("form")?.requestSubmit();
          }
          return true;
        },
      },
      onCreate: ({ editor: instance }) => {
        editorInstance.current = instance;
        last.current = serialize(instance);
        latest.current.onTextChange?.(last.current.text);
        integrationRef.current?.setText(last.current.text);
      },
      onUpdate: ({ editor: instance }) => {
        const next = serialize(instance);
        last.current = next;
        latest.current.onValueChange?.(next);
        latest.current.onTextChange?.(next.text);
        integrationRef.current?.setText(next.text);
      },
    },
    [extensions],
  );
  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isEmpty: currentEditor?.isEmpty ?? false,
      controlledDocument: value === undefined ? null : (currentEditor?.state.doc ?? null),
    }),
    equalityFn: (previous, next) =>
      previous.isEmpty === next?.isEmpty &&
      previous.controlledDocument === next?.controlledDocument,
  });
  editorInstance.current = editor;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, [cancel]);
  // A replaced editor invalidates pending results even when trigger keys match.
  useEffect(() => {
    if (!editor) return;
    return () => cancel();
  }, [editor, cancel]);
  const previousTriggers = useRef(triggers);
  useEffect(() => {
    if (previousTriggers.current === triggers) return;
    previousTriggers.current = triggers;
    const active = popupRef.current;
    if (!active) return;
    if (!triggers[active.trigger]) api.current.close();
    else void api.current.load(active.trigger, active.query, active.range);
  }, [triggers]);
  const registerEditor = integration?.registerEditor;
  useEffect(() => {
    if (!editor || !registerEditor) return;
    return registerEditor({
      getSnapshot: () => serialize(editor),
      onSubmit: async () => {
        await latest.current.onSubmit?.(serialize(editor));
      },
      clear: () => {
        if (clearOnSubmit && latest.current.value === undefined) editor.commands.clearContent();
      },
    });
  }, [editor, registerEditor, clearOnSubmit]);
  useEffect(() => {
    const cleanup = typeof editorRef === "function" ? editorRef(editor) : undefined;
    if (editorRef && typeof editorRef !== "function") editorRef.current = editor;
    return () => {
      if (typeof cleanup === "function") cleanup();
      else if (typeof editorRef === "function") editorRef(null);
      else if (editorRef) editorRef.current = null;
    };
  }, [editor, editorRef]);
  useEffect(() => {
    editor?.setEditable(!disabled && !readOnly);
    if (disabled || readOnly) api.current.close();
  }, [editor, disabled, readOnly]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Refresh placeholder decorations without recreating the editor or losing its selection.
  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.view.dispatch(editor.state.tr);
  }, [editor, placeholder]);
  // A rejected controlled edit changes the document while value retains its identity.
  useEffect(() => {
    if (
      !editor ||
      value === undefined ||
      !editorState?.controlledDocument ||
      equal(value, serialize(editor))
    )
      return;
    editor.commands.setContent(content(value), { emitUpdate: false });
    last.current = serialize(editor);
    latest.current.onTextChange?.(last.current.text);
    integrationRef.current?.setText(last.current.text);
    api.current.close();
  }, [editor, value, editorState?.controlledDocument]);
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    dom.setAttribute("aria-label", label);
    dom.setAttribute("aria-disabled", String(disabled));
    dom.setAttribute("aria-readonly", String(readOnly));
    const active =
      popup &&
      (popup.loading ||
        popup.error !== null ||
        popup.items.length ||
        triggers[popup.trigger]?.hideOnEmpty === false);
    // A multiline textbox can own suggestions, but does not support aria-expanded.
    if (active) {
      dom.setAttribute("aria-controls", listId);
      dom.setAttribute("aria-haspopup", "listbox");
      const item = popup.items[popup.highlighted];
      if (item) dom.setAttribute("aria-activedescendant", `${listId}-${popup.highlighted}`);
      else dom.removeAttribute("aria-activedescendant");
    } else {
      dom.removeAttribute("aria-controls");
      dom.removeAttribute("aria-haspopup");
      dom.removeAttribute("aria-activedescendant");
    }
  }, [editor, popup, triggers, listId, label, disabled, readOnly]);
  useEffect(() => {
    setState({
      popup,
      listId,
      anchor,
      pick: (item) => api.current.pick(item),
      back: () => api.current.back(),
      close: () => api.current.close(),
      highlight: (index) => {
        const active = popupRef.current;
        if (active && !active.items[index]?.disabled) publish({ ...active, highlighted: index });
      },
      triggers,
    });
  }, [popup, listId, setState, triggers, publish]);
  useEffect(() => () => setState(null), [setState]);
  return (
    <div
      {...props}
      data-slot="composer-rich-input"
      className={cn(
        "relative grid min-w-0 rounded-lg text-foreground",
        !integration && "has-[:focus-visible]:shadow-kind-focus",
        disabled && "opacity-50",
        className,
      )}
      ref={(node) => {
        anchor.current = node;
        const ref = props.ref;
        const cleanup = typeof ref === "function" ? ref(node) : undefined;
        if (ref && typeof ref !== "function") ref.current = node;
        if (node === null) return;
        return () => {
          anchor.current = null;
          if (typeof cleanup === "function") cleanup();
          else if (typeof ref === "function") ref(null);
          else if (ref) ref.current = null;
        };
      }}
      onKeyDownCapture={(event) => {
        onKeyDownCapture?.(event);
        if (!event.defaultPrevented) onKeyDown?.(event);
      }}
      onPasteCapture={(event) => {
        onPasteCapture?.(event);
        if (!event.defaultPrevented) onPaste?.(event);
      }}
    >
      <ChipRenderContext.Provider value={{ triggers }}>
        {editorState?.isEmpty && (
          <div
            aria-hidden="true"
            className="pointer-events-none invisible col-start-1 row-start-1 min-h-10 max-h-60 overflow-hidden whitespace-pre-wrap px-2.5 py-1.5 text-ai-label leading-[1.625rem] [overflow-wrap:anywhere]"
          >
            {placeholder}
          </div>
        )}
        <EditorContent
          editor={editor}
          className="col-start-1 row-start-1 min-w-0 [&>[data-slot=composer-rich-editor]]:min-h-full"
        />
        {!editor && (
          <div
            aria-hidden="true"
            className="col-start-1 row-start-1 min-h-10 px-2.5 py-1.5 text-ai-label leading-[1.625rem] text-placeholder"
          >
            {placeholder}
          </div>
        )}
      </ChipRenderContext.Provider>
    </div>
  );
}

export type ComposerSuggestionsProps = Omit<ComponentProps<"div">, "children"> & {
  renderItem?: (
    item: ComposerItem,
    state: { highlighted: boolean; trigger: string; query: string; depth: number },
  ) => ReactNode;
  renderEmpty?: (state: { trigger: string; query: string }) => ReactNode;
  renderLoading?: () => ReactNode;
  renderHeader?: (state: { trigger: string; query: string; parents: ComposerItem[] }) => ReactNode;
  renderGroup?: (label: string, state: { trigger: string; query: string }) => ReactNode;
  renderError?: (error: unknown) => ReactNode;
};
export function ComposerSuggestions({
  renderItem,
  renderEmpty,
  renderLoading,
  renderHeader,
  renderGroup,
  renderError,
  className,
  onMouseDown,
  ...props
}: ComposerSuggestionsProps) {
  const { state } = useRich();
  const popup = state?.popup;
  const open =
    !!popup &&
    (popup.loading ||
      popup.error !== null ||
      popup.items.length > 0 ||
      state?.triggers[popup.trigger]?.hideOnEmpty === false);
  const activeId =
    popup && popup.highlighted >= 0 ? `${state?.listId}-${popup.highlighted}` : undefined;
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);
  if (!state) return null;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) state.close();
      }}
      modal={false}
    >
      <PopoverPortal>
        <PopoverPositioner
          anchor={state.anchor}
          side="top"
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--anchor-width)] max-w-[calc(100vw-1rem)]"
        >
          <PopoverPopup
            initialFocus={false}
            finalFocus={false}
            role="presentation"
            className="rounded-xl border border-transparent bg-elevated p-1 text-foreground shadow-kind-float outline-none"
          >
            {popup && (
              <>
                <div
                  {...props}
                  id={state.listId}
                  role="listbox"
                  aria-label="Suggestions"
                  aria-busy={popup.loading}
                  data-slot="composer-suggestions"
                  className={cn(
                    "max-h-72 overflow-y-auto overscroll-contain [scrollbar-width:thin]",
                    className,
                  )}
                  onMouseDown={(event) => {
                    onMouseDown?.(event);
                    if (!event.defaultPrevented) event.preventDefault();
                  }}
                >
                  {renderHeader?.({
                    trigger: popup.trigger,
                    query: popup.query,
                    parents: popup.parents,
                  }) ??
                    (popup.parents.length > 0 && (
                      <div
                        role="presentation"
                        className="px-2 pb-1 pt-1.5 text-ai-description font-medium text-muted-foreground [overflow-wrap:anywhere]"
                      >
                        {popup.parents.map((item) => item.label).join(" / ")}
                      </div>
                    ))}
                  {popup.loading ? (
                    <div role="status" className="px-2 py-2.5 text-ai-label text-muted-foreground">
                      {renderLoading?.() ?? "Loading…"}
                    </div>
                  ) : popup.error !== null ? (
                    <div role="status" className="px-2 py-2.5 text-ai-label text-destructive">
                      {renderError?.(popup.error) ??
                        "Suggestions could not be loaded. Type to retry."}
                    </div>
                  ) : popup.items.length === 0 ? (
                    <div role="status" className="px-2 py-2.5 text-ai-label text-muted-foreground">
                      {renderEmpty?.({ trigger: popup.trigger, query: popup.query }) ??
                        "No suggestions found."}
                    </div>
                  ) : (
                    popup.items.map((item, index) => (
                      <SuggestionItem
                        key={`${popup.trigger}:${item.id}`}
                        item={item}
                        index={index}
                        popup={popup}
                        state={state}
                        renderItem={renderItem}
                        renderGroup={renderGroup}
                      />
                    ))
                  )}
                </div>
                <div
                  aria-hidden="true"
                  className="mt-1 hidden flex-wrap items-center gap-x-3 gap-y-1 border-t border-transparent px-2 pb-1 pt-1.5 text-ai-meta text-muted-foreground sm:flex"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <kbd className="rounded border border-border/60 bg-surface px-1 font-mono text-ai-meta">
                      Arrows
                    </kbd>{" "}
                    Navigate
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <kbd className="rounded border border-border/60 bg-surface px-1 font-mono text-ai-meta">
                      Enter
                    </kbd>{" "}
                    Select
                  </span>
                  <span className="ms-auto inline-flex items-center gap-1.5">
                    <kbd className="rounded border border-border/60 bg-surface px-1 font-mono text-ai-meta">
                      Esc
                    </kbd>{" "}
                    {popup.parents.length ? "Back" : "Close"}
                  </span>
                </div>
              </>
            )}
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
function SuggestionItem({
  item,
  index,
  popup,
  state,
  renderItem,
  renderGroup,
}: {
  item: ComposerItem;
  index: number;
  popup: Popup;
  state: RichState;
  renderItem: ComposerSuggestionsProps["renderItem"];
  renderGroup: ComposerSuggestionsProps["renderGroup"];
}) {
  const highlighted = popup.highlighted === index;
  const heading = item.group && popup.items[index - 1]?.group !== item.group;
  return (
    <>
      {heading && (
        <div
          role="presentation"
          className="px-2 pb-1 pt-2 text-ai-meta font-medium text-muted-foreground"
        >
          {renderGroup?.(item.group ?? "", { trigger: popup.trigger, query: popup.query }) ??
            item.group}
        </div>
      )}
      <div
        role="option"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            state.pick(item);
          }
        }}
        id={`${state.listId}-${index}`}
        aria-selected={highlighted}
        aria-disabled={item.disabled || undefined}
        data-highlighted={highlighted || undefined}
        data-disabled={item.disabled || undefined}
        className="flex min-h-9 min-w-0 cursor-default items-center gap-2 rounded-lg px-2 py-1 text-start text-ai-label data-highlighted:bg-secondary/60 data-disabled:opacity-45 coarse:min-h-11"
        onPointerMove={() => state.highlight(index)}
        onClick={() => state.pick(item)}
      >
        {renderItem?.(item, {
          highlighted,
          trigger: popup.trigger,
          query: popup.query,
          depth: popup.parents.length,
        }) ?? (
          <>
            {item.icon && (
              <span
                aria-hidden="true"
                className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-4"
              >
                {item.icon}
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 [overflow-wrap:anywhere]">
              <span className="font-medium">{item.label}</span>
              {item.description && (
                <span className="text-ai-description font-normal text-muted-foreground">
                  {item.description}
                </span>
              )}
            </span>
            {!!item.children?.length && (
              <ChevronRight
                aria-hidden="true"
                focusable="false"
                nonScalingStroke
                strokeWidth={1.5}
                className="ms-auto size-3.5 shrink-0 text-muted-foreground rtl:-scale-x-100"
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
