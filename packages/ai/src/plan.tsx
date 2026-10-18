"use client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import { ChevronsUpDown, FileText } from "lucide-react";
import { type ComponentProps, createContext, useContext } from "react";
import { Shimmer } from "./loader.js";
import { actionClass, cn, surfaceClass } from "./utils.js";

const PlanContext = createContext(false);
export type PlanProps = ComponentProps<typeof Collapsible> & { isStreaming?: boolean | undefined };
export function Plan({ isStreaming = false, className, ...props }: PlanProps) {
  return (
    <PlanContext value={isStreaming}>
      <Collapsible
        {...props}
        data-slot="plan"
        aria-busy={isStreaming || undefined}
        className={(s) =>
          cn(
            surfaceClass,
            "flex min-w-0 flex-col rounded-xl [&_[data-slot=plan-title]+[data-slot=plan-description]]:mt-1",
            typeof className === "function" ? className(s) : className,
          )
        }
      />
    </PlanContext>
  );
}
export type PlanHeaderProps = ComponentProps<"div">;
export function PlanHeader({ className, ...props }: PlanHeaderProps) {
  return (
    <div
      {...props}
      data-slot="plan-header"
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-3 gap-y-2 p-3 [&>div]:min-w-0 [&>div:not([data-slot=plan-action])]:flex-1",
        className,
      )}
    />
  );
}
export type PlanTitleProps = Omit<ComponentProps<"h3">, "children"> & { children: string };
export function PlanTitle({ children, className, ...props }: PlanTitleProps) {
  const streaming = useContext(PlanContext);
  return (
    <h3
      {...props}
      data-slot="plan-title"
      className={cn(
        "flex min-w-0 items-start gap-2 text-start text-ai-title font-medium text-foreground",
        className,
      )}
    >
      <FileText
        aria-hidden="true"
        nonScalingStroke
        strokeWidth={1.5}
        size={14}
        className="mt-0.5 shrink-0 text-muted-foreground"
      />
      <span className="min-w-0 break-words [overflow-wrap:anywhere] text-pretty">
        {streaming ? <Shimmer as="span">{children}</Shimmer> : children}
      </span>
    </h3>
  );
}
export type PlanDescriptionProps = Omit<ComponentProps<"p">, "children"> & { children: string };
export function PlanDescription({ children, className, ...props }: PlanDescriptionProps) {
  const streaming = useContext(PlanContext);
  return (
    <p
      {...props}
      data-slot="plan-description"
      className={cn(
        "max-w-[72ch] text-start text-ai-description break-words text-pretty text-muted-foreground",
        className,
      )}
    >
      {streaming ? <Shimmer as="span">{children}</Shimmer> : children}
    </p>
  );
}
export type PlanActionProps = ComponentProps<"div">;
export function PlanAction({ className, ...props }: PlanActionProps) {
  return (
    <div
      {...props}
      data-slot="plan-action"
      className={cn(
        "ms-auto flex max-w-full shrink-0 flex-wrap items-center gap-1.5 text-ai-label",
        className,
      )}
    />
  );
}
export type PlanContentProps = ComponentProps<typeof CollapsibleContent>;
export function PlanContent({ className, ...props }: PlanContentProps) {
  return (
    <CollapsibleContent
      {...props}
      data-slot="plan-content"
      className={(s) =>
        cn(
          "min-w-0 px-3 pb-3 text-ai-body text-foreground/90 [&>ol]:list-decimal [&>ol]:space-y-1.5 [&>ol]:ps-5 [&>ol>li]:ps-1.5 [&>ol>li]:break-words [&>ol>li::marker]:text-ai-description [&>ol>li::marker]:font-medium [&>ol>li::marker]:text-muted-foreground [&>ol>li::marker]:tabular-nums [&>ul]:list-disc [&>ul]:space-y-1.5 [&>ul]:ps-5 [&>ul>li]:ps-1 [&>p+p]:mt-3",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type PlanFooterProps = ComponentProps<"div">;
export function PlanFooter({ className, ...props }: PlanFooterProps) {
  return (
    <div
      {...props}
      data-slot="plan-footer"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 px-3 pb-3 text-ai-label text-muted-foreground",
        className,
      )}
    />
  );
}
export type PlanTriggerProps = ComponentProps<typeof CollapsibleTrigger>;
export function PlanTrigger({ className, children, ...props }: PlanTriggerProps) {
  return (
    <CollapsibleTrigger
      aria-label="Toggle plan"
      {...props}
      data-slot="plan-trigger"
      className={(s) =>
        cn(
          actionClass,
          "min-w-8 bg-transparent px-2 text-ai-label text-muted-foreground hover:text-foreground",
          typeof className === "function" ? className(s) : className,
        )
      }
    >
      {children ?? (
        <ChevronsUpDown aria-hidden="true" nonScalingStroke strokeWidth={1.5} size={14} />
      )}
    </CollapsibleTrigger>
  );
}
