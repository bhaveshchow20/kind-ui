"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ClassValue } from "clsx";
import { cn } from "./utils.js";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";
export type BadgeSize = "sm" | "md" | "lg";
export type BadgeProps = useRender.ComponentProps<"span"> & {
  tone?: BadgeTone | null | undefined;
  size?: BadgeSize | null | undefined;
};

export function badgeVariants({
  tone = "neutral",
  size = "md",
  className,
  class: extraClass,
}: {
  tone?: BadgeTone | null | undefined;
  size?: BadgeSize | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
} = {}) {
  return cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-inset/50 px-2.5 py-1 text-[0.75rem] leading-[1.5] font-medium text-muted-foreground tabular-nums",
    tone === "info" && "border-link/20 bg-link/8 text-link",
    tone === "success" && "border-success/25 bg-success/8 text-success",
    tone === "warning" && "border-warning/25 bg-warning/8 text-warning",
    tone === "danger" && "border-destructive/25 bg-destructive/5 text-danger-text",
    size === "sm" && "gap-1 px-2 py-0.5 text-[0.6875rem] leading-[1.45]",
    size === "lg" && "gap-1.5 px-3 py-1.5 text-[0.8125rem] leading-[1.4]",
    extraClass,
    className,
  );
}

export function Badge({ tone = "neutral", size = "md", className, render, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: "span",
    render,
    props: {
      "data-slot": "badge",
      "data-tone": tone,
      "data-size": size,
      ...props,
      className: badgeVariants({ tone, size, className }),
    },
  });
}
