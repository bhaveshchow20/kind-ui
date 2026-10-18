"use client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import { ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { actionClass, cn } from "./utils.js";
export type ActionProps = ComponentProps<typeof Collapsible>;
export function Action({ className, ...props }: ActionProps) {
  return (
    <Collapsible
      {...props}
      data-slot="action"
      className={(state) =>
        cn(
          "group/action flex min-w-0 flex-col gap-1 text-ai-label",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type ActionTriggerProps = ComponentProps<typeof CollapsibleTrigger>;
export function ActionTrigger({ className, children, ...props }: ActionTriggerProps) {
  return (
    <CollapsibleTrigger
      {...props}
      data-slot="action-trigger"
      className={(state) =>
        cn(
          actionClass,
          "min-h-7 max-w-full self-start justify-start gap-1 rounded-lg px-2 py-1 coarse:min-h-11 text-start text-ai-label text-muted-foreground hover:bg-inset/60 hover:text-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {children}
      <ChevronRight
        aria-hidden="true"
        nonScalingStroke
        strokeWidth={1.5}
        size={14}
        className="size-3.5 shrink-0 text-muted-foreground/70 group-data-open/action:rotate-90"
      />
    </CollapsibleTrigger>
  );
}
export type ActionIconProps = ComponentProps<"span">;
export function ActionIcon({ children, className, ...props }: ActionIconProps) {
  return (
    <span
      aria-hidden="true"
      {...props}
      data-slot="action-icon"
      className={cn(
        "inline-flex size-3.5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-3.5",
        className,
      )}
    >
      {children ?? <span className="size-1.5 rounded-full bg-current" />}
    </span>
  );
}
export type ActionLabelProps = ComponentProps<"span">;
export function ActionLabel({ className, ...props }: ActionLabelProps) {
  return (
    <span
      {...props}
      data-slot="action-label"
      className={cn(
        "min-w-0 break-words [overflow-wrap:anywhere] text-ai-label font-medium text-foreground",
        className,
      )}
    />
  );
}
export type ActionContentProps = ComponentProps<typeof CollapsibleContent>;
export function ActionContent({ className, ...props }: ActionContentProps) {
  return (
    <CollapsibleContent
      {...props}
      data-slot="action-content"
      className={(state) =>
        cn(
          "ms-2.5 min-w-0 break-words [overflow-wrap:anywhere] border-s border-transparent ps-3.5 pe-2 pt-1 pb-2 text-ai-body text-muted-foreground [&>p+p]:mt-2 [&_code]:rounded-md [&_code]:bg-inset [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-ai-description [&_small]:text-ai-description [&_small]:tabular-nums",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
