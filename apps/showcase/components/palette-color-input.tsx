"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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
