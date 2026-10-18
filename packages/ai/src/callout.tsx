"use client";
import { useRender } from "@base-ui/react/use-render";
import type { ClassValue } from "clsx";
import { Info } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./utils.js";
export type CalloutProps = useRender.ComponentProps<"div"> & {
  tone?: "info" | "warning" | "danger" | null | undefined;
};
export function Callout({ tone = "info", className, render, ...props }: CalloutProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: {
      role: tone === "danger" ? "alert" : "note",
      ...props,
      "data-slot": "callout",
      "data-tone": tone,
      className: calloutVariants({ tone, className }),
    },
  });
}
export function CalloutIcon({ children, className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      {...props}
      data-slot="callout-icon"
      className={cn(
        "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground group-data-[tone=warning]/callout:text-warning group-data-[tone=danger]/callout:text-danger-text [&_svg]:size-4",
        className,
      )}
    >
      {children === undefined ? <Info size={16} strokeWidth={1.5} nonScalingStroke /> : children}
    </span>
  );
}
export function CalloutContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="callout-content"
      className={cn(
        "min-w-0 flex-1 text-start text-ai-body break-words text-pretty text-foreground/85 [&_p+p]:mt-2 [&_strong]:font-medium [&_strong]:text-foreground [&_h3]:text-ai-title [&_h3]:font-medium [&_h3]:text-foreground [&_h4]:text-ai-title [&_h4]:font-medium [&_h4]:text-foreground [&_code]:rounded-md [&_code]:bg-inset [&_code]:px-1.25 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-ai-description [&_a]:text-link [&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
    />
  );
}
export function calloutVariants({
  tone = "info",
  className,
  class: extraClass,
}: {
  tone?: "info" | "warning" | "danger" | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
} = {}) {
  return cn(
    "kind-surface group/callout flex min-w-0 items-start gap-2 rounded-xl bg-surface p-3 text-ai-body text-foreground",
    tone === "warning" && "border-warning/25 bg-warning/5",
    tone === "danger" && "border-destructive/25 bg-destructive/5",
    extraClass,
    className,
  );
}
