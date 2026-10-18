"use client";

import { useRender } from "@base-ui/react/use-render";
import { Badge } from "@kind-ui/primitives/badge";
import { Loader } from "./loader.js";
import { Status } from "./status.js";
import { cn } from "./utils.js";

export type ThinkingIndicatorProps = Omit<useRender.ComponentProps<"div">, "children"> & {
  label: string;
  elapsed?: string | undefined;
  live?: "polite" | "off" | undefined;
  pulse?: boolean | undefined;
};

export function ThinkingIndicator({
  label,
  elapsed,
  live = "polite",
  pulse = true,
  className,
  render,
  ...props
}: ThinkingIndicatorProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: {
      ...props,
      "data-slot": "thinking-indicator",
      className: cn("flex max-w-full flex-wrap items-start gap-2", className),
      children: (
        <>
          <Status
            state="inflight"
            size="sm"
            pulse={pulse}
            className="min-w-0 whitespace-normal [overflow-wrap:anywhere]"
          >
            <Loader
              variant={null}
              aria-live={live}
              className="min-w-0 whitespace-normal [overflow-wrap:anywhere]"
            >
              {label}
            </Loader>
          </Status>
          {elapsed !== undefined && (
            <Badge
              tone="neutral"
              size="sm"
              data-slot="thinking-indicator-elapsed"
              className="min-w-0 whitespace-normal [overflow-wrap:anywhere]"
            >
              {elapsed}
            </Badge>
          )}
        </>
      ),
    },
  });
}
