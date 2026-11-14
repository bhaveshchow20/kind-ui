"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@kind-ui/primitives/hover-card";
import { useId, useRef, useState } from "react";

export type HoverCardExampleProps = {
  openDelay: number;
  closeDelay: number;
  onOpenChange?: ((open: boolean) => void) | undefined;
};
const summary =
  "A shared starting point for a small product team: audience, promise, evidence, and the next useful step.";

export function HoverCardExample({ openDelay, closeDelay, onOpenChange }: HoverCardExampleProps) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const destinationId = useId();
  return (
    <div ref={container} className="w-full max-w-md space-y-6 text-sm">
      <p className="leading-relaxed text-muted-foreground">
        A good launch starts with{" "}
        <HoverCard
          open={open}
          openDelay={openDelay}
          closeDelay={closeDelay}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange?.(next);
          }}
        >
          <HoverCardTrigger
            href={`#${destinationId}`}
            className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            a practical launch brief
          </HoverCardTrigger>
          .
          <HoverCardContent container={container} align="start" className="w-72 space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary font-medium"
                aria-hidden="true"
              >
                LB
              </span>
              <div>
                <p className="font-medium">A practical launch brief</p>
                <p className="text-xs text-muted-foreground">Working notes · 4 minute read</p>
              </div>
            </div>
            <p className="leading-relaxed text-muted-foreground">{summary}</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-secondary px-2 py-1">Strategy</span>
              <span className="rounded-full bg-secondary px-2 py-1">Teamwork</span>
            </div>
          </HoverCardContent>
        </HoverCard>
      </p>
      <p className="text-xs text-muted-foreground">
        Hover or focus the link to preview. Follow it to read the same information below.
      </p>
      <article
        id={destinationId}
        tabIndex={-1}
        className="space-y-2 rounded-2xl bg-secondary/40 p-4 outline-none focus-visible:shadow-kind-focus"
      >
        <h2 className="font-medium">A practical launch brief</h2>
        <p className="text-xs text-muted-foreground">
          Working notes · 4 minute read · Strategy · Teamwork
        </p>
        <p className="leading-relaxed text-muted-foreground">{summary}</p>
      </article>
      <span data-testid="hover-card-state" className="sr-only">
        {open ? "Preview open" : "Preview closed"}
      </span>
    </div>
  );
}
