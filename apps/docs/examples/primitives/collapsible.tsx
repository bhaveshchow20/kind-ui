"use client";

import { Collapsible, CollapsiblePreviewContent, CollapsibleTrigger } from "@kind-ui/primitives";
import { ChevronDown } from "lucide-react";
import { useId, useRef, useState } from "react";

export default function CollapsibleExample() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentId = useId();

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="w-full max-w-md rounded-2xl border border-border/60 bg-elevated p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-foreground">A note on thoughtful interfaces</p>
        <CollapsibleTrigger
          ref={triggerRef}
          aria-controls={contentId}
          className="shrink-0 gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground"
        >
          {open ? "Show less" : "Read more"}
          <ChevronDown
            aria-hidden="true"
            className={`size-3.5 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
      </div>
      <CollapsiblePreviewContent
        id={contentId}
        open={open}
        previewHeight={76}
        returnFocusRef={triggerRef}
        previewDescription="A short note on interface design. Choose Read more to read the full note."
        contentClassName="space-y-3 text-sm leading-6 text-muted-foreground"
        overlay={
          !open && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-elevated to-transparent"
            />
          )
        }
      >
        <p>
          Good interfaces make room for the task at hand. A clear label, a quiet surface, and a
          predictable next step can be enough.
        </p>
        <p>
          Progressive disclosure keeps supporting detail within reach. Readers can choose when to
          explore, without losing their place in the larger story.
        </p>
        <p>
          Keep the full content available, and make the control that reveals it easy to find with a
          keyboard.
        </p>
      </CollapsiblePreviewContent>
    </Collapsible>
  );
}
