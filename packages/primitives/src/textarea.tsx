import type { ComponentProps } from "react";
import { cn } from "./utils.js";

const sizes = {
  sm: "min-h-18 rounded-[var(--kind-compact-radius)] px-3 py-2.5",
  md: "min-h-24",
  lg: "min-h-32 px-5 py-4",
};

export type TextareaProps = ComponentProps<"textarea"> & {
  size?: keyof typeof sizes | undefined;
  /** Grow with content up to the maximum height. Native rows apply when false. */
  autoGrow?: boolean | undefined;
};

export function Textarea({
  className,
  size = "md",
  autoGrow = true,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      rows={rows}
      className={cn(
        "max-h-96 w-full min-w-0 resize-y appearance-none overflow-y-auto overscroll-contain rounded-[var(--kind-field-radius)] border border-input bg-field px-[var(--kind-field-padding-inline)] py-[var(--kind-field-padding-block)] font-sans text-[length:var(--kind-body-size)] leading-[var(--kind-body-leading)] font-normal text-foreground caret-current shadow-[var(--kind-field-shadow)] outline-none focus-visible:bg-field-hover focus-visible:shadow-kind-focus forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight] forced-colors:focus-visible:outline-offset-3 transition-[background-color,border-color,box-shadow] duration-[var(--kind-feedback-duration)] ease-out placeholder:text-muted-foreground not-disabled:not-read-only:hover:bg-field-hover disabled:resize-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-55 aria-invalid:border-destructive motion-reduce:transition-none forced-colors:border-[ButtonText] forced-colors:shadow-none",
        sizes[size],
        autoGrow ? "field-sizing-content" : "field-sizing-fixed",
        className,
      )}
      {...props}
    />
  );
}
