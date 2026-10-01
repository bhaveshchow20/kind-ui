import { Legend, Root, TooltipContent } from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import "./consumer.css";
import { MotionContract } from "./motion.js";

const series = {
  alpha: { label: "Alpha", color: "#345" },
  beta: { label: "Beta", color: "#678" },
};
function Panel({ custom }: { custom: boolean }) {
  const [reverse, setReverse] = useState(false);
  const [visible, setVisible] = useState<string[]>(["alpha", "beta"]);
  return (
    <section aria-label={custom ? "Overrides" : "Defaults"}>
      <button type="button" onClick={() => setReverse(!reverse)}>
        Reverse series
      </button>
      <Root
        config={reverse ? { beta: series.beta, alpha: series.alpha } : series}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        className={custom ? "consumer" : undefined}
        style={custom ? { width: 320 } : undefined}
      >
        <Legend style={custom ? { rowGap: 19 } : undefined} />
        <TooltipContent
          style={custom ? { paddingBottom: 5 } : undefined}
          tooltip={{
            active: true,
            accessibilityLayer: true,
            label: "Monday",
            activeIndex: "0",
            coordinate: undefined,
            payload: [
              { dataKey: "beta", name: "Beta", value: 2, graphicalItemId: "beta" },
              { dataKey: "alpha", name: "Alpha", value: 0, graphicalItemId: "alpha" },
            ],
          }}
        />
      </Root>
    </section>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(
  <>
    <Panel custom={false} />
    <Panel custom />
    <MotionContract />
  </>,
);
