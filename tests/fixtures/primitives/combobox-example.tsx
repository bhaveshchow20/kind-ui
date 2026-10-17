"use client";

import {
  Combobox,
  ComboboxClear,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxStatus,
} from "@kind-ui/primitives/combobox";
import { useId, useState } from "react";

const destinations = [
  { label: "Projects", items: ["Atlas", "Fieldnotes", "Archive (unavailable)"] },
  { label: "Regions", items: ["North America", "Europe", "Asia Pacific"] },
];

export function ComboboxExample({
  value,
  onValueChange,
  disabled = false,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  return (
    <div className="w-full max-w-80 rounded-2xl border border-border/60 bg-elevated p-2">
      <Combobox
        items={destinations}
        inline
        open
        autoHighlight
        value={value}
        onValueChange={onValueChange}
        inputValue={query}
        onInputValueChange={setQuery}
        disabled={disabled}
      >
        <label htmlFor={inputId} className="mb-2 block px-1 text-sm font-medium">
          Project or region
        </label>
        <div className="relative flex items-center">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute start-3 size-4 text-muted-foreground"
          >
            ⌕
          </span>
          <ComboboxInput id={inputId} placeholder="Search destinations…" className="pe-10 ps-9" />
          <ComboboxClear aria-label="Clear destination" className="absolute end-0.5" keepMounted>
            <span aria-hidden="true">×</span>
          </ComboboxClear>
        </div>
        <ComboboxEmpty>No destinations match your search.</ComboboxEmpty>
        <ComboboxList aria-label="Destinations">
          {(group: (typeof destinations)[number]) => (
            <ComboboxGroup key={group.label} items={group.items}>
              <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
              <ComboboxCollection<string>>
                {(item) => (
                  <ComboboxItem key={item} value={item} disabled={item === "Archive (unavailable)"}>
                    {item}
                    <ComboboxItemIndicator>
                      <span aria-hidden="true">✓</span>
                    </ComboboxItemIndicator>
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
        <ComboboxStatus>
          {value ? `Selected: ${value}` : "Choose a project or region."}
        </ComboboxStatus>
      </Combobox>
    </div>
  );
}
