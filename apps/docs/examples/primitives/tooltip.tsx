"use client";

import { Button, Tooltip, TooltipProvider } from "@kind-ui/primitives";
import { Bookmark } from "lucide-react";
import { useState } from "react";

export default function TooltipExample() {
  const [saved, setSaved] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex w-full max-w-sm items-center justify-between gap-6 rounded-2xl border border-border/60 bg-elevated p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">A little inspiration</p>
          <p className="text-sm text-muted-foreground">Keep useful ideas close.</p>
        </div>
        <Tooltip content={saved ? "Remove from saved" : "Save for later"}>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={saved ? "Remove from saved" : "Save for later"}
            aria-pressed={saved}
            onClick={() => setSaved(!saved)}
          >
            <Bookmark aria-hidden="true" fill={saved ? "currentColor" : "none"} />
          </Button>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
