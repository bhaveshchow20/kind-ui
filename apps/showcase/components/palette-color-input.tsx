"use client";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  MorphingPopover as Popover,
  MorphingPopoverContent as PopoverContent,
  MorphingPopoverTrigger as PopoverTrigger,
} from "@/components/morphing-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const colorSlots = ["first", "second", "third"] as const;

export function PaletteColorInput({
  color,
  index,
  onChange,
}: {
  color: string;
  index: number;
  onChange: (color: string) => void;
}) {
  const [hex, setHex] = useState(color);
  useEffect(() => setHex(color), [color]);
  return (
    <div className="custom-color-row">
      <span id={`palette-color-label-${index}`}>Color {index + 1}</span>
      <input
        type="color"
        value={color}
        aria-label={`Pick custom color ${index + 1}`}
        onChange={(e) => onChange(e.target.value)}
      />
      <Input
        aria-label={`Hex for custom color ${index + 1}`}
        value={hex}
        maxLength={7}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          const value = e.target.value;
          setHex(value);
          if (/^#[0-9a-f]{6}$/i.test(value)) onChange(value);
        }}
        onBlur={() => {
          if (!/^#[0-9a-f]{6}$/i.test(hex)) setHex(color);
        }}
      />
    </div>
  );
}

// Draft changes stay in this subtree: dragging a native picker must not rerender
// the gallery (including chart geometry, motion, and generated code examples).
export function CustomPaletteEditor({
  colors,
  hasCustom,
  onApply,
}: {
  colors: string[];
  hasCustom: boolean;
  onApply: (colors: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(colors);
  useEffect(() => setDraft(colors), [colors]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="custom-palette-button"
        aria-label={hasCustom ? "Edit custom palette" : "Create custom palette"}
      >
        {hasCustom ? <Pencil /> : <Plus />}
        <span className="sr-only">Custom palette</span>
      </PopoverTrigger>
      <PopoverContent className="palette-editor">
        <h3>Your palette</h3>
        {draft.map((color, index) => (
          <PaletteColorInput
            key={colorSlots[index]}
            color={color}
            index={index}
            onChange={(value) =>
              setDraft((previous) => previous.map((old, slot) => (slot === index ? value : old)))
            }
          />
        ))}
        <Button
          onClick={() => {
            onApply([...draft]);
            setOpen(false);
          }}
        >
          Use palette
        </Button>
      </PopoverContent>
    </Popover>
  );
}
