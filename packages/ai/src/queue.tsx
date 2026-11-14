"use client";
import { Button } from "@kind-ui/primitives/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import { Check, ChevronRight, FileText } from "lucide-react";
import { type ComponentProps, createContext, type ReactNode, useContext } from "react";
import { actionClass, cn, safeUrl, surfaceClass } from "./utils.js";
export interface QueueMessagePart {
  type: string;
  text?: string;
  url?: string;
  filename?: string;
  mediaType?: string;
}
export interface QueueMessage {
  id: string;
  parts: QueueMessagePart[];
}
export interface QueueTodo {
  id: string;
  title: string;
  description?: string;
  status?: "pending" | "completed";
}
export type QueueProps = ComponentProps<"div">;
export function Queue({ className, ...props }: QueueProps) {
  return (
    <div
      {...props}
      data-slot="queue"
      className={cn(surfaceClass, "flex min-w-0 flex-col gap-2 p-2", className)}
    />
  );
}
export type QueueItemProps = ComponentProps<"li">;
export function QueueItem({ className, ...props }: QueueItemProps) {
  return (
    <li
      {...props}
      data-slot="queue-item"
      className={cn(
        "group/queue-item flex min-h-8 min-w-0 shrink-0 flex-col gap-1 rounded-lg px-2 py-2 text-ai-label hover:bg-secondary/40",
        className,
      )}
    />
  );
}
export type QueueItemActionsProps = ComponentProps<"div">;
export function QueueItemActions({ className, ...props }: QueueItemActionsProps) {
  return (
    <div
      {...props}
      data-slot="queue-item-actions"
      className={cn("ms-auto flex max-w-full shrink-0 flex-wrap items-center gap-0.5", className)}
    />
  );
}
export type QueueItemAttachmentProps = ComponentProps<"div">;
export function QueueItemAttachment({ className, ...props }: QueueItemAttachmentProps) {
  return (
    <div
      {...props}
      data-slot="queue-item-attachment"
      className={cn("ms-6 flex min-w-0 flex-wrap items-center gap-1.5 pt-1 pb-1.5", className)}
    />
  );
}
export type QueueItemFileProps = ComponentProps<"span">;
export function QueueItemFile({ className, children, ...props }: QueueItemFileProps) {
  return (
    <span
      {...props}
      data-slot="queue-item-file"
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md border border-border/40 bg-secondary/40 px-1.5 py-0.5 text-ai-description text-muted-foreground [overflow-wrap:anywhere]",
        className,
      )}
    >
      <FileText
        aria-hidden="true"
        focusable="false"
        nonScalingStroke
        strokeWidth={1.5}
        className="size-3.5 shrink-0"
      />
      <span className="min-w-0">{children}</span>
    </span>
  );
}
export type QueueListProps = ComponentProps<"ul">;
export function QueueList({ className, ...props }: QueueListProps) {
  return (
    <ul
      {...props}
      data-slot="queue-list"
      className={cn(
        "flex max-h-64 min-w-0 flex-col gap-1 overflow-y-auto overscroll-contain pe-1 pb-1 [scrollbar-width:thin]",
        className,
      )}
    />
  );
}
export type TodoHeaderProps = ComponentProps<"header">;
export function TodoHeader({ className, ...props }: TodoHeaderProps) {
  return (
    <header
      {...props}
      data-slot="todo-header"
      className={cn("flex min-h-9 items-center gap-2 px-3 py-1", className)}
    />
  );
}
export type TodoTitleProps = ComponentProps<"div">;
export function TodoTitle({ className, ...props }: TodoTitleProps) {
  return (
    <div
      {...props}
      data-slot="todo-title"
      className={cn("min-w-0 flex-1 text-ai-title font-medium [overflow-wrap:anywhere]", className)}
    />
  );
}
export type TodoListProps = ComponentProps<"ul">;
export function TodoList({ className, ...props }: TodoListProps) {
  return (
    <ul
      {...props}
      data-slot="todo-list"
      className={cn("flex min-w-0 flex-col gap-0.5 px-2 pb-2", className)}
    />
  );
}
export type QueueItemIndicatorProps = ComponentProps<"span"> & { completed?: boolean | undefined };
export function QueueItemIndicator({
  completed = false,
  className,
  children,
  ...props
}: QueueItemIndicatorProps) {
  return (
    <span
      role="img"
      aria-label={completed ? "Completed" : "Pending"}
      {...props}
      data-slot="queue-item-indicator"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border/65 text-muted-foreground",
        completed && "border-success/40 bg-success/10 text-success",
        className,
      )}
    >
      {children === undefined && completed ? (
        <Check
          aria-hidden="true"
          focusable="false"
          nonScalingStroke
          strokeWidth={1.5}
          className="size-3.5"
        />
      ) : (
        children
      )}
    </span>
  );
}
export type QueueItemContentProps = ComponentProps<"span"> & { completed?: boolean | undefined };
export function QueueItemContent({
  completed = false,
  className,
  ...props
}: QueueItemContentProps) {
  return (
    <span
      {...props}
      data-slot="queue-item-content"
      className={cn(
        "min-w-0 flex-1 break-words text-ai-label [overflow-wrap:anywhere]",
        completed && "text-muted-foreground line-through decoration-muted-foreground/40",
        className,
      )}
    />
  );
}
export type QueueItemDescriptionProps = ComponentProps<"div"> & { completed?: boolean | undefined };
export function QueueItemDescription({
  completed = false,
  className,
  ...props
}: QueueItemDescriptionProps) {
  return (
    <div
      {...props}
      data-slot="queue-item-description"
      className={cn(
        "ms-6 text-ai-description text-muted-foreground [overflow-wrap:anywhere]",
        completed && "line-through decoration-muted-foreground/40",
        className,
      )}
    />
  );
}
export type QueueItemActionProps = ComponentProps<"button">;
export function QueueItemAction({ className, ...props }: QueueItemActionProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      {...props}
      data-slot="queue-item-action"
      className={cn(
        actionClass,
        "min-h-7 min-w-7 rounded-md px-1.5 coarse:min-w-11 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        className,
      )}
    />
  );
}
export type QueueItemImageProps = ComponentProps<"img">;
export function QueueItemImage({ src, alt = "", className, ...props }: QueueItemImageProps) {
  return (
    <img
      width={32}
      height={32}
      loading="lazy"
      {...props}
      src={safeUrl(src)}
      alt={alt}
      data-slot="queue-item-image"
      className={cn(
        "size-7 shrink-0 rounded-md object-cover outline-1 -outline-offset-1 outline-foreground/10",
        className,
      )}
    />
  );
}
export type QueueSectionProps = ComponentProps<typeof Collapsible>;
export function QueueSection({ defaultOpen = true, className, ...props }: QueueSectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      {...props}
      data-slot="queue-section"
      className={(s) =>
        cn("group/queue-section", typeof className === "function" ? className(s) : className)
      }
    />
  );
}
export type QueueSectionTriggerProps = ComponentProps<typeof CollapsibleTrigger>;
export function QueueSectionTrigger({ className, ...props }: QueueSectionTriggerProps) {
  return (
    <CollapsibleTrigger
      {...props}
      data-slot="queue-section-trigger"
      className={(s) =>
        cn(
          actionClass,
          "min-h-8 w-full justify-between rounded-lg bg-transparent px-2 text-ai-label font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type QueueSectionLabelProps = ComponentProps<"span"> & {
  count?: number | undefined;
  label: string;
  icon?: ReactNode;
};
export function QueueSectionLabel({
  count,
  label,
  icon,
  className,
  ...props
}: QueueSectionLabelProps) {
  return (
    <span
      {...props}
      data-slot="queue-section-label"
      className={cn("inline-flex min-w-0 items-center gap-2", className)}
    >
      <ChevronRight
        aria-hidden="true"
        focusable="false"
        nonScalingStroke
        strokeWidth={1.5}
        className="size-3.5 shrink-0 group-data-open/queue-section:rotate-90 rtl:-scale-x-100"
      />
      {icon}
      <span className="min-w-0 break-words">
        {count !== undefined && (
          <span className="me-1.5 inline-flex min-w-4 items-center justify-center text-ai-meta font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        )}{" "}
        {label}
      </span>
    </span>
  );
}
export type QueueSectionContentProps = ComponentProps<typeof CollapsibleContent>;
export function QueueSectionContent(props: QueueSectionContentProps) {
  return <CollapsibleContent {...props} data-slot="queue-section-content" />;
}
export type TodoProps = ComponentProps<typeof Collapsible>;
export function Todo({ className, ...props }: TodoProps) {
  return (
    <Collapsible
      {...props}
      data-slot="todo"
      className={(s) =>
        cn(
          surfaceClass,
          "flex min-w-0 flex-col rounded-2xl",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type TodoTriggerProps = ComponentProps<typeof CollapsibleTrigger>;
export function TodoTrigger({ className, ...props }: TodoTriggerProps) {
  return (
    <CollapsibleTrigger
      aria-label="Toggle tasks"
      {...props}
      data-slot="todo-trigger"
      className={(s) =>
        cn(
          actionClass,
          "min-h-7 rounded-md px-2 text-ai-label text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type TodoContentProps = ComponentProps<typeof CollapsibleContent>;
export function TodoContent(props: TodoContentProps) {
  return <CollapsibleContent {...props} data-slot="todo-content" />;
}
export type TodoStatus = "pending" | "progress" | "completed";
const TodoItemContext = createContext<TodoStatus>("pending");
export type TodoItemProps = ComponentProps<"li"> & { status: TodoStatus };
export function TodoItem({ status, className, children, ...props }: TodoItemProps) {
  return (
    <TodoItemContext value={status}>
      <li
        {...props}
        data-slot="todo-item"
        data-status={status}
        className={cn(
          "flex min-h-8 min-w-0 items-start gap-2 rounded-lg px-2 py-1 text-ai-label",
          status === "progress" && "bg-secondary/60",
          className,
        )}
      >
        <span className="sr-only">{status}: </span>
        {children}
      </li>
    </TodoItemContext>
  );
}
export type TodoItemIconProps = ComponentProps<"span">;
export function TodoItemIcon({ children, className, ...props }: TodoItemIconProps) {
  const status = useContext(TodoItemContext);
  return (
    <span
      aria-hidden="true"
      {...props}
      data-slot="todo-item-icon"
      className={cn(
        "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border/65",
        status === "completed" && "border-success/40 bg-success/10 text-success",
        status === "progress" && "border-foreground/35 bg-secondary",
        className,
      )}
    >
      {children ??
        (status === "completed" ? (
          <Check
            aria-hidden="true"
            focusable="false"
            nonScalingStroke
            strokeWidth={1.5}
            className="size-3.5"
          />
        ) : status === "progress" ? (
          <span className="size-2 rounded-full bg-foreground/65 motion-safe:animate-pulse" />
        ) : null)}
    </span>
  );
}
export type TodoItemLabelProps = ComponentProps<"span">;
export function TodoItemLabel({ className, ...props }: TodoItemLabelProps) {
  const status = useContext(TodoItemContext);
  return (
    <span
      {...props}
      data-slot="todo-item-label"
      className={cn(
        "min-w-0 flex-1 text-ai-label [overflow-wrap:anywhere]",
        status === "progress" && "font-medium",
        status === "completed" &&
          "text-muted-foreground line-through decoration-muted-foreground/40",
        className,
      )}
    />
  );
}
