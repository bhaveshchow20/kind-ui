"use client";

import {
  Collapsible,
  type CollapsibleChangeEventDetails,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import { ChevronDown, Text } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Markdown, type MarkdownProps } from "./markdown.js";
import { ThinkingDots } from "./thinking-dots.js";
import { actionClass, cn, useControllable } from "./utils.js";

export interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  /** Seconds elapsed during the current stream, or final measured seconds. */
  duration: number | undefined;
}
const ReasoningContext = createContext<ReasoningContextValue | null>(null);
export function useReasoning(): ReasoningContextValue {
  const context = useContext(ReasoningContext);
  if (!context) throw new Error("Reasoning parts require <Reasoning>.");
  return context;
}
export type ReasoningProps = Omit<ComponentProps<typeof Collapsible>, "onOpenChange"> & {
  isStreaming?: boolean;
  duration?: number;
  /** Undefined details identify a timer/stream-driven request. Native interactions preserve Base UI details. */
  onOpenChange?: (open: boolean, details?: CollapsibleChangeEventDetails) => void;
  autoOpen?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
};
/** Disclosure state stays independent from model execution; streaming is always host-owned. */
export function Reasoning({
  isStreaming = false,
  duration: durationProp,
  open,
  defaultOpen,
  onOpenChange,
  autoOpen = true,
  autoClose = true,
  autoCloseDelay = 1000,
  disabled = false,
  className,
  children,
  ref,
  ...props
}: ReasoningProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? isStreaming);
  const [measuredDuration, setMeasuredDuration] = useState<number>();
  const start = useRef<number | null>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === "function") {
        const cleanup = ref(node);
        if (typeof cleanup === "function")
          return () => {
            root.current = null;
            cleanup();
          };
      } else if (ref) ref.current = node;
    },
    [ref],
  );
  const interactionVersion = useRef(0);
  const runVersion = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({
    setOpen,
    onOpenChange,
    isOpen,
    autoOpen,
    autoClose,
    autoCloseDelay,
    defaultOpen,
    disabled,
  });
  latest.current = {
    setOpen,
    onOpenChange,
    isOpen,
    autoOpen,
    autoClose,
    autoCloseDelay,
    defaultOpen,
    disabled,
  };
  function change(next: boolean, details?: CollapsibleChangeEventDetails) {
    interactionVersion.current++;
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    latest.current.onOpenChange?.(next, details);
    if (!details?.isCanceled) latest.current.setOpen(next);
  }
  useEffect(() => {
    const request = (next: boolean) => {
      if (latest.current.isOpen !== next && !latest.current.disabled) {
        latest.current.setOpen(next);
        latest.current.onOpenChange?.(next);
      }
    };
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (isStreaming) {
      start.current = performance.now();
      runVersion.current = interactionVersion.current;
      setMeasuredDuration(0);
      if (latest.current.autoOpen && latest.current.defaultOpen !== false) request(true);
      const interval = setInterval(() => {
        if (start.current !== null)
          setMeasuredDuration(Math.max(0, Math.floor((performance.now() - start.current) / 1000)));
      }, 1000);
      return () => clearInterval(interval);
    }
    if (start.current !== null) {
      setMeasuredDuration(Math.max(0, Math.floor((performance.now() - start.current) / 1000)));
      start.current = null;
      if (latest.current.autoClose && interactionVersion.current === runVersion.current) {
        const version = interactionVersion.current;
        closeTimer.current = setTimeout(
          () => {
            closeTimer.current = null;
            const panel = root.current?.querySelector('[data-slot="reasoning-content"]');
            const document = panel?.ownerDocument;
            const selection = document?.getSelection();
            const isReading =
              panel &&
              (panel.contains(document?.activeElement ?? null) ||
                (selection &&
                  !selection.isCollapsed &&
                  (panel.contains(selection.anchorNode) || panel.contains(selection.focusNode))));
            // Streaming completion must not hide a focused link or selected passage.
            if (latest.current.autoClose && version === interactionVersion.current && !isReading)
              request(false);
          },
          Math.max(0, latest.current.autoCloseDelay),
        );
      }
    }
    return () => {
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, [isStreaming]);
  const duration =
    durationProp === undefined
      ? measuredDuration
      : Number.isFinite(durationProp)
        ? Math.max(0, durationProp)
        : undefined;
  return (
    <ReasoningContext.Provider value={{ isStreaming, isOpen, setIsOpen: change, duration }}>
      <Collapsible
        {...props}
        ref={setRootRef}
        open={isOpen}
        disabled={disabled}
        onOpenChange={change}
        data-slot="reasoning"
        data-streaming={isStreaming || undefined}
        className={(state) =>
          cn(
            "group/reasoning grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2",
            typeof className === "function" ? className(state) : className,
          )
        }
      >
        {children}
      </Collapsible>
    </ReasoningContext.Provider>
  );
}
export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};
function thinkingMessage(streaming: boolean, duration?: number): ReactNode {
  if (streaming)
    return (
      <span className="inline-flex items-baseline gap-1.5">
        Thinking
        <span className="inline-block w-[5ch] text-start text-ai-meta font-normal text-muted-foreground">
          {duration === undefined ? "" : `${duration}s`}
        </span>
      </span>
    );
  if (duration === undefined) return "Reasoning";
  return duration === 0
    ? "Thought for less than a second"
    : `Thought for ${duration} ${duration === 1 ? "second" : "seconds"}`;
}
export function ReasoningTrigger({
  children,
  getThinkingMessage = thinkingMessage,
  className,
  ...props
}: ReasoningTriggerProps) {
  const { isStreaming, isOpen, duration } = useReasoning();
  return (
    <CollapsibleTrigger
      {...props}
      data-slot="reasoning-trigger"
      className={(state) =>
        cn(
          actionClass,
          "min-h-7 max-w-full justify-self-start gap-1.5 rounded-md px-1.5 py-1 coarse:min-h-11 text-start text-ai-label font-medium hover:bg-inset hover:text-foreground",
          isStreaming ? "text-foreground" : "text-muted-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {children ?? (
        <>
          {isStreaming ? (
            <ThinkingDots />
          ) : (
            <Text
              aria-hidden="true"
              focusable="false"
              size={14}
              strokeWidth={1.5}
              nonScalingStroke
              className="shrink-0 text-muted-foreground"
            />
          )}
          <span className="min-w-0 break-words text-start tabular-nums">
            {getThinkingMessage(isStreaming, duration)}
          </span>
          <ChevronDown
            aria-hidden="true"
            focusable="false"
            size={14}
            strokeWidth={1.5}
            nonScalingStroke
            className={cn(
              "ms-0.5 shrink-0 text-muted-foreground/70 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out",
              isOpen ? "rotate-0" : "-rotate-90",
            )}
          />
        </>
      )}
    </CollapsibleTrigger>
  );
}
export type ReasoningContentProps = Omit<ComponentProps<typeof CollapsibleContent>, "children"> & {
  /** Strings render through the shared safe streaming Markdown boundary. Nodes enable Nauval-style composition. */
  children: ReactNode;
  markdownProps?: Omit<MarkdownProps, "children">;
  animated?: boolean;
};
export function ReasoningContent({
  children,
  markdownProps,
  animated = true,
  className,
  ...props
}: ReasoningContentProps) {
  const { isStreaming } = useReasoning();
  return (
    <CollapsibleContent
      {...props}
      data-slot="reasoning-content"
      className={(state) =>
        cn(
          "col-span-2 min-w-0 overflow-visible",
          !animated &&
            "motion-safe:transition-none motion-safe:data-[starting-style]:translate-y-0 motion-safe:data-[starting-style]:opacity-100 motion-safe:data-[ending-style]:translate-y-0 motion-safe:data-[ending-style]:opacity-100",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      <div className="max-w-[72ch] break-words pb-1.5 pe-1.5 ps-7 pt-0.5 text-ai-label text-muted-foreground">
        {typeof children === "string" ? (
          <Markdown
            streaming={isStreaming}
            className="text-ai-label text-muted-foreground"
            {...markdownProps}
          >
            {children}
          </Markdown>
        ) : (
          children
        )}
      </div>
    </CollapsibleContent>
  );
}
