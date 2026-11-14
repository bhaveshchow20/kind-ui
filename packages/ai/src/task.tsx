"use client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import { ChevronDown, Search } from "lucide-react";
import type { ComponentProps } from "react";
import { actionClass, cn } from "./utils.js";
export type TaskProps = ComponentProps<typeof Collapsible>;
export function Task({ defaultOpen = true, className, ...props }: TaskProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      {...props}
      data-slot="task"
      className={(s) =>
        cn(
          "group/task flex min-w-0 flex-col gap-1 text-ai-label",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & { title: string };
export function TaskTrigger({ title, children, className, ...props }: TaskTriggerProps) {
  return (
    <CollapsibleTrigger
      {...props}
      data-slot="task-trigger"
      className={(s) =>
        cn(
          actionClass,
          "min-h-8 max-w-full justify-start gap-1.5 rounded-md px-1.5 py-1 coarse:min-h-11 text-start text-ai-label font-medium text-muted-foreground hover:bg-inset hover:text-foreground",
          typeof className === "function" ? className(s) : className,
        )
      }
    >
      {children ?? (
        <>
          <span
            aria-hidden="true"
            className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground"
          >
            <Search
              aria-hidden="true"
              focusable="false"
              size={14}
              strokeWidth={1.5}
              nonScalingStroke
            />
          </span>
          <span className="min-w-0 break-words [overflow-wrap:anywhere] text-start">{title}</span>
          <ChevronDown
            aria-hidden="true"
            focusable="false"
            size={14}
            strokeWidth={1.5}
            nonScalingStroke
            className="ms-0.5 size-3.5 shrink-0 text-muted-foreground/70 group-data-open/task:rotate-180"
          />
        </>
      )}
    </CollapsibleTrigger>
  );
}
export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;
export function TaskContent({ className, ...props }: TaskContentProps) {
  return (
    <CollapsibleContent
      {...props}
      data-slot="task-content"
      className={(s) =>
        cn(
          "flex min-w-0 max-w-[72ch] flex-col gap-2 pb-2 pe-1.5 ps-7 pt-1 text-ai-body",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type TaskItemProps = ComponentProps<"div">;
export function TaskItem({ className, ...props }: TaskItemProps) {
  return (
    <div
      {...props}
      data-slot="task-item"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 break-words text-start text-ai-body text-muted-foreground",
        className,
      )}
    />
  );
}
export type TaskItemFileProps = ComponentProps<"div">;
export function TaskItemFile({ className, ...props }: TaskItemFileProps) {
  return (
    <div
      {...props}
      data-slot="task-item-file"
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1 break-words [overflow-wrap:anywhere] rounded-md bg-inset px-1.5 py-0.5 text-start text-ai-meta text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0",
        className,
      )}
    />
  );
}
export type TaskIconProps = ComponentProps<"span">;
export function TaskIcon({ children, className, ...props }: TaskIconProps) {
  return (
    <span
      aria-hidden="true"
      {...props}
      data-slot="task-icon"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-3.5",
        className,
      )}
    >
      {children ?? <span className="size-1.5 rounded-full bg-current" />}
    </span>
  );
}
export type TaskLabelProps = ComponentProps<"span">;
export function TaskLabel({ className, ...props }: TaskLabelProps) {
  return (
    <span
      {...props}
      data-slot="task-label"
      className={cn(
        "min-w-0 break-words [overflow-wrap:anywhere] text-start text-ai-label font-medium text-foreground",
        className,
      )}
    />
  );
}
