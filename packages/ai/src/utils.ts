"use client";
import { buttonVariants } from "@kind-ui/primitives/button";
import { cn } from "@kind-ui/primitives/utils";
import { useState } from "react";

export { cn } from "@kind-ui/primitives/utils";
export function useControllable<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: ((value: T) => void) | undefined,
) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value === undefined ? internal : value;
  return [
    current,
    (next: T) => {
      if (value === undefined) setInternal(next);
      if (!Object.is(current, next)) onChange?.(next);
    },
  ] as const;
}
export const focusRing =
  "focus-visible:outline-none focus-visible:shadow-kind-focus focus-visible:bg-accent";
export function actionVariants(
  variant: NonNullable<Parameters<typeof buttonVariants>[0]>["variant"] = "ghost",
) {
  return cn(
    buttonVariants({ variant, size: "sm" }),
    "min-h-8 gap-2 rounded-full border-0 px-3 py-0 text-ai-label leading-[1.4] disabled:pointer-events-none disabled:opacity-45",
    variant === "ghost" && "hover:bg-secondary/70",
  );
}
export const actionClass = actionVariants();
export const surfaceClass = "kind-surface rounded-2xl bg-surface text-foreground";
export function safeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const clean = value.trim();
  if (!clean || clean.startsWith("//") || clean.startsWith("\\\\")) return undefined;
  for (const character of clean) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) return undefined;
  }
  const scheme = clean.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  return scheme && !["http", "https", "mailto", "tel", "blob"].includes(scheme) ? undefined : clean;
}
