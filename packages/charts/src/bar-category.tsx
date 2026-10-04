"use client";

import { createContext, use, useState, useSyncExternalStore } from "react";

function createPointerModality() {
  let hover = false;
  const listeners = new Set<() => void>();
  return {
    snapshot: () => hover,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set: (next: boolean) => {
      if (hover === next) return;
      hover = next;
      for (const listener of listeners) listener();
    },
  };
}
const Context = createContext<ReturnType<typeof createPointerModality> | null>(null);

/** Observe real pointer modality without rerendering native shapes during down/click. */
export function BarCategoryBoundary({ children }: { children: React.ReactNode }) {
  const [modality] = useState(createPointerModality);
  return (
    <Context value={modality}>
      <div
        style={{ display: "contents" }}
        onPointerOverCapture={(event) => modality.set(event.pointerType !== "touch")}
        onPointerMoveCapture={(event) => modality.set(event.pointerType !== "touch")}
        onPointerDownCapture={(event) => modality.set(event.pointerType !== "touch")}
      >
        {children}
      </div>
    </Context>
  );
}

export function useBarCategoryHover() {
  const modality = use(Context);
  if (!modality) throw new Error("Bar category marks must be inside BarChart");
  return useSyncExternalStore(modality.subscribe, modality.snapshot, () => false);
}
