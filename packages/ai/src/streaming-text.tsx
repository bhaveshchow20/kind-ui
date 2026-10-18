"use client";

import type { ComponentProps } from "react";
import { cn } from "./utils.js";

export type StreamingTextState = "streaming" | "complete" | "interrupted";

export type StreamingTextProps = Omit<ComponentProps<"p">, "children"> & {
  children: string;
  state?: StreamingTextState | undefined;
  caret?: boolean | undefined;
  animated?: boolean | undefined;
};

export function StreamingText({
  children,
  state = "complete",
  caret = true,
  animated = false,
  className,
  ...props
}: StreamingTextProps) {
  return (
    <p
      aria-busy={state === "streaming"}
      {...props}
      data-slot="streaming-text"
      data-state={state}
      className={cn("m-0 whitespace-pre-wrap break-words", className)}
    >
      {children}
      {state === "streaming" && caret && children.trim().length > 0 && (
        <span
          aria-hidden="true"
          data-slot="streaming-text-caret"
          className={cn(
            "ms-[0.125em] inline-block h-[1em] border-s border-current align-[-0.125em]",
            animated && "motion-safe:animate-pulse",
          )}
        />
      )}
    </p>
  );
}
