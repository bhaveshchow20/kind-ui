"use client";

import {
  Combobox,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxTrigger,
} from "@kind-ui/primitives";
import { useId, useRef, useState } from "react";

const reviewers = ["Alex Morgan", "Jamie Chen", "Jordan Lee", "Sam Rivera", "Taylor Kim"];

export default function ComboboxExample() {
  const root = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const [reviewer, setReviewer] = useState<string | null>("Jamie Chen");

  return (
    <div ref={root} className="w-full max-w-xs space-y-3">
      <Combobox items={reviewers} value={reviewer} onValueChange={setReviewer}>
        <div className="space-y-2">
          <label htmlFor={inputId} className="text-sm font-medium">
            Assign reviewer
          </label>
          <ComboboxInputGroup>
            <ComboboxInput id={inputId} placeholder="Search teammates…" />
            <ComboboxClear aria-label="Clear reviewer">×</ComboboxClear>
            <ComboboxTrigger aria-label="Show reviewers">⌄</ComboboxTrigger>
          </ComboboxInputGroup>
        </div>
        <ComboboxPortal container={root}>
          <ComboboxPositioner sideOffset={6}>
            <ComboboxPopup>
              <ComboboxEmpty>No teammates found.</ComboboxEmpty>
              <ComboboxList>
                {(person: string) => (
                  <ComboboxItem key={person} value={person}>
                    {person}
                    <ComboboxItemIndicator>✓</ComboboxItemIndicator>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </ComboboxPositioner>
        </ComboboxPortal>
      </Combobox>
      <p role="status" className="text-xs text-muted-foreground">
        {reviewer
          ? `${reviewer} will review this project.`
          : "Choose a teammate to request a review."}
      </p>
    </div>
  );
}
