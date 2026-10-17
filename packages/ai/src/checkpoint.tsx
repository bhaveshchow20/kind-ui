"use client";
import { Button } from "@kind-ui/primitives/button";
import { Tooltip, TooltipProvider } from "@kind-ui/primitives/tooltip";
import { Bookmark } from "lucide-react";
import type { ComponentProps } from "react";
import { actionClass, cn } from "./utils.js";
export type CheckpointProps = ComponentProps<"div">;
export function Checkpoint({ className, children, ...props }: CheckpointProps) {
  return (
    <div
      {...props}
      data-slot="checkpoint"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2 py-1 [overflow-wrap:anywhere] text-ai-description text-muted-foreground",
        className,
      )}
    >
      {children}
      <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-border/40" />
    </div>
  );
}
export type CheckpointIconProps = ComponentProps<"svg">;
export function CheckpointIcon({ children, className, ...props }: CheckpointIconProps) {
  if (children == null) {
    return (
      <Bookmark
        aria-hidden="true"
        strokeWidth={1.5}
        nonScalingStroke
        {...props}
        data-slot="checkpoint-icon"
        className={cn("size-3.5 shrink-0 text-muted-foreground/80", className)}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
      data-slot="checkpoint-icon"
      className={cn("size-3.5 shrink-0 text-muted-foreground/80", className)}
    >
      {children}
    </svg>
  );
}
export type CheckpointTriggerProps = ComponentProps<"button"> & {
  tooltip?: string | undefined;
  variant?: "ghost" | "outline" | "default" | undefined;
  size?: "sm" | "md" | "lg" | undefined;
};
export function CheckpointTrigger({
  tooltip,
  variant = "ghost",
  size = "md",
  className,
  ...props
}: CheckpointTriggerProps) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      aria-label={tooltip}
      {...props}
      data-slot="checkpoint-trigger"
      data-size={size}
      className={cn(
        actionClass,
        "min-h-8 min-w-0 max-w-full gap-1.5 whitespace-normal rounded-md [overflow-wrap:anywhere] px-2 coarse:min-h-11 coarse:min-w-11 text-ai-label font-medium text-muted-foreground hover:bg-inset hover:text-foreground",
        variant === "outline" && "border border-transparent bg-surface",
        size === "sm" && "min-h-7 gap-1 px-1.5 text-ai-description",
        size === "lg" && "min-h-8 px-2.5 text-ai-body",
        className,
      )}
    />
  );
  return tooltip ? (
    <TooltipProvider>
      <Tooltip
        content={tooltip}
        side="bottom"
        align="start"
        contentProps={{
          className:
            "max-w-64 rounded-xl border border-transparent bg-elevated px-3 py-2 text-ai-description text-foreground shadow-[0_4px_16px_rgb(0_0_0/0.10)] ring-0",
        }}
      >
        {button}
      </Tooltip>
    </TooltipProvider>
  ) : (
    button
  );
}
