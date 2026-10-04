"use client";

import { LineChart, type SeriesConfig } from "@kind-ui/charts";
import { useState } from "react";

// A native SVG React component exercises the existing icon slot, with no icon package.
function TasksIcon() {
  return (
    <svg viewBox="0 0 16 16">
      <title>Tasks</title>
      <path d="M2 8h12" />
    </svg>
  );
}
const config = {
  tasks: { label: "Tasks", color: "#3659b8", icon: TasksIcon },
} satisfies SeriesConfig;

export function InteractiveChart() {
  const [count, setCount] = useState(12);
  const [visible, setVisible] = useState<string[]>(["tasks"]);
  return (
    <section aria-label="Interactive chart">
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Tasks: {count}
      </button>
      <LineChart
        aria-label="Client supplied chart"
        data={[
          { day: "Mon", tasks: 0 },
          { day: "Tue", tasks: count },
        ]}
        config={config}
        xDataKey="day"
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        animate={false}
      />
    </section>
  );
}
