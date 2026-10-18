"use client";
import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import type { ClassValue } from "clsx";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { actionClass, cn } from "./utils.js";
export type SuggestionsProps = ComponentProps<"div">;
export function Suggestions({ className, ...props }: SuggestionsProps) {
  return (
    <div
      {...props}
      data-slot="suggestions"
      className={cn(
        "flex max-w-full flex-nowrap items-stretch gap-2 overflow-x-auto px-1.5 py-1.5 pb-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70",
        className,
      )}
    />
  );
}
export type SuggestionProps = Omit<useRender.ComponentProps<"button">, "onClick"> & {
  suggestion?: string | undefined;
  onClick?: ((suggestion: string, event: MouseEvent<HTMLButtonElement>) => void) | undefined;
  variant?: "outline" | "default" | "plain" | "list" | null | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  highlight?: ReactNode;
};
export function Suggestion({
  suggestion,
  onClick,
  variant = "outline",
  size = "md",
  highlight,
  children,
  className,
  render,
  ...props
}: SuggestionProps) {
  return useRender({
    defaultTagName: "button",
    render: render ?? <Button variant="ghost" size="sm" />,
    props: {
      type: "button",
      ...props,
      "data-slot": "suggestion",
      "data-variant": variant,
      "data-size": size,
      onClick: (event: MouseEvent<HTMLButtonElement>) =>
        onClick?.(suggestion ?? (typeof children === "string" ? children : ""), event),
      className: cn(
        actionClass,
        "[&_[data-slot=button-content]]:w-full [&_[data-slot=button-content]]:justify-[inherit] [&_[data-slot=button-content]]:items-[inherit] min-h-8 max-w-full shrink-0 gap-1.5 whitespace-normal rounded-lg px-2.5 py-1 text-start text-ai-label [overflow-wrap:anywhere] [&_svg]:size-3.5 [&_svg]:text-muted-foreground",
        (variant === "outline" || variant === "default") &&
          "border border-transparent bg-surface hover:bg-inset",
        variant === "list" &&
          "w-full items-start justify-start gap-2 rounded-lg bg-surface px-3 py-1.5 text-foreground/85 hover:bg-inset [&_svg]:mt-0.5",
        variant === "plain" && "text-muted-foreground hover:text-foreground",
        size === "sm" && "min-h-7 px-2 text-ai-label",
        size === "lg" && "min-h-9 px-3 text-ai-body",
        className,
      ),
      children: (
        <>
          {highlight}
          {children ?? suggestion}
        </>
      ),
    },
  });
}
export function suggestionVariants({
  variant = "outline",
  className,
  class: extraClass,
}: {
  variant?: "outline" | "default" | "plain" | "list" | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
} = {}) {
  return cn(
    actionClass,
    "[&_[data-slot=button-content]]:w-full [&_[data-slot=button-content]]:justify-[inherit] [&_[data-slot=button-content]]:items-[inherit] min-h-8 max-w-full shrink-0 gap-1.5 whitespace-normal rounded-lg px-2.5 py-1 text-start text-ai-label [overflow-wrap:anywhere] [&_svg]:size-3.5 [&_svg]:text-muted-foreground",
    (variant === "outline" || variant === "default") &&
      "border border-transparent bg-surface hover:bg-inset",
    variant === "list" &&
      "w-full items-start justify-start gap-2 rounded-lg bg-surface px-3 py-1.5 text-foreground/85 hover:bg-inset [&_svg]:mt-0.5",
    variant === "plain" && "text-muted-foreground hover:text-foreground",
    extraClass,
    className,
  );
}
