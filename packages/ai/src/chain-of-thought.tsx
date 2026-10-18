"use client";
import { Badge } from "@kind-ui/primitives/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import { ChevronRight } from "lucide-react";
import type { ComponentProps, ComponentType, ReactNode, SVGProps } from "react";
import { actionClass, cn } from "./utils.js";
export type ChainOfThoughtProps = ComponentProps<typeof Collapsible>;
export function ChainOfThought({ className, ...props }: ChainOfThoughtProps) {
  return (
    <Collapsible
      {...props}
      data-slot="chain-of-thought"
      className={(s) =>
        cn(
          "group/chain flex w-full min-w-0 flex-col text-ai-label",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type ChainOfThoughtHeaderProps = ComponentProps<typeof CollapsibleTrigger>;
export function ChainOfThoughtHeader({ children, className, ...props }: ChainOfThoughtHeaderProps) {
  return (
    <CollapsibleTrigger
      {...props}
      data-slot="chain-of-thought-header"
      className={(s) =>
        cn(
          actionClass,
          "min-h-7 max-w-full justify-start gap-1.5 rounded-md px-1.5 py-1 coarse:min-h-11 text-start text-ai-label font-medium text-muted-foreground hover:bg-inset hover:text-foreground",
          typeof className === "function" ? className(s) : className,
        )
      }
    >
      {children ?? "Chain of Thought"}
      <ChevronRight
        aria-hidden="true"
        focusable="false"
        size={14}
        strokeWidth={1.5}
        nonScalingStroke
        className="ms-0.5 size-3.5 shrink-0 text-muted-foreground/70 group-data-open/chain:rotate-90"
      />
    </CollapsibleTrigger>
  );
}
export type ChainOfThoughtContentProps = ComponentProps<typeof CollapsibleContent>;
export function ChainOfThoughtContent({ className, ...props }: ChainOfThoughtContentProps) {
  return (
    <CollapsibleContent
      {...props}
      data-slot="chain-of-thought-content"
      className={(s) =>
        cn(
          "relative ms-1.5 flex min-w-0 flex-col gap-2 py-1 before:pointer-events-none before:absolute before:inset-y-3 before:start-2 before:w-px before:bg-border/60",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type ChainOfThoughtStepProps = ComponentProps<typeof Collapsible> & {
  icon?: ComponentType<SVGProps<SVGSVGElement>> | undefined;
  label?: ReactNode;
  description?: ReactNode;
  status?: "complete" | "active" | "pending" | undefined;
};
export function ChainOfThoughtStep({
  icon: Icon,
  label,
  description,
  status = "complete",
  children,
  className,
  ...props
}: ChainOfThoughtStepProps) {
  return (
    <Collapsible
      {...props}
      data-slot="chain-of-thought-step"
      data-status={status}
      className={(s) =>
        cn(
          "group/step relative flex min-w-0 flex-col gap-1.5",
          status === "active" ? "text-foreground" : "text-muted-foreground",
          typeof className === "function" ? className(s) : className,
        )
      }
    >
      {label !== undefined && (
        <div className="relative flex min-w-0 items-start gap-2">
          {Icon ? (
            <Icon aria-hidden="true" className="relative mt-px size-4 shrink-0" />
          ) : (
            <ChainOfThoughtIcon />
          )}
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "break-words text-start text-ai-label",
                status === "active" && "font-medium",
              )}
            >
              {label}
            </div>
            {description != null && (
              <div className="mt-0.5 max-w-[68ch] break-words text-start text-ai-description text-muted-foreground">
                {description}
              </div>
            )}
          </div>
        </div>
      )}
      {children}
    </Collapsible>
  );
}
export type ChainOfThoughtStepStaticProps = ComponentProps<"div">;
export function ChainOfThoughtStepStatic({ className, ...props }: ChainOfThoughtStepStaticProps) {
  return (
    <div
      {...props}
      data-slot="chain-of-thought-step-static"
      className={cn(
        "relative flex min-w-0 items-start gap-2 py-1 text-ai-body text-muted-foreground",
        className,
      )}
    />
  );
}
export type ChainOfThoughtStepTriggerProps = ComponentProps<typeof CollapsibleTrigger>;
export function ChainOfThoughtStepTrigger({
  className,
  children,
  ...props
}: ChainOfThoughtStepTriggerProps) {
  return (
    <CollapsibleTrigger
      {...props}
      data-slot="chain-of-thought-step-trigger"
      className={(s) =>
        cn(
          actionClass,
          "min-h-7 max-w-full self-start gap-1.5 rounded-md px-1.5 py-1 coarse:min-h-11 text-start text-ai-label font-medium text-muted-foreground hover:bg-inset hover:text-foreground",
          typeof className === "function" ? className(s) : className,
        )
      }
    >
      {children}
      <ChevronRight
        aria-hidden="true"
        focusable="false"
        size={14}
        strokeWidth={1.5}
        nonScalingStroke
        className="ms-0.5 size-3.5 shrink-0 text-muted-foreground/70 group-data-open/step:rotate-90"
      />
    </CollapsibleTrigger>
  );
}
export type ChainOfThoughtStepContentProps = ComponentProps<typeof CollapsibleContent>;
export function ChainOfThoughtStepContent({ className, ...props }: ChainOfThoughtStepContentProps) {
  return (
    <CollapsibleContent
      {...props}
      data-slot="chain-of-thought-step-content"
      className={(s) =>
        cn(
          "ms-6 min-w-0 max-w-[72ch] break-words py-1 text-ai-body text-muted-foreground",
          typeof className === "function" ? className(s) : className,
        )
      }
    />
  );
}
export type ChainOfThoughtIconProps = ComponentProps<"span">;
export function ChainOfThoughtIcon({ children, className, ...props }: ChainOfThoughtIconProps) {
  return (
    <span
      aria-hidden="true"
      {...props}
      data-slot="chain-of-thought-icon"
      className={cn(
        "relative mt-px inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground group-data-[status=active]/step:text-foreground [&>svg]:size-4",
        className,
      )}
    >
      {children ?? (
        <span className="size-1.5 rounded-full bg-current group-data-[status=pending]/step:border group-data-[status=pending]/step:border-muted-foreground/60 group-data-[status=pending]/step:bg-surface" />
      )}
    </span>
  );
}
export type ChainOfThoughtSearchResultsProps = ComponentProps<"div">;
export function ChainOfThoughtSearchResults({
  className,
  ...props
}: ChainOfThoughtSearchResultsProps) {
  return (
    <div
      {...props}
      data-slot="chain-of-thought-search-results"
      className={cn("ms-6 flex min-w-0 flex-wrap gap-1.5", className)}
    />
  );
}
export type ChainOfThoughtSearchResultProps = ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "outline" | undefined;
};
export function ChainOfThoughtSearchResult({
  variant = "secondary",
  className,
  ...props
}: ChainOfThoughtSearchResultProps) {
  return (
    <Badge
      tone={variant === "default" ? "info" : "neutral"}
      {...props}
      data-slot="chain-of-thought-search-result"
      data-variant={variant}
      className={cn(
        "inline-flex max-w-full items-center gap-1 break-words rounded-md border px-1.5 py-0.5 text-start text-ai-description font-[inherit] normal-nums [&_svg]:size-3.5 [&_svg]:shrink-0",
        variant === "default"
          ? "border-transparent bg-primary/10 text-link"
          : variant === "outline"
            ? "border-border/60 bg-transparent text-muted-foreground"
            : "border-transparent bg-inset text-muted-foreground",
        className,
      )}
    />
  );
}
export type ChainOfThoughtImageProps = ComponentProps<"div"> & { caption?: string | undefined };
export function ChainOfThoughtImage({
  caption,
  children,
  className,
  ...props
}: ChainOfThoughtImageProps) {
  return (
    <div
      {...props}
      data-slot="chain-of-thought-image"
      className={cn("ms-6 flex min-w-0 max-w-xl flex-col gap-1.5", className)}
    >
      <div className="flex max-h-88 min-w-0 items-center justify-center overflow-hidden rounded-lg [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:object-contain">
        {children}
      </div>
      {caption && (
        <p className="max-w-[68ch] text-start text-ai-description text-muted-foreground">
          {caption}
        </p>
      )}
    </div>
  );
}
