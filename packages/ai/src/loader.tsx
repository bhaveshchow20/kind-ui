"use client";
import { useRender } from "@base-ui/react/use-render";
import type { ClassValue } from "clsx";
import type { ComponentProps, CSSProperties, ElementType } from "react";
import { ThinkingDots } from "./thinking-dots.js";
import { cn } from "./utils.js";
export type LoaderProps = useRender.ComponentProps<"span"> & {
  variant?: "pulse" | "shimmer" | null | undefined;
  dots?: boolean | undefined;
  duration?: number | undefined;
  spread?: number | undefined;
};
export function Loader({
  variant = "pulse",
  dots = false,
  duration = variant === "pulse" ? 1.4 : 2.2,
  spread = 40,
  style,
  className,
  children = "Loading",
  render,
  ...props
}: LoaderProps) {
  return useRender({
    defaultTagName: "span",
    render,
    props: {
      role: "status",
      "aria-label": typeof children === "string" ? children : "Loading",
      ...props,
      "data-slot": "loader",
      "data-variant": variant,
      style: {
        "--kind-loader-duration": `${Math.max(0.1, duration)}s`,
        "--kind-loader-spread": `${Math.max(0, Math.min(100, spread))}%`,
        ...style,
      } as CSSProperties,
      className: loaderVariants({
        variant: dots && variant === "pulse" ? null : variant,
        className,
      }),
      children: (
        <>
          {children}
          {dots && <ThinkingDots />}
        </>
      ),
    },
  });
}
export type TextShimmerProps = Omit<ComponentProps<"p">, "children"> & {
  children: string;
  as?: ElementType | undefined;
  duration?: number | undefined;
  spread?: number | undefined;
};
export function Shimmer({
  children,
  as: Tag = "p",
  duration = 2,
  spread = 2,
  className,
  style,
  ...props
}: TextShimmerProps) {
  return (
    <Tag
      {...props}
      data-slot="shimmer"
      className={cn(
        "kind-shimmer m-0 inline-block max-w-full break-words align-baseline text-start text-ai-label font-medium",
        className,
      )}
      style={
        {
          "--kind-loader-duration": `${Math.max(0.1, duration)}s`,
          "--kind-loader-spread": `${children.length * Math.max(0, spread)}px`,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
export function loaderVariants({
  variant = "pulse",
  className,
  class: extraClass,
}: {
  variant?: "pulse" | "shimmer" | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
} = {}) {
  return cn(
    "inline-flex max-w-full items-baseline gap-[0.125em] text-start text-ai-label font-medium [&>svg]:size-[1.125em] [&>svg]:shrink-0 [&>svg]:self-center",
    variant === "shimmer"
      ? "kind-shimmer"
      : variant === "pulse"
        ? "text-muted-foreground motion-safe:animate-pulse"
        : "text-muted-foreground",
    extraClass,
    className,
  );
}
