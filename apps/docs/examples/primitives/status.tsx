"use client";

import { Button } from "@kind-ui/primitives/button";
import { Status, type StatusState } from "@kind-ui/primitives/status";
import { useEffect, useState } from "react";

export default function StatusExample() {
  const [state, setState] = useState<StatusState>("pending");

  useEffect(() => {
    if (state !== "inflight") return;
    const timeout = window.setTimeout(() => setState("active"), 1600);
    return () => window.clearTimeout(timeout);
  }, [state]);

  const label = state === "pending" ? "Queued" : state === "inflight" ? "Checking" : "Passed";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-background p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Accessibility check</p>
        <span role="status">
          <Status state={state} pulse={state === "inflight"}>
            {label}
          </Status>
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Give background work a clear, readable state.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" disabled={state === "inflight"} onClick={() => setState("inflight")}>
          {state === "active" ? "Run again" : "Run check"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={state === "pending"}
          onClick={() => setState("pending")}
        >
          {state === "inflight" ? "Cancel" : "Reset"}
        </Button>
      </div>
    </div>
  );
}
