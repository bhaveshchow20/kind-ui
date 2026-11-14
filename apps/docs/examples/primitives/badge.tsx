"use client";

import { Badge } from "@kind-ui/primitives/badge";
import { Button } from "@kind-ui/primitives/button";
import { useState } from "react";

export default function BadgeExample() {
  const [ready, setReady] = useState(false);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-background p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Website refresh</p>
        <span role="status">
          <Badge tone={ready ? "success" : "warning"}>{ready ? "Ready" : "In review"}</Badge>
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        A short label keeps project progress easy to scan.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-5"
        onClick={() => setReady((current) => !current)}
      >
        {ready ? "Move to review" : "Mark ready"}
      </Button>
    </div>
  );
}
