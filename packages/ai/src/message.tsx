"use client";

import { Avatar } from "@kind-ui/primitives/avatar";
import { Button } from "@kind-ui/primitives/button";
import { Tooltip, TooltipProvider } from "@kind-ui/primitives/tooltip";
import type { ClassValue } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
} from "react";
import { Markdown } from "./markdown.js";
import { actionClass, cn, useControllable } from "./utils.js";

/** SDK-independent sender roles. Custom identities belong in native data attributes. */
export type MessageRole = "user" | "assistant" | "system" | "tool";
export type MessageStatus = "ready" | "streaming" | "interrupted" | "error";
export type MessageProps = ComponentProps<"div"> & {
  from: MessageRole;
  /** Host-owned lifecycle; ready does not imply a completed business action. */
  status?: MessageStatus;
};

/** Opt newly appended messages into entrance motion with className="kind-content-reveal". */
export function Message({ from, status = "ready", className, ...props }: MessageProps) {
  return (
    <div
      data-slot="message"
      data-from={from}
      data-state={status}
      aria-busy={status === "streaming" || undefined}
      className={cn(
        "group/message flex w-full min-w-0 items-start gap-2.5 text-foreground",
        from === "user" && "flex-row-reverse",
        className,
      )}
      {...props}
    />
  );
}

export type MessageAvatarProps = ComponentProps<"div">;
export function MessageAvatar({ className, children, ...props }: MessageAvatarProps) {
  return (
    <Avatar
      render={<div {...props} />}
      data-slot="message-avatar"
      className={cn(
        "static mt-0.5 flex size-7 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-secondary/50 font-[family-name:inherit] text-ai-meta font-medium text-muted-foreground [&>img]:size-full [&>img]:object-cover [&>svg]:size-4",
        className,
      )}
    >
      {children}
    </Avatar>
  );
}

export type MessageContentProps = ComponentProps<"div">;
export function MessageContent({ className, ...props }: MessageContentProps) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-2 text-ai-prose group-data-[from=user]/message:items-end [&>header]:flex [&>header]:min-h-5 [&>header]:flex-wrap [&>header]:items-baseline [&>header]:gap-x-2 [&>header]:gap-y-0.5 [&>header]:text-ai-description [&>header]:text-muted-foreground [&>header>:first-child]:text-ai-label [&>header>:first-child]:font-medium [&>header>:first-child]:text-foreground [&>header>time]:text-ai-meta [&>header>time]:tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

export type MessageTextVariantOptions = {
  variant?: "plain" | "bubble" | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
};
/** Shared text-slot classes, independently authored for Kind's visual language. */
export function messageTextVariants({
  variant = "plain",
  className,
  class: classes,
}: MessageTextVariantOptions = {}) {
  return cn(
    "min-w-0 max-w-[68ch] break-words text-ai-prose",
    variant === "bubble" &&
      "w-fit max-w-[min(100%,38rem)] rounded-[1.25rem] rounded-br-lg bg-inset px-4 py-2 text-foreground",
    classes,
    className,
  );
}
export type MessageTextProps = ComponentProps<"div"> & { variant?: "plain" | "bubble" | null };
/** Plain is the default; bubble styling is an explicit per-segment choice. */
export function MessageText({ variant = "plain", className, ...props }: MessageTextProps) {
  return (
    <div
      data-slot="message-text"
      data-variant={variant ?? "plain"}
      className={messageTextVariants({ variant, className })}
      {...props}
    />
  );
}

export type MessageActionsProps = ComponentProps<"div">;
export function MessageActions({ className, ...props }: MessageActionsProps) {
  return (
    <div
      data-slot="message-actions"
      className={cn(
        "flex flex-wrap items-center gap-1 text-muted-foreground [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export type MessageActionProps = ComponentProps<"button"> & {
  tooltip?: string;
  label?: string;
  variant?: "ghost" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
};
export function MessageAction({
  tooltip,
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  ...props
}: MessageActionProps) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      contentKey={label || tooltip}
      aria-label={label || tooltip}
      data-slot="message-action"
      data-size={size}
      className={cn(
        actionClass,
        "min-h-6 min-w-6 gap-1 rounded-md p-1 coarse:min-h-11 coarse:min-w-11 text-ai-label font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground aria-pressed:bg-secondary/70 aria-pressed:text-foreground [&_svg]:size-4 [&_svg]:shrink-0",
        size === "sm" && "text-ai-description [&_svg]:size-3.5",
        size === "lg" && "min-h-8 min-w-8 p-1.5",
        variant === "outline" && "border border-transparent",
        variant === "secondary" && "bg-secondary/60 text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
  if (!tooltip) return button;
  return (
    <TooltipProvider delay={400}>
      <Tooltip
        content={tooltip}
        sideOffset={6}
        contentProps={{
          className:
            "z-50 max-w-64 rounded-lg border border-transparent bg-elevated px-2.5 py-1.5 text-ai-description font-medium text-foreground shadow-kind-float ring-0",
        }}
      >
        {button}
      </Tooltip>
    </TooltipProvider>
  );
}

interface BranchContextValue {
  current: number;
  total: number;
  change: (next: number) => void;
}
const BranchContext = createContext<BranchContextValue | null>(null);
function useBranch() {
  const value = useContext(BranchContext);
  if (!value) throw new Error("Message branch parts require a MessageBranch parent.");
  return value;
}

// Derive the count during render: controls have correct SSR content and no effect lag.
function branchCount(children: ReactNode): number {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode }>(child)) continue;
    if (child.type === MessageBranchContent) return Children.toArray(child.props.children).length;
    const nested = branchCount(child.props.children);
    if (nested) return nested;
  }
  return 0;
}
const normalizeBranch = (value: number, total: number) =>
  total === 0
    ? 0
    : Math.min(total - 1, Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 0));
export type MessageBranchProps = ComponentProps<"div"> & {
  branch?: number;
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};
export function MessageBranch({
  branch,
  defaultBranch = 0,
  onBranchChange,
  className,
  children,
  ...props
}: MessageBranchProps) {
  const [value, setValue] = useControllable(branch, defaultBranch, onBranchChange);
  const total = branchCount(children);
  const current = normalizeBranch(value, total);
  return (
    <BranchContext.Provider
      value={{
        current,
        total,
        change: (next) => {
          const normalized = normalizeBranch(next, total);
          if (normalized !== current) setValue(normalized);
        },
      }}
    >
      <div data-slot="message-branch" className={cn("grid min-w-0 gap-2", className)} {...props}>
        {children}
      </div>
    </BranchContext.Provider>
  );
}

export type MessageBranchContentProps = ComponentProps<"div">;
export function MessageBranchContent({ children, className, ...props }: MessageBranchContentProps) {
  const { current } = useBranch();
  return (
    <div data-slot="message-branch-content" className={cn("min-w-0", className)} {...props}>
      {Children.toArray(children).map((child, index) => (
        <div
          key={isValidElement(child) ? (child.key ?? index) : index}
          hidden={index !== current}
          data-slot="message-branch-panel"
          data-state={index === current ? "active" : "inactive"}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

export type MessageBranchSelectorProps = ComponentProps<"fieldset"> & {
  orientation?: "horizontal" | "vertical";
};
export function MessageBranchSelector({
  className,
  orientation = "horizontal",
  ...props
}: MessageBranchSelectorProps) {
  const { total } = useBranch();
  if (total <= 1) return null;
  return (
    <fieldset
      aria-label="Response branches"
      data-slot="message-branch-selector"
      data-orientation={orientation}
      className={cn(
        "m-0 inline-flex w-fit min-w-0 items-center gap-0.5 border-0 p-0",
        orientation === "vertical" && "flex-col",
        className,
      )}
      {...props}
    />
  );
}

export type MessageBranchPreviousProps = MessageActionProps;
export function MessageBranchPrevious({
  onClick,
  disabled,
  children,
  ...props
}: MessageBranchPreviousProps) {
  const { current, total, change } = useBranch();
  return (
    <MessageAction
      label="Previous branch"
      {...props}
      disabled={disabled || total <= 1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && total > 1) change((current - 1 + total) % total);
      }}
    >
      {children ?? <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.5} nonScalingStroke />}
    </MessageAction>
  );
}
export type MessageBranchNextProps = MessageActionProps;
export function MessageBranchNext({
  onClick,
  disabled,
  children,
  ...props
}: MessageBranchNextProps) {
  const { current, total, change } = useBranch();
  return (
    <MessageAction
      label="Next branch"
      {...props}
      disabled={disabled || total <= 1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && total > 1) change((current + 1) % total);
      }}
    >
      {children ?? <ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} nonScalingStroke />}
    </MessageAction>
  );
}
export type MessageBranchPageProps = ComponentProps<"span">;
export function MessageBranchPage({ className, children, ...props }: MessageBranchPageProps) {
  const { current, total } = useBranch();
  return (
    <span
      data-slot="message-branch-page"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "min-w-10 whitespace-nowrap px-0.5 text-center text-ai-meta font-medium tabular-nums text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ?? `${total ? current + 1 : 0} of ${total}`}
    </span>
  );
}

export type MessageResponseProps = ComponentProps<typeof Markdown>;
/** Uses Kind's shared safe Markdown boundary rather than an SDK-specific renderer. */
export function MessageResponse({ className, ...props }: MessageResponseProps) {
  return (
    <Markdown
      className={cn(
        "min-w-0 max-w-[68ch] text-ai-prose [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      {...props}
    />
  );
}
export type MessageToolbarProps = ComponentProps<"div">;
export function MessageToolbar({ className, ...props }: MessageToolbarProps) {
  return (
    <div
      data-slot="message-toolbar"
      className={cn(
        "mt-1 flex w-full max-w-[68ch] flex-wrap items-center justify-start gap-x-2 gap-y-1.5",
        className,
      )}
      {...props}
    />
  );
}
