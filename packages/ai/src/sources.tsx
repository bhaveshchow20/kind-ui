"use client";
import { useRender } from "@base-ui/react/use-render";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import type { ClassValue } from "clsx";
import { ChevronDown, Files } from "lucide-react";
import type { ComponentProps } from "react";
import { actionClass, cn, safeUrl } from "./utils.js";
export type SourcesProps = ComponentProps<typeof Collapsible>;
export function Sources({ className, ...props }: SourcesProps) {
  return (
    <Collapsible
      {...props}
      data-slot="sources"
      className={(s) =>
        cn(
          "flex min-w-0 flex-col gap-2",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & { count: number };
export function SourcesTrigger({ count, children, className, ...props }: SourcesTriggerProps) {
  return (
    <CollapsibleTrigger
      {...props}
      data-slot="sources-trigger"
      className={(s) =>
        cn(
          actionClass,
          "group/sources-trigger min-h-8 self-start gap-1.5 rounded-lg px-2.5 text-ai-label font-medium text-muted-foreground hover:bg-inset hover:text-foreground",
          typeof className === "function" ? className(s) : className,
        )
      }
    >
      {children ?? (
        <>
          <Files
            aria-hidden="true"
            className="size-3.5 shrink-0"
            strokeWidth={1.5}
            nonScalingStroke
          />
          <span className="tabular-nums">
            Used {count} {count === 1 ? "source" : "sources"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 shrink-0 opacity-65 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-kind-out group-data-[panel-open]/sources-trigger:rotate-180"
            strokeWidth={1.5}
            nonScalingStroke
          />
        </>
      )}
    </CollapsibleTrigger>
  );
}
export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;
export function SourcesContent({ className, ...props }: SourcesContentProps) {
  return (
    <CollapsibleContent
      {...props}
      data-slot="sources-content"
      className={(s) =>
        cn(
          "grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type SourceProps = useRender.ComponentProps<"a"> & {
  variant?: "default" | "plain" | null | undefined;
};
export function sourceVariants({
  variant = "default",
  className,
  class: extraClass,
}: {
  variant?: "default" | "plain" | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
} = {}) {
  return cn(
    "flex min-w-0 flex-col gap-1.5 rounded-xl p-3 text-foreground no-underline hover:bg-inset focus-visible:bg-inset focus-visible:outline-none focus-visible:shadow-kind-focus",
    variant === "default" && "border border-border/60 bg-surface",
    extraClass,
    className,
  );
}
/** Anchors are primary; authored non-link cards use render={<div/>}. */
export function Source({
  variant = "default",
  href,
  title,
  children,
  render,
  className,
  ...props
}: SourceProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: {
      target: "_blank",
      rel: "noopener noreferrer",
      ...props,
      href: safeUrl(href),
      title,
      "data-slot": "source",
      "data-variant": variant,
      className: sourceVariants({ variant, className }),
      children: children ?? <SourceTitle>{title ?? href}</SourceTitle>,
    },
  });
}
export type SourceNameProps = ComponentProps<"div">;
export function SourceName({ className, ...props }: SourceNameProps) {
  return (
    <div
      {...props}
      data-slot="source-name"
      className={cn(
        "inline-flex min-w-0 flex-wrap items-center gap-1.5 text-ai-meta text-muted-foreground [&>img]:size-4 [&>img]:shrink-0 [&>img]:rounded-sm [&>img]:object-contain [&>svg]:size-3.5 [&>svg]:shrink-0",
        className,
      )}
    />
  );
}
export type SourceTitleProps = ComponentProps<"div">;
export function SourceTitle({ className, ...props }: SourceTitleProps) {
  return (
    <div
      {...props}
      data-slot="source-title"
      className={cn("break-words text-ai-label font-medium", className)}
    />
  );
}
export type SourceDescriptionProps = ComponentProps<"div">;
export function SourceDescription({ className, ...props }: SourceDescriptionProps) {
  return (
    <div
      {...props}
      data-slot="source-description"
      className={cn("break-words text-ai-description text-muted-foreground", className)}
    />
  );
}
