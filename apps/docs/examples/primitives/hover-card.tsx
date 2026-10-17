"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@kind-ui/primitives";
import { ArrowUpRight } from "lucide-react";

export default function HoverCardExample() {
  return (
    <div className="w-full max-w-sm space-y-3 rounded-2xl border border-border/60 bg-elevated p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Made with care
      </p>
      <p className="text-sm leading-6 text-muted-foreground">
        Small details add up. Explore the components built by{" "}
        <HoverCard>
          <HoverCardTrigger
            href="https://github.com/bhaveshchow20/kind-ui"
            className="font-medium text-foreground underline decoration-border underline-offset-4"
          >
            Kind UI
          </HoverCardTrigger>
          <HoverCardContent className="w-72 space-y-3" align="start">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground"
              >
                K
              </span>
              <div>
                <p className="text-sm font-medium">Kind UI</p>
                <p className="text-xs text-muted-foreground">Thoughtful React components</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Composable primitives with accessible interactions and room for your own design.
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              View the project on GitHub <ArrowUpRight aria-hidden="true" className="size-3" />
            </p>
          </HoverCardContent>
        </HoverCard>
        .
      </p>
    </div>
  );
}
