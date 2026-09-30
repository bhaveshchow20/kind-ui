"use client";

import { DataTable, LineChart, normalizeSeries } from "@kind-ui/charts";
import { useState } from "react";

// This composition belongs to your application. The chart runtime remains an npm dependency.
const model = normalizeSeries(
  [
    { id: "jan", label: "January", x: 1, y: 8 },
    { id: "feb", label: "February", x: 2, y: null },
    { id: "mar", label: "March", x: 3, y: 12 },
  ],
  { missing: "gap", x: { kind: "number", unit: null }, y: { unit: "kWh" } },
);

export function LineChartDemo() {
  const [selectedId, onSelectionChange] = useState<string | null>(null);
  return (
    <section aria-label="Monthly energy">
      <LineChart
        model={model}
        title="Monthly energy"
        selectedId={selectedId}
        onSelectionChange={onSelectionChange}
      />
      <DataTable
        model={model}
        caption="Exact energy values"
        selectedId={selectedId}
        onSelectionChange={onSelectionChange}
      />
    </section>
  );
}
