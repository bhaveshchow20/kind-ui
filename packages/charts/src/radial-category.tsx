"use client";

import { createContext } from "react";

// The native RadialBar reads chart data, so category identity is scoped there.
export const RadialCategory = createContext<{
  data: readonly unknown[];
  key: (row: unknown) => string;
} | null>(null);
