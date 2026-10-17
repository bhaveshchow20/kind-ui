"use client";

import {
  Button,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@kind-ui/primitives";
import { Bell } from "lucide-react";
import { useId, useState } from "react";

export default function PopoverExample() {
  const [open, setOpen] = useState(false);
  const [delivery, setDelivery] = useState("Mentions only");
  const groupId = useId();

  return (
    <div className="flex w-full max-w-sm items-center justify-between gap-4 rounded-2xl border border-border/60 bg-elevated p-5">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Project notifications</p>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {delivery}
        </p>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="outline" size="icon-sm" aria-label="Notification preferences" />}
        >
          <Bell aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent className="w-72 max-w-[calc(100vw-2rem)] space-y-4 p-4" align="end">
          <div className="space-y-1">
            <PopoverTitle>Stay in the loop</PopoverTitle>
            <PopoverDescription>Choose what reaches your inbox.</PopoverDescription>
          </div>
          <fieldset className="space-y-2">
            <legend className="sr-only">Notification delivery</legend>
            {["All activity", "Mentions only", "Nothing"].map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name={groupId}
                  value={option}
                  checked={delivery === option}
                  onChange={() => setDelivery(option)}
                  className="accent-primary"
                />
                {option}
              </label>
            ))}
          </fieldset>
          <div className="flex justify-end">
            <PopoverClose render={<Button size="sm" />}>Done</PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
