"use client";

import { Select } from "@base-ui/react/select";
import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@kind-ui/primitives/combobox";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@kind-ui/primitives/hover-card";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuTrigger,
} from "@kind-ui/primitives/menu";
import { Textarea } from "@kind-ui/primitives/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kind-ui/primitives/tooltip";
import { ArrowUp, LoaderCircle, Monitor, Paperclip, Plus, Square, X } from "lucide-react";
import {
  Children,
  type ComponentProps,
  createContext,
  type FormEvent,
  isValidElement,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { actionClass, actionVariants, cn, safeUrl, useControllable } from "./utils.js";

/** Local browser files remain browser files. Upload/SDK conversion belongs to the host. */
export interface PromptInputFile {
  id: string;
  type: "file";
  filename: string;
  mediaType: string;
  url: string;
  file: File;
}
export interface PromptInputSource {
  type: "source-document";
  sourceId: string;
  mediaType: string;
  title: string;
  filename?: string;
}
export interface AttachmentsContext {
  files: PromptInputFile[];
  add: (files: File[] | FileList) => void;
  remove: (id: string) => void;
  clear: () => void;
  openFileDialog: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}
export interface TextInputContext {
  value: string;
  setInput: (value: string) => void;
  clear: () => void;
}
export interface PromptInputControllerProps {
  textInput: TextInputContext;
  attachments: AttachmentsContext;
  __registerFileInput: (ref: RefObject<HTMLInputElement | null>, open: () => void) => () => void;
}
export interface ReferencedSourcesContext {
  sources: (PromptInputSource & { id: string })[];
  add: (sources: PromptInputSource[] | PromptInputSource) => void;
  remove: (id: string) => void;
  clear: () => void;
}
const Controller = createContext<PromptInputControllerProps | null>(null);
const ProviderAttachments = createContext<AttachmentsContext | null>(null);
const LocalAttachments = createContext<AttachmentsContext | null>(null);
export const LocalReferencedSourcesContext = createContext<ReferencedSourcesContext | null>(null);
function required<T>(value: T | null, name: string): T {
  if (!value) throw new Error(`${name} requires its PromptInput provider.`);
  return value;
}
export function usePromptInputController() {
  return required(useContext(Controller), "usePromptInputController");
}
export function useProviderAttachments() {
  return required(useContext(ProviderAttachments), "useProviderAttachments");
}
export function usePromptInputAttachments() {
  const local = useContext(LocalAttachments);
  const provider = useContext(ProviderAttachments);
  return required(local ?? provider, "usePromptInputAttachments");
}
export function usePromptInputReferencedSources() {
  return required(useContext(LocalReferencedSourcesContext), "usePromptInputReferencedSources");
}
function composeRef<T>(internal: RefObject<T | null>, ref: Ref<T> | undefined) {
  return (value: T | null) => {
    internal.current = value;
    const cleanup = typeof ref === "function" ? ref(value) : undefined;
    if (ref && typeof ref !== "function") ref.current = value;
    if (value === null) return;
    return () => {
      internal.current = null;
      if (typeof cleanup === "function") cleanup();
      else if (typeof ref === "function") ref(null);
      else if (ref) ref.current = null;
    };
  };
}
function useFiles(): AttachmentsContext {
  const [files, setFiles] = useState<PromptInputFile[]>([]);
  const live = useRef(files);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const update = (next: PromptInputFile[]) => {
    live.current = next;
    setFiles(next);
  };
  useEffect(
    () => () => {
      for (const item of live.current) URL.revokeObjectURL(item.url);
    },
    [],
  );
  return {
    files,
    fileInputRef,
    openFileDialog: () => fileInputRef.current?.click(),
    add: (incoming) =>
      update([
        ...live.current,
        ...Array.from(incoming, (file) => ({
          id: crypto.randomUUID(),
          type: "file" as const,
          filename: file.name,
          mediaType: file.type || "application/octet-stream",
          url: URL.createObjectURL(file),
          file,
        })),
      ]),
    remove: (id) => {
      const item = live.current.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.url);
      update(live.current.filter((f) => f.id !== id));
    },
    clear: () => {
      for (const item of live.current) URL.revokeObjectURL(item.url);
      update([]);
    },
  };
}
export interface PromptInputProviderProps {
  children?: ReactNode;
  initialInput?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}
export function PromptInputProvider({
  children,
  initialInput = "",
  value,
  onValueChange,
}: PromptInputProviderProps) {
  const [text, setText] = useControllable(value, initialInput, onValueChange);
  const attachments = useFiles();
  const open = useRef<(() => void) | null>(null);
  const controlledAttachments = { ...attachments, openFileDialog: () => open.current?.() };
  return (
    <Controller.Provider
      value={{
        textInput: { value: text, setInput: setText, clear: () => setText("") },
        attachments: controlledAttachments,
        __registerFileInput: (ref, callback) => {
          attachments.fileInputRef.current = ref.current;
          open.current = callback;
          return () => {
            if (open.current === callback) {
              open.current = null;
              attachments.fileInputRef.current = null;
            }
          };
        },
      }}
    >
      <ProviderAttachments.Provider value={controlledAttachments}>
        {children}
      </ProviderAttachments.Provider>
    </Controller.Provider>
  );
}
export type PromptInputStatus = "ready" | "submitted" | "streaming" | "error";
export interface PromptInputError {
  code: "max_files" | "max_file_size" | "accept" | "submit" | "capture";
  message: string;
  cause?: unknown;
  file?: File;
}
export interface PromptInputEditorSnapshot {
  text: string;
  segments: readonly unknown[];
}
export interface PromptInputEditorRegistration {
  getSnapshot: () => PromptInputEditorSnapshot;
  onSubmit?: () => void | Promise<void>;
  clear: () => void;
}
export interface PromptInputEditorController {
  setText: (text: string) => void;
  disabled: boolean;
  submitting: boolean;
  submit: () => void;
  registerEditor: (editor: PromptInputEditorRegistration) => () => void;
}
export interface PromptInputMessage {
  segments?: readonly unknown[];
  text: string;
  files: PromptInputFile[];
  sources: (PromptInputSource & { id: string })[];
}
export interface PromptInputContextValue {
  rootId: string;
  isEmpty: boolean;
  setEmpty: (empty: boolean) => void;
  setFocused: (focused: boolean) => void;
  registerSubmit: (callback: () => void | Promise<void>) => () => void;
  triggerSubmit: () => void;
  containerRef: RefObject<HTMLFormElement | null>;
  textInput: TextInputContext;
  editor: PromptInputEditorController;
  disabled: boolean;
  submitting: boolean;
  syncHiddenInput: boolean;
  isFocused: boolean;
  submit: () => void;
}
export const PromptInputContext = createContext<PromptInputContextValue | null>(null);
const InputContext = PromptInputContext;
export interface PromptInputExtensionContextValue {
  state: unknown;
  setState: (state: unknown) => void;
}
export const PromptInputExtensionContext = createContext<PromptInputExtensionContextValue | null>(
  null,
);
export function usePromptInputContext(): PromptInputContextValue {
  return required(useContext(PromptInputContext), "usePromptInputContext");
}
export function usePromptInputExtensionContext(): PromptInputExtensionContextValue {
  return required(useContext(PromptInputExtensionContext), "usePromptInputExtensionContext");
}
/** Optional bridge for plain or structured editors; null permits standalone editor use. */
export function usePromptInputEditor(): PromptInputEditorController | null {
  return useContext(InputContext)?.editor ?? null;
}
export function usePromptInput() {
  const ctx = required(useContext(InputContext), "usePromptInput");
  return {
    isEmpty: ctx.isEmpty,
    isFocused: ctx.isFocused,
    disabled: ctx.disabled,
    submitting: ctx.submitting,
    submit: ctx.submit,
  };
}
export type PromptInputProps = Omit<
  ComponentProps<"form">,
  "onSubmit" | "onError" | "onChange" | "defaultValue"
> & {
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  globalDrop?: boolean;
  syncHiddenInput?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  onError?: (error: PromptInputError) => void;
  disabled?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  clearOnSubmit?: boolean;
  onHeightChange?: (height: number) => void;
  size?: "sm" | "md" | "lg";
};
export function PromptInput({
  onSubmit,
  onError,
  accept,
  multiple = false,
  globalDrop = false,
  syncHiddenInput = false,
  maxFiles,
  maxFileSize,
  disabled = false,
  value,
  defaultValue = "",
  onValueChange,
  clearOnSubmit = true,
  onHeightChange,
  size = "md",
  children,
  className,
  ref,
  onDrop,
  onDragOver,
  onDragLeave,
  onFocus,
  onBlur,
  ...props
}: PromptInputProps) {
  const provider = useContext(Controller);
  const local = useFiles();
  const attachments = provider?.attachments ?? local;
  const [text, setText] = useControllable(value, defaultValue, onValueChange);
  const textInput = provider?.textInput ?? {
    value: text,
    setInput: setText,
    clear: () => setText(""),
  };
  const generatedRootId = useId();
  const rootId = props.id ?? generatedRootId;
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sources, setSources] = useState<(PromptInputSource & { id: string })[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setFocused] = useState(false);
  const [emptyOverride, setEmpty] = useState<boolean>();
  const isEmpty =
    emptyOverride ?? (!textInput.value.trim() && !attachments.files.length && !sources.length);
  const [extensionState, setExtensionState] = useState<unknown>(null);
  const submitCallback = useRef<(() => void | Promise<void>) | null>(null);
  const registerSubmit = useCallback((callback: () => void | Promise<void>) => {
    submitCallback.current = callback;
    return () => {
      if (submitCallback.current === callback) {
        submitCallback.current = null;
        setEmpty(undefined);
      }
    };
  }, []);
  const [dropActive, setDropActive] = useState(false);
  const busy = useRef(false);
  const editorRef = useRef<PromptInputEditorRegistration | null>(null);
  const editorRevision = useRef(0);
  const registerEditor = useCallback((editor: PromptInputEditorRegistration) => {
    editorRef.current = editor;
    return () => {
      if (editorRef.current === editor) editorRef.current = null;
    };
  }, []);
  const mounted = useRef(true);
  const lifecycle = useRef(0);
  const latest = useRef({ textInput, attachments, sources });
  latest.current = { textInput, attachments, sources };
  const setEditorText = useCallback((next: string) => {
    editorRevision.current++;
    setEmpty(undefined);
    latest.current.textInput.setInput(next);
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      lifecycle.current++;
    };
  }, []);
  const reservedCount = useRef(attachments.files.length);
  reservedCount.current = attachments.files.length;
  const current = useRef({
    attachments,
    disabled,
    onError,
    accept,
    multiple,
    maxFiles,
    maxFileSize,
  });
  current.current = { attachments, disabled, onError, accept, multiple, maxFiles, maxFileSize };
  function add(incoming: File[] | FileList) {
    const c = current.current;
    if (c.disabled) return;
    let count = reservedCount.current;
    const accepted: File[] = [];
    for (const file of Array.from(incoming)) {
      const patterns = c.accept
        ?.toLowerCase()
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const matches =
        !patterns?.length ||
        patterns.some((pattern) =>
          pattern.startsWith(".")
            ? file.name.toLowerCase().endsWith(pattern)
            : pattern.endsWith("/*")
              ? file.type.toLowerCase().startsWith(pattern.slice(0, -1))
              : file.type.toLowerCase() === pattern,
        );
      if (!matches) {
        c.onError?.({ code: "accept", message: `${file.name} has an unsupported type.`, file });
        continue;
      }
      if (c.maxFileSize !== undefined && file.size > c.maxFileSize) {
        c.onError?.({
          code: "max_file_size",
          message: `${file.name} exceeds the file size limit.`,
          file,
        });
        continue;
      }
      if (count >= (c.maxFiles ?? Infinity) || (!c.multiple && count >= 1)) {
        c.onError?.({ code: "max_files", message: "The attachment limit has been reached.", file });
        continue;
      }
      accepted.push(file);
      count++;
    }
    reservedCount.current = count;
    c.attachments.add(accepted);
  }
  const addRef = useRef(add);
  addRef.current = add;
  const registration = provider?.__registerFileInput;
  useEffect(
    () => registration?.(fileInputRef, () => fileInputRef.current?.click()),
    [registration],
  );
  useEffect(() => {
    if (!globalDrop) return;
    const drag = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files") && !current.current.disabled)
        event.preventDefault();
    };
    const drop = (event: DragEvent) => {
      if (event.defaultPrevented || !event.dataTransfer?.files.length || current.current.disabled)
        return;
      event.preventDefault();
      addRef.current(event.dataTransfer.files);
    };
    document.addEventListener("dragover", drag);
    document.addEventListener("drop", drop);
    return () => {
      document.removeEventListener("dragover", drag);
      document.removeEventListener("drop", drop);
    };
  }, [globalDrop]);
  useEffect(() => {
    if (!onHeightChange || !formRef.current || typeof ResizeObserver === "undefined") return;
    const element = formRef.current;
    let previous = -1;
    const emit = () => {
      const height = element.getBoundingClientRect().height;
      if (height !== previous) {
        previous = height;
        onHeightChange(height);
      }
    };
    emit();
    const observer = new ResizeObserver(emit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeightChange]);
  const refs: ReferencedSourcesContext = {
    sources,
    add: (incoming) =>
      setSources((prev) => [
        ...prev,
        ...(Array.isArray(incoming) ? incoming : [incoming]).map((source) => ({
          ...source,
          id: crypto.randomUUID(),
        })),
      ]),
    remove: (id) => setSources((prev) => prev.filter((source) => source.id !== id)),
    clear: () => setSources([]),
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || busy.current) return;
    const snapshot = latest.current;
    const editor = editorRef.current;
    const rich = editor?.getSnapshot();
    const revision = editorRevision.current;
    const lifetime = lifecycle.current;
    const isCurrent = () => mounted.current && lifecycle.current === lifetime;
    const message: PromptInputMessage = {
      text: rich?.text ?? snapshot.textInput.value,
      ...(rich ? { segments: rich.segments } : {}),
      files: [...snapshot.attachments.files],
      sources: [...snapshot.sources],
    };
    if (isEmpty) return;
    busy.current = true;
    setSubmitting(true);
    try {
      await submitCallback.current?.();
      if (!isCurrent()) return;
      await editor?.onSubmit?.();
      if (!isCurrent()) return;
      await onSubmit(message, event);
      if (isCurrent() && clearOnSubmit) {
        if (
          latest.current.textInput.value === message.text &&
          revision === editorRevision.current
        ) {
          setEmpty(undefined);
          latest.current.textInput.clear();
          if (editor && editorRef.current === editor) editor.clear();
        }
        for (const file of message.files) latest.current.attachments.remove(file.id);
        setSources((prev) =>
          prev.filter((source) => !message.sources.some((sent) => sent.id === source.id)),
        );
      }
    } catch (cause) {
      if (isCurrent())
        onError?.({
          code: "submit",
          message: "The message could not be sent. Your draft is retained.",
          cause,
        });
    } finally {
      busy.current = false;
      if (isCurrent()) setSubmitting(false);
    }
  }
  return (
    <PromptInputExtensionContext.Provider
      value={{ state: extensionState, setState: setExtensionState }}
    >
      <InputContext.Provider
        value={{
          rootId,
          isEmpty,
          setEmpty,
          setFocused,
          registerSubmit,
          triggerSubmit: () => formRef.current?.requestSubmit(),
          containerRef: formRef,
          textInput,
          editor: {
            setText: setEditorText,
            disabled,
            submitting,
            submit: () => formRef.current?.requestSubmit(),
            registerEditor,
          },
          disabled,
          submitting,
          syncHiddenInput,
          isFocused,
          submit: () => formRef.current?.requestSubmit(),
        }}
      >
        <LocalAttachments.Provider
          value={{
            ...attachments,
            add,
            fileInputRef,
            openFileDialog: () => {
              if (!disabled) fileInputRef.current?.click();
            },
          }}
        >
          <LocalReferencedSourcesContext.Provider value={refs}>
            <form
              {...props}
              id={rootId}
              ref={composeRef(formRef, ref)}
              onSubmit={(event) => {
                void submit(event);
              }}
              aria-disabled={disabled || undefined}
              aria-busy={submitting || undefined}
              data-slot="prompt-input"
              data-size={size}
              data-empty={isEmpty}
              data-focus={isFocused}
              data-dragging={dropActive || undefined}
              className={cn(
                "kind-surface group/prompt-input relative flex min-w-0 flex-col rounded-[1.25rem] bg-surface p-2 text-foreground outline-none transition-colors duration-120 has-[:focus-visible]:shadow-kind-focus data-[dragging]:bg-primary/5 data-[dragging]:shadow-kind-focus data-[size=sm]:rounded-2xl data-[size=sm]:p-1 data-[size=lg]:p-2",
                disabled && "opacity-50",
                className,
              )}
              onFocus={(event) => {
                onFocus?.(event);
                if (!event.defaultPrevented) setFocused(true);
              }}
              onBlur={(event) => {
                onBlur?.(event);
                if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
              }}
              onDragOver={(event) => {
                onDragOver?.(event);
                if (
                  !event.defaultPrevented &&
                  !disabled &&
                  event.dataTransfer.types.includes("Files")
                ) {
                  event.preventDefault();
                  setDropActive(true);
                }
              }}
              onDragLeave={(event) => {
                onDragLeave?.(event);
                if (!event.defaultPrevented) setDropActive(false);
              }}
              onDrop={(event) => {
                onDrop?.(event);
                setDropActive(false);
                if (!event.defaultPrevented && !disabled && event.dataTransfer.files.length) {
                  event.preventDefault();
                  add(event.dataTransfer.files);
                }
              }}
            >
              <input
                type="file"
                className="hidden"
                aria-label="Upload files"
                ref={fileInputRef}
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                onChange={(event) => {
                  if (event.currentTarget.files) add(event.currentTarget.files);
                  event.currentTarget.value = "";
                }}
              />
              {syncHiddenInput && <input type="hidden" name="message" value={textInput.value} />}
              {children}
            </form>
          </LocalReferencedSourcesContext.Provider>
        </LocalAttachments.Provider>
      </InputContext.Provider>
    </PromptInputExtensionContext.Provider>
  );
}
export type PromptInputTextareaProps = Omit<
  ComponentProps<"textarea">,
  "value" | "defaultValue" | "onSubmit"
> & {
  onSubmit?: (text: string) => void | Promise<void>;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  maxRows?: number;
  submitOnEnter?: boolean;
};
export function PromptInputTextarea({
  ref,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  maxRows = 8,
  submitOnEnter = true,
  disabled,
  className,
  placeholder = "Ask anything, or add context…",
  name,
  rows = 1,
  onChange,
  onKeyDown,
  onPaste,
  onCompositionStart,
  onCompositionEnd,
  "aria-label": label = "Message",
  ...props
}: PromptInputTextareaProps) {
  const state = required(useContext(InputContext), "PromptInputTextarea");
  const attachments = usePromptInputAttachments();
  const elementRef = useRef<HTMLTextAreaElement | null>(null);
  const composing = useRef(false);
  const [draftSeeded, setDraftSeeded] = useState(defaultValue === undefined || value !== undefined);
  const text =
    value ?? (!draftSeeded ? (defaultValue ?? state.textInput.value) : state.textInput.value);
  const initialDraft = useRef({ defaultValue, value });
  const lastNotifiedValue = useRef(value ?? defaultValue ?? state.textInput.value);
  const valueChangeCallback = useRef(onValueChange);
  valueChangeCallback.current = onValueChange;
  useEffect(() => {
    if (value === undefined && lastNotifiedValue.current !== text) {
      lastNotifiedValue.current = text;
      valueChangeCallback.current?.(text);
    }
  }, [text, value]);
  const hasInputSubmit = onSubmit !== undefined;
  const inputSubmit = useRef(onSubmit);
  inputSubmit.current = onSubmit;
  const registerInputSubmit = state.registerSubmit;
  useEffect(() => {
    if (hasInputSubmit)
      return registerInputSubmit(() => inputSubmit.current?.(stateRef.current.textInput.value));
  }, [hasInputSubmit, registerInputSubmit]);
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (value !== undefined && value !== state.textInput.value)
      stateRef.current.textInput.setInput(value);
  }, [value, state.textInput.value]);
  useEffect(() => {
    if (
      initialDraft.current.defaultValue !== undefined &&
      initialDraft.current.value === undefined
    ) {
      stateRef.current.textInput.setInput(initialDraft.current.defaultValue);
      setDraftSeeded(true);
    }
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Text changes alter scrollHeight after controlled rendering.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const resize = () => {
      element.style.height = "auto";
      const style = getComputedStyle(element);
      const line = Number.parseFloat(style.lineHeight) || 24;
      const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
      const maxHeight = Math.max(rows, maxRows) * line + padding;
      const height = Math.min(element.scrollHeight, maxHeight);
      const borders =
        Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
      element.style.height = `${style.boxSizing === "border-box" ? height + borders : height - padding}px`;
      element.style.overflowY = element.scrollHeight > maxHeight ? "auto" : "hidden";
    };
    resize();
    if (typeof ResizeObserver === "undefined") return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (width !== element.clientWidth) {
        width = element.clientWidth;
        resize();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, maxRows, rows]);
  return (
    <Textarea
      autoGrow={false}
      {...props}
      ref={composeRef(elementRef, ref)}
      name={name ?? (state.syncHiddenInput ? undefined : "message")}
      rows={rows}
      value={text}
      disabled={disabled || state.disabled}
      placeholder={placeholder}
      aria-label={label}
      data-slot="prompt-input-textarea"
      className={cn(
        "block max-h-none min-h-10 w-full resize-none rounded-none border-0 bg-transparent px-2.5 py-1 font-normal text-ai-prose leading-[inherit] shadow-none focus-visible:bg-transparent focus-visible:shadow-none not-disabled:not-read-only:hover:bg-transparent disabled:bg-transparent disabled:opacity-100 text-foreground outline-none placeholder:text-placeholder placeholder:text-ai-label placeholder:leading-[inherit] disabled:cursor-not-allowed group-data-[size=sm]/prompt-input:min-h-9 group-data-[size=sm]/prompt-input:px-2 group-data-[size=sm]/prompt-input:py-1 group-data-[size=lg]/prompt-input:min-h-12 group-data-[size=lg]/prompt-input:px-3 group-data-[size=lg]/prompt-input:py-3",
        className,
      )}
      onChange={(event) => {
        onChange?.(event);
        if (!event.defaultPrevented) {
          state.textInput.setInput(event.currentTarget.value);
          lastNotifiedValue.current = event.currentTarget.value;
          onValueChange?.(event.currentTarget.value);
        }
      }}
      onCompositionStart={(event) => {
        composing.current = true;
        onCompositionStart?.(event);
      }}
      onCompositionEnd={(event) => {
        composing.current = false;
        onCompositionEnd?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          composing.current ||
          event.nativeEvent.isComposing ||
          event.keyCode === 229
        )
          return;
        if (event.key === "Enter" && submitOnEnter && !event.shiftKey) {
          event.preventDefault();
          const button =
            event.currentTarget.form?.querySelector<HTMLButtonElement>('button[type="submit"]');
          if (!state.disabled && !state.submitting && !button?.disabled)
            event.currentTarget.form?.requestSubmit();
        }
        if (event.key === "Backspace" && !event.currentTarget.value && attachments.files.length) {
          const last = attachments.files.at(-1);
          if (last) {
            event.preventDefault();
            attachments.remove(last.id);
          }
        }
      }}
      onPaste={(event) => {
        onPaste?.(event);
        if (event.defaultPrevented) return;
        const files = Array.from(event.clipboardData.files);
        if (files.length) {
          if (!event.clipboardData.getData("text/plain")) event.preventDefault();
          attachments.add(files);
        }
      }}
    />
  );
}
export type PromptInputBodyProps = ComponentProps<"div">;
export function PromptInputBody({ className, ...props }: PromptInputBodyProps) {
  return (
    <div
      data-slot="prompt-input-body"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}
export type PromptInputHeaderProps = ComponentProps<"div">;
export function PromptInputHeader({ className, ...props }: PromptInputHeaderProps) {
  return (
    <div
      data-slot="prompt-input-header"
      className={cn(
        "order-first flex min-w-0 flex-wrap items-start gap-2 px-2.5 pb-1 pt-1 empty:hidden [&_[data-slot=attachments]]:min-w-0 [&_[data-slot=attachments]]:gap-2",
        className,
      )}
      {...props}
    />
  );
}
export type PromptInputFooterProps = ComponentProps<"div">;
export function PromptInputFooter({ className, ...props }: PromptInputFooterProps) {
  return (
    <div
      data-slot="prompt-input-footer"
      className={cn(
        "flex min-w-0 flex-wrap items-center justify-between gap-2 px-0.5 pt-1",
        className,
      )}
      {...props}
    />
  );
}
export type PromptInputToolsProps = ComponentProps<"div">;
export function PromptInputTools({ className, ...props }: PromptInputToolsProps) {
  return (
    <div
      data-slot="prompt-input-tools"
      className={cn("flex min-w-0 flex-wrap items-center gap-0.5 text-muted-foreground", className)}
      {...props}
    />
  );
}
export function PromptInputToolbarSpacer({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("ms-auto flex shrink-0 items-center gap-1", className)} {...props} />;
}
export type PromptInputButtonTooltip =
  | string
  | { content: ReactNode; shortcut?: string; side?: "top" | "bottom" | "left" | "right" };
export type PromptInputButtonProps = useRender.ComponentProps<"button"> & {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
  tooltip?: PromptInputButtonTooltip;
};
function hasTextContent(children: ReactNode): boolean {
  return Children.toArray(children).some((child) =>
    typeof child === "string" || typeof child === "number"
      ? String(child).trim().length > 0
      : isValidElement<{ children?: ReactNode }>(child) && hasTextContent(child.props.children),
  );
}
export function PromptInputButton({
  size = "md",
  variant = "ghost",
  type = "button",
  className,
  tooltip,
  render,
  ref,
  ...props
}: PromptInputButtonProps) {
  const tooltipContent = typeof tooltip === "string" ? tooltip : tooltip?.content;
  const button = useRender({
    defaultTagName: "button",
    render: render ?? <Button variant={variant} size="sm" />,
    ref,
    props: {
      ...props,
      type,
      "aria-label":
        props["aria-label"] ??
        (!hasTextContent(props.children) && typeof tooltipContent === "string"
          ? tooltipContent
          : undefined),
      "data-size": size,
      "data-variant": variant,
      className: cn(
        actionVariants(variant),
        "relative border-0 py-0 text-center leading-[inherit] shadow-none min-h-7 gap-1.5 px-2 text-ai-label font-medium data-[size=sm]:min-h-6 data-[size=sm]:px-1.5 data-[size=lg]:min-h-8 data-[size=lg]:px-3 data-[variant=ghost]:text-muted-foreground data-[variant=ghost]:hover:bg-inset data-[variant=ghost]:hover:text-foreground data-[variant=outline]:border data-[variant=outline]:border-transparent data-[variant=outline]:bg-elevated [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      ),
    },
  });
  if (!tooltip) return button;
  const content = typeof tooltip === "string" ? tooltip : tooltip.content;
  return (
    <TooltipProvider delay={600} closeDelay={0}>
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent
          side={typeof tooltip === "string" ? "top" : (tooltip.side ?? "top")}
          sideOffset={6}
          className="rounded-lg bg-foreground px-2.5 py-1.5 text-ai-description text-background shadow-sm"
        >
          {content}
          {typeof tooltip !== "string" && tooltip.shortcut && (
            <kbd className="ms-1.5 text-ai-meta text-background/75">{tooltip.shortcut}</kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
export type PromptInputSubmitProps = PromptInputButtonProps & {
  status?: PromptInputStatus;
  onStop?: () => void;
};
export function PromptInputSubmit({
  status = "ready",
  onStop,
  onClick,
  children,
  disabled,
  variant = "default",
  className,
  ...props
}: PromptInputSubmitProps) {
  const ctx = useContext(InputContext);
  const state = usePromptInput();
  const active = status === "submitted" || status === "streaming";
  return (
    <PromptInputButton
      {...props}
      variant={variant}
      render={props.render ?? <Button variant={variant} size="sm" contentKey={status} />}
      className={cn(
        "ms-auto shrink-0",
        children == null &&
          "size-7 min-h-7 p-0 data-[size=sm]:size-6 data-[size=sm]:min-h-6 data-[size=sm]:p-0 data-[size=lg]:size-8 data-[size=lg]:min-h-8 data-[size=lg]:p-0 coarse:size-11 coarse:min-h-11",
        className,
      )}
      type={active ? "button" : "submit"}
      aria-label={
        props["aria-label"] ??
        (active ? "Stop response" : status === "error" ? "Retry message" : "Send message")
      }
      disabled={disabled || ctx?.disabled || (active ? !onStop : state.isEmpty || state.submitting)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && active) {
          event.preventDefault();
          onStop?.();
        }
      }}
    >
      {children ?? (
        <span
          aria-hidden="true"
          className={status === "submitted" ? "motion-safe:animate-spin" : undefined}
        >
          {status === "submitted" ? (
            <LoaderCircle
              aria-hidden="true"
              focusable="false"
              size={16}
              strokeWidth={1.5}
              nonScalingStroke
            />
          ) : active ? (
            <Square
              aria-hidden="true"
              focusable="false"
              size={16}
              strokeWidth={1.5}
              nonScalingStroke
              fill="currentColor"
            />
          ) : (
            <ArrowUp
              aria-hidden="true"
              focusable="false"
              size={16}
              strokeWidth={1.5}
              nonScalingStroke
            />
          )}
        </span>
      )}
    </PromptInputButton>
  );
}
export type PromptInputActionMenuProps = ComponentProps<typeof Menu>;
export const PromptInputActionMenu = Menu;
export type PromptInputActionMenuTriggerProps = ComponentProps<typeof MenuTrigger>;
export function PromptInputActionMenuTrigger({
  children,
  className,
  ...props
}: PromptInputActionMenuTriggerProps) {
  return (
    <MenuTrigger
      aria-label="Prompt actions"
      {...props}
      className={(state) =>
        cn(
          actionClass,
          "size-6 min-h-6 shrink-0 p-0 text-muted-foreground hover:bg-inset hover:text-foreground coarse:size-11 [&_svg]:size-3.5",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {children ?? (
        <Plus aria-hidden="true" focusable="false" size={16} strokeWidth={1.5} nonScalingStroke />
      )}
    </MenuTrigger>
  );
}
export type PromptInputActionMenuContentProps = ComponentProps<typeof MenuPopup> &
  Pick<ComponentProps<typeof MenuPositioner>, "align" | "side" | "sideOffset">;
const floatingClass =
  "z-50 min-w-44 rounded-xl border border-transparent bg-elevated p-1 text-ai-label text-foreground shadow-kind-float outline-none";
export function PromptInputActionMenuContent({
  align = "start",
  side = "bottom",
  sideOffset = 6,
  className,
  ...props
}: PromptInputActionMenuContentProps) {
  return (
    <MenuPortal>
      <MenuPositioner align={align} side={side} sideOffset={sideOffset}>
        <MenuPopup
          {...props}
          className={(state) =>
            cn(floatingClass, typeof className === "function" ? className(state) : className)
          }
        />
      </MenuPositioner>
    </MenuPortal>
  );
}
export type PromptInputActionMenuItemProps = ComponentProps<typeof MenuItem>;
export function PromptInputActionMenuItem({ className, ...props }: PromptInputActionMenuItemProps) {
  return (
    <MenuItem
      {...props}
      className={(state) =>
        cn(
          "flex min-h-8 cursor-default items-center gap-2 rounded-lg text-start px-2.5 py-1.5 coarse:min-h-11 text-ai-label outline-none data-[highlighted]:bg-inset data-[disabled]:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type PromptInputActionAddAttachmentsProps = PromptInputActionMenuItemProps & {
  label?: string;
};
export function PromptInputActionAddAttachments({
  label = "Add photos or files",
  onClick,
  children,
  ...props
}: PromptInputActionAddAttachmentsProps) {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputActionMenuItem
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) attachments.openFileDialog();
      }}
    >
      {children ?? (
        <>
          <Paperclip
            aria-hidden="true"
            focusable="false"
            size={16}
            strokeWidth={1.5}
            nonScalingStroke
          />
          <span>{label}</span>
        </>
      )}
    </PromptInputActionMenuItem>
  );
}
export type PromptInputActionAddScreenshotProps = PromptInputActionMenuItemProps & {
  label?: string;
  onError?: (error: PromptInputError) => void;
  onCancel?: () => void;
};
export function PromptInputActionAddScreenshot({
  label = "Take screenshot",
  onError,
  onCancel,
  onClick,
  children,
  ...props
}: PromptInputActionAddScreenshotProps) {
  const attachments = usePromptInputAttachments();
  const prompt = useContext(InputContext);
  const disabled = props.disabled || prompt?.disabled;
  const [capturing, setCapturing] = useState(false);
  const captureBusy = useRef(false);
  const live = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelCaptureWait = useRef<(() => void) | null>(null);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      cancelCaptureWait.current?.();
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);
  async function capture() {
    if (disabled || captureBusy.current || !live.current) return;
    captureBusy.current = true;
    setCapturing(true);
    let stream: MediaStream | undefined;
    const video = document.createElement("video");
    try {
      if (!navigator.mediaDevices?.getDisplayMedia)
        throw new Error("Screen capture is unavailable in this browser.");
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (!live.current) return;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          video.onloadedmetadata = null;
          video.onerror = null;
          cancelCaptureWait.current = null;
        };
        cancelCaptureWait.current = () => {
          cleanup();
          reject(new DOMException("Screen capture canceled.", "AbortError"));
        };
        video.onloadedmetadata = () => {
          cleanup();
          resolve();
        };
        video.onerror = () => {
          cleanup();
          reject(new Error("Screen capture could not be decoded."));
        };
      });
      await video.play();
      if (!live.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context || !canvas.width || !canvas.height)
        throw new Error("Screen capture has no image.");
      context.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Screen capture could not be encoded.");
      if (live.current)
        attachments.add([new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" })]);
    } catch (cause) {
      if (live.current) {
        if (
          cause instanceof DOMException &&
          (cause.name === "NotAllowedError" || cause.name === "AbortError")
        )
          onCancel?.();
        else
          onError?.({ code: "capture", message: "The screenshot could not be captured.", cause });
      }
    } finally {
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      captureBusy.current = false;
      video.pause();
      video.srcObject = null;
      if (live.current) setCapturing(false);
    }
  }
  return (
    <PromptInputActionMenuItem
      {...props}
      disabled={disabled || capturing}
      closeOnClick={false}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) void capture();
      }}
    >
      {children ?? (
        <>
          <Monitor
            aria-hidden="true"
            focusable="false"
            size={16}
            strokeWidth={1.5}
            nonScalingStroke
          />
          <span>{label}</span>
        </>
      )}
    </PromptInputActionMenuItem>
  );
}
export type PromptInputSelectProps = ComponentProps<typeof Select.Root<string>>;
export function PromptInputSelect(props: PromptInputSelectProps) {
  return <Select.Root<string> {...props} />;
}
export type PromptInputSelectTriggerProps = ComponentProps<typeof Select.Trigger>;
export function PromptInputSelectTrigger({ className, ...props }: PromptInputSelectTriggerProps) {
  return (
    <Select.Trigger
      {...props}
      className={(state) =>
        cn(
          actionClass,
          "min-h-7 min-w-0 max-w-52 gap-1.5 whitespace-normal break-words text-start px-2 text-ai-label font-medium text-muted-foreground hover:bg-inset hover:text-foreground [&_svg]:size-3.5 [&_svg]:shrink-0",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type PromptInputSelectContentProps = ComponentProps<typeof Select.Popup> &
  Pick<ComponentProps<typeof Select.Positioner>, "align" | "side" | "sideOffset">;
export function PromptInputSelectContent({
  align = "start",
  side = "bottom",
  sideOffset = 6,
  className,
  ...props
}: PromptInputSelectContentProps) {
  return (
    <Select.Portal>
      <Select.Positioner align={align} side={side} sideOffset={sideOffset}>
        <Select.Popup
          {...props}
          className={(state) =>
            cn(floatingClass, typeof className === "function" ? className(state) : className)
          }
        />
      </Select.Positioner>
    </Select.Portal>
  );
}
export type PromptInputSelectItemProps = ComponentProps<typeof Select.Item>;
export function PromptInputSelectItem({
  children,
  className,
  ...props
}: PromptInputSelectItemProps) {
  return (
    <Select.Item
      {...props}
      className={(state) =>
        cn(
          "flex min-h-8 items-center rounded-lg px-2.5 py-1.5 coarse:min-h-11 text-ai-label outline-none data-[highlighted]:bg-inset data-[disabled]:opacity-40",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      <Select.ItemText className="inline-flex min-w-0 items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0">
        {children}
      </Select.ItemText>
    </Select.Item>
  );
}
export type PromptInputSelectValueProps = ComponentProps<typeof Select.Value>;
export function PromptInputSelectValue({ className, ...props }: PromptInputSelectValueProps) {
  return (
    <Select.Value
      {...props}
      className={(state) =>
        cn(
          "inline-flex min-w-0 items-center gap-1.5 [overflow-wrap:anywhere] [&_svg]:size-3.5 [&_svg]:shrink-0 [&_img]:size-3.5 [&_img]:shrink-0",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type PromptInputHoverCardProps = ComponentProps<typeof HoverCard>;
export function PromptInputHoverCard({
  openDelay = 0,
  closeDelay = 0,
  ...props
}: PromptInputHoverCardProps) {
  return <HoverCard openDelay={openDelay} closeDelay={closeDelay} {...props} />;
}
export type PromptInputHoverCardTriggerProps = ComponentProps<typeof HoverCardTrigger>;
export function PromptInputHoverCardTrigger({ href, ...props }: PromptInputHoverCardTriggerProps) {
  return <HoverCardTrigger {...props} {...(safeUrl(href) ? { href: safeUrl(href) } : {})} />;
}
export type PromptInputHoverCardContentProps = ComponentProps<typeof HoverCardContent>;
export function PromptInputHoverCardContent({
  align = "start",
  side = "top",
  sideOffset = 6,
  className,
  ...props
}: PromptInputHoverCardContentProps) {
  return (
    <HoverCardContent
      align={align}
      side={side}
      sideOffset={sideOffset}
      {...props}
      className={(state) =>
        cn(floatingClass, "p-3", typeof className === "function" ? className(state) : className)
      }
    />
  );
}
export type PromptInputTabsListProps = ComponentProps<"div">;
export function PromptInputTabsList(props: PromptInputTabsListProps) {
  return <div {...props} />;
}
export type PromptInputTabProps = ComponentProps<"div">;
export function PromptInputTab(props: PromptInputTabProps) {
  return <div {...props} />;
}
export type PromptInputTabLabelProps = ComponentProps<"h3">;
export function PromptInputTabLabel({ className, ...props }: PromptInputTabLabelProps) {
  return (
    <h3
      className={cn("mb-1 px-2.5 text-ai-description font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}
export type PromptInputTabBodyProps = ComponentProps<"div">;
export function PromptInputTabBody({ className, ...props }: PromptInputTabBodyProps) {
  return <div className={cn("space-y-1", className)} {...props} />;
}
export type PromptInputTabItemProps = ComponentProps<"div">;
export function PromptInputTabItem({ className, ...props }: PromptInputTabItemProps) {
  return (
    <div
      className={cn(
        "flex min-h-8 min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-ai-label",
        className,
      )}
      {...props}
    />
  );
}
/** Command search delegates filtering, active-descendant navigation and selection to Base UI. Supply items and render the collection in List. */
export type PromptInputCommandProps = ComponentProps<typeof Combobox<string>>;
export function PromptInputCommand(props: PromptInputCommandProps) {
  return <Combobox<string> inline autoHighlight {...props} />;
}
export type PromptInputCommandInputProps = ComponentProps<typeof ComboboxInput>;
export function PromptInputCommandInput({ className, ...props }: PromptInputCommandInputProps) {
  return (
    <ComboboxInput
      aria-label="Search actions"
      {...props}
      className={(state) =>
        cn(
          "min-h-9 w-full rounded-lg bg-inset/60 px-2.5 coarse:min-h-11 text-ai-prose outline-none placeholder:text-placeholder placeholder:text-ai-label focus-visible:outline-none focus-visible:shadow-kind-focus",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type PromptInputCommandListProps = ComponentProps<typeof ComboboxList>;
export function PromptInputCommandList({ className, ...props }: PromptInputCommandListProps) {
  return (
    <ComboboxList
      {...props}
      className={(state) =>
        cn(
          "max-h-64 overflow-y-auto overscroll-contain p-1 outline-none",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type PromptInputCommandEmptyProps = ComponentProps<typeof ComboboxEmpty>;
export function PromptInputCommandEmpty({ className, ...props }: PromptInputCommandEmptyProps) {
  return (
    <ComboboxEmpty
      {...props}
      className={(state) =>
        cn(
          "px-3 py-4 text-center text-ai-description text-muted-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type PromptInputCommandGroupProps = ComponentProps<typeof ComboboxGroup> & {
  heading?: ReactNode;
};
export function PromptInputCommandGroup({
  heading,
  children,
  ...props
}: PromptInputCommandGroupProps) {
  return (
    <ComboboxGroup {...props}>
      {heading && (
        <ComboboxGroupLabel className="px-2.5 pb-1 pt-2 text-ai-description font-medium text-muted-foreground">
          {heading}
        </ComboboxGroupLabel>
      )}
      {children}
    </ComboboxGroup>
  );
}
export type PromptInputCommandItemProps = ComponentProps<typeof ComboboxItem> & {
  onSelect?: (value: string) => void;
};
export function PromptInputCommandItem({
  onSelect,
  onClick,
  className,
  ...props
}: PromptInputCommandItemProps) {
  return (
    <ComboboxItem
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !event.baseUIHandlerPrevented && !props.disabled)
          onSelect?.(String(props.value));
      }}
      className={(state) =>
        cn(
          "flex min-h-8 cursor-default items-center gap-2 rounded-lg text-start px-2.5 py-1.5 coarse:min-h-11 text-ai-label outline-none data-[highlighted]:bg-inset data-[disabled]:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type PromptInputCommandSeparatorProps = ComponentProps<"hr">;
export function PromptInputCommandSeparator({
  className,
  ...props
}: PromptInputCommandSeparatorProps) {
  return <hr className={cn("my-1.5 border-transparent", className)} {...props} />;
}
export function PromptInputQuote({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="prompt-input-quote"
      className={cn(
        "mx-1.5 mb-0.5 mt-1.5 flex items-start gap-1.5 rounded-lg bg-inset px-2.5 py-1.5 text-ai-description text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
export function PromptInputQuoteIcon({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-0.5 inline-flex shrink-0 text-muted-foreground [&>svg]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}
export function PromptInputQuoteContent({
  ref,
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  const element = useRef<HTMLDivElement | null>(null);
  const [overflows, setOverflows] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Content changes can change overflow without changing the clipped box size.
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const update = () => setOverflows(node.scrollHeight > node.clientHeight + 1);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children]);
  return (
    <div
      {...props}
      ref={composeRef(element, ref)}
      data-overflows={overflows || undefined}
      className={cn(
        "max-h-[3lh] min-w-0 flex-1 overflow-hidden whitespace-pre-wrap data-[overflows]:mask-b-from-70%",
        className,
      )}
    >
      {children}
    </div>
  );
}
export function PromptInputQuoteDismiss({ children, ...props }: PromptInputButtonProps) {
  return (
    <PromptInputButton aria-label="Remove quote" {...props}>
      {children ?? (
        <X aria-hidden="true" focusable="false" size={16} strokeWidth={1.5} nonScalingStroke />
      )}
    </PromptInputButton>
  );
}
