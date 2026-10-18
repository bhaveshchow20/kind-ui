"use client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import { ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { actionClass, cn, surfaceClass } from "./utils.js";
export type AgentRunState = "running" | "completed" | "failed" | "stopped";
export type AgentRunProps = ComponentProps<typeof Collapsible> & {
  state?: AgentRunState | undefined;
};
export function AgentRun({ state, className, ...props }: AgentRunProps) {
  return (
    <Collapsible
      {...props}
      data-slot="agent-run"
      data-state={state}
      aria-busy={state === "running" || undefined}
      className={(s) =>
        cn(
          surfaceClass,
          "group/agent-run flex min-w-0 flex-col",
          state === "failed" && "bg-destructive/5",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type AgentRunHeaderProps = ComponentProps<typeof CollapsibleTrigger>;
export function AgentRunHeader({ className, children, ...props }: AgentRunHeaderProps) {
  return (
    <CollapsibleTrigger
      {...props}
      data-slot="agent-run-header"
      className={(s) =>
        cn(
          actionClass,
          "min-h-8 w-full flex-wrap justify-start gap-x-2 gap-y-1 rounded-2xl px-3 py-1.5 sm:min-h-9 coarse:min-h-11 text-start text-ai-label hover:bg-inset/60",
          typeof className === "function" ? className(s) : className,
        )
      }
    >
      <ChevronRight
        aria-hidden="true"
        strokeWidth={1.5}
        nonScalingStroke
        className="size-3.5 shrink-0 text-muted-foreground group-data-[state=failed]/agent-run:text-danger-text group-data-open/agent-run:rotate-90"
      />
      {children}
    </CollapsibleTrigger>
  );
}
export type AgentRunTitleProps = ComponentProps<"span">;
export function AgentRunTitle({ className, ...props }: AgentRunTitleProps) {
  return (
    <span
      {...props}
      data-slot="agent-run-title"
      className={cn(
        "min-w-0 flex-1 break-words [overflow-wrap:anywhere] text-ai-title font-medium group-data-[state=failed]/agent-run:text-danger-text group-data-[state=stopped]/agent-run:text-muted-foreground",
        className,
      )}
    />
  );
}
export type AgentRunMetaProps = ComponentProps<"span">;
export function AgentRunMeta({ className, ...props }: AgentRunMetaProps) {
  return (
    <span
      {...props}
      data-slot="agent-run-meta"
      className={cn(
        "ms-auto inline-flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 text-ai-meta font-normal tabular-nums text-muted-foreground [&_code]:rounded-md [&_code]:bg-inset [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-ai-meta",
        className,
      )}
    />
  );
}
export type AgentRunContentProps = ComponentProps<typeof CollapsibleContent>;
export function AgentRunContent({ className, ...props }: AgentRunContentProps) {
  return (
    <CollapsibleContent
      {...props}
      data-slot="agent-run-content"
      className={(s) =>
        cn(
          "flex min-w-0 flex-col px-3 pb-3 pt-1",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type AgentRunStepProps = ComponentProps<"div">;
export function AgentRunStep({ className, ...props }: AgentRunStepProps) {
  return (
    <div
      {...props}
      data-slot="agent-run-step"
      className={cn(
        "relative ms-2 flex min-w-0 flex-col gap-1 border-s border-border/40 ps-4 pb-2 text-ai-label last:border-transparent last:pb-0 before:absolute before:top-[0.55em] before:-start-[0.21875rem] before:size-1.5 before:rounded-full before:bg-muted-foreground/50 before:ring-4 before:ring-surface",
        className,
      )}
    />
  );
}
export type AgentRunTextProps = ComponentProps<"div">;
export function AgentRunText({ className, ...props }: AgentRunTextProps) {
  return (
    <div
      {...props}
      data-slot="agent-run-text"
      className={cn(
        "min-w-0 break-words [overflow-wrap:anywhere] text-ai-body text-muted-foreground [&_code]:rounded-md [&_code]:bg-inset [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-ai-description",
        className,
      )}
    />
  );
}
