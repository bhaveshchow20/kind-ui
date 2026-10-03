"use client";
import { useEffect, useState } from "react";
export type CommonSettings = { animate: boolean; emphasis: "auto" | "none" };
export function useSettings<T>(defaults: T, onChange?: (settings: T) => void) {
  const [settings, setSettings] = useState(defaults);
  useEffect(() => {
    onChange?.(settings);
  }, [settings, onChange]);
  return [settings, setSettings] as const;
}
