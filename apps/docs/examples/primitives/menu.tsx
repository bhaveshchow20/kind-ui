"use client";

import {
  Button,
  Menu,
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@kind-ui/primitives";
import { Check, Copy, MoreHorizontal, Pin } from "lucide-react";
import { useState } from "react";

export default function MenuExample() {
  const [pinned, setPinned] = useState(false);
  const [copies, setCopies] = useState(0);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-elevated p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            Research notes{" "}
            {pinned && <Pin aria-label="Pinned" className="size-3.5 text-muted-foreground" />}
          </p>
          <p className="text-sm text-muted-foreground">Updated a few minutes ago</p>
        </div>
        <Menu>
          <MenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Research notes actions" />}
          >
            <MoreHorizontal aria-hidden="true" />
          </MenuTrigger>
          <MenuContent align="end" className="w-52">
            <MenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
              <span className="flex size-4 items-center justify-center">
                <MenuCheckboxItemIndicator>
                  <Check aria-hidden="true" />
                </MenuCheckboxItemIndicator>
              </span>
              Pin to top
            </MenuCheckboxItem>
            <MenuSeparator />
            <MenuItem onClick={() => setCopies((count) => count + 1)}>
              <Copy aria-hidden="true" /> Create a copy
            </MenuItem>
            <MenuItem disabled>Move to archive</MenuItem>
          </MenuContent>
        </Menu>
      </div>
      <p
        aria-live="polite"
        className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground"
      >
        {copies === 0
          ? "Your original stays right here."
          : `${copies} ${copies === 1 ? "copy" : "copies"} created.`}
      </p>
    </div>
  );
}
