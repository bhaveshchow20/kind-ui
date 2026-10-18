"use client";

import type { ComponentProps } from "react";
import { ThinkingDots } from "./thinking-dots.js";

export type TypingIndicatorProps = Omit<ComponentProps<"div">, "children">;

export function TypingIndicator(props: TypingIndicatorProps) {
  return (
    <div role="status" aria-label="Assistant is typing" {...props} data-slot="typing-indicator">
      <ThinkingDots />
    </div>
  );
}
