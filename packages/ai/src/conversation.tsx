"use client";

import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import { useReducedMotion } from "@kind-ui/primitives/use-reduced-motion";
import { ArrowDown, Download } from "lucide-react";
import {
  type ComponentPropsWithRef,
  createContext,
  type MouseEvent,
  type ReactNode,
  type Ref,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  type StickToBottomInstance,
  type StickToBottomOptions,
  useStickToBottom,
} from "use-stick-to-bottom";
import { actionClass, cn } from "./utils.js";

export type ConversationHandle = StickToBottomInstance;
const ConversationContext = createContext<ConversationHandle | null>(null);

/** Scroll state and interruption controls; messages and transport remain host-owned. */
export function useConversation(): ConversationHandle {
  const value = useContext(ConversationContext);
  if (!value) throw new Error("useConversation must be used inside Conversation.");
  return value;
}

export type ConversationProps = Omit<useRender.ComponentProps<"div">, "children"> &
  StickToBottomOptions & {
    children?: ReactNode | ((context: ConversationHandle) => ReactNode);
    instance?: StickToBottomInstance;
    contextRef?: Ref<ConversationHandle>;
  };

/** Constrain the root's height (or its flex parent) to create a scrollable thread. */
export function Conversation({
  ref,
  render,
  children,
  className,
  initial = "smooth",
  resize = "smooth",
  mass,
  damping,
  stiffness,
  targetScrollTop,
  instance,
  contextRef,
  ...props
}: ConversationProps) {
  const reducedMotion = useReducedMotion();
  const ownInstance = useStickToBottom({
    initial: reducedMotion && initial !== false ? "instant" : initial,
    resize: reducedMotion ? "instant" : resize,
    ...(mass === undefined ? {} : { mass }),
    ...(damping === undefined ? {} : { damping }),
    ...(stiffness === undefined ? {} : { stiffness }),
    ...(targetScrollTop === undefined ? {} : { targetScrollTop }),
  });
  const selected = instance ?? ownInstance;
  const { state: scrollState, stopScroll } = selected;
  useLayoutEffect(() => {
    // A running spring captures its animation options. Cancel it through the
    // public interruption API rather than moving a reader's current position.
    if (
      reducedMotion &&
      scrollState.isAtBottom &&
      scrollState.animation &&
      scrollState.animation.behavior !== "instant"
    )
      stopScroll();
  }, [reducedMotion, scrollState, stopScroll]);
  const context = useMemo<ConversationHandle>(
    () => ({
      ...selected,
      scrollToBottom: (options) => {
        if (!reducedMotion) return selected.scrollToBottom(options);
        return selected.scrollToBottom(
          typeof options === "object" ? { ...options, animation: "instant" } : "instant",
        );
      },
    }),
    [selected, reducedMotion],
  );
  useImperativeHandle(contextRef, () => context, [context]);
  const element = useRender({
    defaultTagName: "div",
    render,
    ref,
    props: {
      role: "log",
      "aria-label": "Conversation",
      "aria-live": "polite",
      "aria-relevant": "additions text",
      ...props,
      "data-slot": "conversation",
      "data-at-bottom": String(context.isAtBottom),
      className: cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface text-foreground",
        className,
      ),
      children: typeof children === "function" ? children(context) : children,
    },
  });
  return <ConversationContext value={context}>{element}</ConversationContext>;
}

export type ConversationContentProps = Omit<useRender.ComponentProps<"div">, "children"> & {
  children?: ReactNode | ((context: ConversationHandle) => ReactNode);
  /** Classes on the scrolling viewport; className styles the inner message column. */
  scrollClassName?: string;
  scrollRef?: Ref<HTMLDivElement>;
};

export function ConversationContent({
  ref,
  render,
  scrollRef,
  scrollClassName,
  className,
  children,
  onScroll,
  onKeyDown,
  ...props
}: ConversationContentProps) {
  const context = useConversation();
  const content = useRender({
    defaultTagName: "div",
    ref: ref ? [context.contentRef, ref] : context.contentRef,
    props: {
      ...props,
      "data-slot": "conversation-content",
      "data-at-bottom": String(context.isAtBottom),
      className: cn(
        "mx-auto flex min-h-full w-full max-w-[44rem] flex-col gap-5 px-3 pt-4 pb-20 text-ai-prose sm:gap-6 sm:px-4 sm:pt-5",
        className,
      ),
      children: typeof children === "function" ? children(context) : children,
    },
  });
  const viewport = useRender({
    defaultTagName: "div",
    render,
    ref: scrollRef ? [context.scrollRef, scrollRef] : context.scrollRef,
    props: {
      "data-slot": "conversation-viewport",
      "data-at-bottom": String(context.isAtBottom),
      tabIndex: 0,
      "aria-label": "Conversation messages",
      className: cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pb-20 focus-visible:-outline-offset-2 focus-visible:outline-none focus-visible:shadow-kind-focus",
        scrollClassName,
      ),
      onScroll,
      onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        // Stop following before the browser scrolls. The stream can otherwise
        // resize between the key press and its scroll event and pull the reader back.
        if (
          !event.defaultPrevented &&
          event.target === event.currentTarget &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          (event.key === "ArrowUp" ||
            event.key === "PageUp" ||
            event.key === "Home" ||
            (event.key === " " && event.shiftKey)) &&
          event.currentTarget.scrollHeight > event.currentTarget.clientHeight
        )
          context.stopScroll();
      },
      children: content,
    },
  });
  return viewport;
}

export type ConversationEmptyStateProps = ComponentPropsWithRef<"div"> & {
  title?: string;
  description?: string;
  icon?: ReactNode;
};

export function ConversationEmptyState({
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  className,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <div
      {...props}
      data-slot="conversation-empty-state"
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-3 py-8 text-center sm:py-10",
        className,
      )}
    >
      {children ?? (
        <>
          {icon && (
            <div
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-xl bg-inset text-muted-foreground [&>svg]:size-5"
            >
              {icon}
            </div>
          )}
          <div className="max-w-sm space-y-1.5">
            <h3 className="text-ai-title font-medium">{title}</h3>
            {description && (
              <p className="text-ai-description text-muted-foreground">{description}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export type ConversationScrollButtonProps = useRender.ComponentProps<"button"> & {
  /** Keep the button available at the bottom for custom presentation. Default false. */
  alwaysVisible?: boolean;
};

export function ConversationScrollButton({
  ref,
  render,
  onClick,
  children,
  className,
  alwaysVisible = false,
  ...props
}: ConversationScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useConversation();
  return useRender({
    defaultTagName: "button",
    render: render ?? <Button variant="ghost" size="sm" />,
    ref,
    props: {
      type: "button",
      "aria-label": "Scroll to latest",
      ...props,
      hidden: props.hidden || (isAtBottom && !alwaysVisible),
      "data-slot": "conversation-scroll-button",
      "data-at-bottom": String(isAtBottom),
      className: cn(
        actionClass,
        "absolute bottom-4 left-1/2 -translate-x-1/2 gap-1.5 border border-transparent bg-elevated px-3.5 text-ai-label font-medium text-muted-foreground shadow-[0_2px_8px_rgb(0_0_0/0.06)] hover:text-foreground",
        className,
      ),
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !event.currentTarget.disabled)
          void scrollToBottom(event.detail === 0 ? "instant" : undefined);
      },
      children: children ?? (
        <>
          <ArrowDown aria-hidden="true" className="size-4" strokeWidth={1.5} nonScalingStroke />
          <span>Latest</span>
        </>
      ),
    },
  });
}

/** Deliberately small neutral export shape; adapt SDK parts at the host boundary. */
export interface ConversationMessage {
  role: string;
  content: string;
}

export function messagesToMarkdown<T extends ConversationMessage>(
  messages: readonly T[],
  formatMessage: (message: T, index: number) => string = (message) =>
    `**${message.role.charAt(0).toUpperCase() + message.role.slice(1)}:** ${message.content}`,
): string {
  return messages.map(formatMessage).join("\n\n");
}

export type ConversationDownloadProps<T extends ConversationMessage = ConversationMessage> =
  useRender.ComponentProps<"button"> & {
    messages: readonly T[];
    filename?: string;
    formatMessage?: (message: T, index: number) => string;
    /** Receives local serialization or browser download failures. */
    onDownloadError?: (error: unknown) => void;
  };

export function ConversationDownload<T extends ConversationMessage>({
  ref,
  render,
  messages,
  filename = "conversation.md",
  formatMessage,
  onDownloadError,
  onClick,
  children,
  className,
  ...props
}: ConversationDownloadProps<T>) {
  return useRender({
    defaultTagName: "button",
    render: render ?? <Button variant="ghost" size="sm" />,
    ref,
    props: {
      type: "button",
      "aria-label": "Download conversation",
      ...props,
      "data-slot": "conversation-download",
      className: cn(
        actionClass,
        "gap-1.5 border border-border/60 bg-elevated px-3.5 text-ai-label font-medium text-muted-foreground hover:text-foreground",
        className,
      ),
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        let url: string | undefined;
        let link: HTMLAnchorElement | undefined;
        try {
          const markdown = messagesToMarkdown(messages, formatMessage);
          url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
          link = document.createElement("a");
          link.href = url;
          link.download = filename;
          link.hidden = true;
          document.body.append(link);
          link.click();
        } catch (error) {
          if (onDownloadError) onDownloadError(error);
          else throw error;
        } finally {
          link?.remove();
          // Give browsers a task to begin consuming the object URL before releasing it.
          if (url) {
            const downloadUrl = url;
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
          }
        }
      },
      children: children ?? (
        <>
          <Download aria-hidden="true" className="size-4" strokeWidth={1.5} nonScalingStroke />
          <span>Download</span>
        </>
      ),
    },
  });
}
