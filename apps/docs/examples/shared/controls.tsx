"use client";
import { type ReactNode, useEffect, useState } from "react";
export type CommonSettings = { animate: boolean; emphasis: "auto" | "none" };
export function useSettings<T>(defaults: T, onChange?: (settings: T) => void) {
  const [settings, setSettings] = useState(defaults);
  useEffect(() => {
    onChange?.(settings);
  }, [settings, onChange]);
  return [settings, setSettings] as const;
}
export function Controls<T extends CommonSettings>({
  settings,
  onChange,
  children,
  emphasisControl = false,
  compact = false,
}: {
  settings: T;
  onChange: (settings: T) => void;
  children?: ReactNode;
  emphasisControl?: boolean;
  compact?: boolean;
}) {
  return (
    <fieldset className={`chart-controls${compact ? " chart-controls-compact" : ""}`}>
      <legend>Example settings</legend>
      <label>
        <input
          type="checkbox"
          role={compact ? "switch" : undefined}
          checked={settings.animate}
          onChange={(e) => onChange({ ...settings, animate: e.target.checked })}
        />
        {compact ? "Animation" : "Animate entrance"}
      </label>
      {emphasisControl && (
        <label>
          Emphasis
          <select
            value={settings.emphasis}
            onChange={(e) =>
              onChange({ ...settings, emphasis: e.target.value === "auto" ? "auto" : "none" })
            }
          >
            <option value="auto">Automatic</option>
            <option value="none">Off</option>
          </select>
        </label>
      )}
      {children}
    </fieldset>
  );
}
