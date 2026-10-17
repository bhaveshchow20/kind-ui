"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ClassValue } from "clsx";
import { type BadgeSize, type BadgeTone, badgeVariants } from "./badge.js";
import { cn } from "./utils.js";

export type StatusState = "neutral" | "pending" | "inflight" | "warning" | "active" | "error";
export type StatusSize = BadgeSize;
export type StatusProps = useRender.ComponentProps<"span"> & {
  state: StatusState;
  size?: StatusSize | null | undefined;
  pulse?: boolean | undefined;
};

const tones: Record<StatusState, BadgeTone> = {
  neutral: "neutral",
  pending: "neutral",
  inflight: "info",
  warning: "warning",
  active: "success",
  error: "danger",
};

export function statusVariants({
  state = "neutral",
  size = "md",
  className,
  class: extraClass,
}: {
  state?: StatusState | null | undefined;
  size?: StatusSize | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
} = {}) {
  return badgeVariants({
    tone: state === null ? null : tones[state],
    size,
    className: cn(
      state === "pending" &&
        "border-dashed border-border/60 bg-surface [&>span:first-child]:bg-transparent",
      extraClass,
      className,
    ),
  });
}

export function Status({
  state,
  size = "md",
  pulse = false,
  className,
  render,
  children,
  ...props
}: StatusProps) {
  return useRender({
    defaultTagName: "span",
    render,
    props: {
      "data-slot": "status",
      ...props,
      "data-state": state,
      "data-size": size,
      className: statusVariants({ state, size, className }),
      children: (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 shrink-0 rounded-full border border-current bg-current",
              pulse && "motion-safe:animate-pulse",
            )}
          />
          {children ?? state}
        </>
      ),
    },
  });
}
