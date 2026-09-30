import { Legend, Root, TooltipContent } from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

function Fixture({ name, color }: { name: string; color: string }) {
  const [visible, setVisible] = useState<string[]>([]);
  const [locked, setLocked] = useState(true);
  const [request, setRequest] = useState("");
  return (
    <section aria-label={name} style={{ width: "100%", minWidth: 0 }}>
      <label>
        <input
          type="checkbox"
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
        />
        Hold {name} changes
      </label>
      <output aria-label={`${name} request`}>{request}</output>
      <Root
        config={{ count: { label: `${name} tasks`, color } }}
        visibleSeries={visible}
        onVisibleSeriesChange={(next) => {
          setRequest(next.join(","));
          if (!locked) setVisible(next);
        }}
        data-owner={name}
        ref={(node) => {
          if (node) node.dataset.forwarded = "container";
        }}
      >
        <Legend
          aria-label={`${name} legend`}
          ref={(node) => {
            if (node) node.dataset.forwarded = "legend";
          }}
          onClick={(event) => {
            event.currentTarget.dataset.clicked = "yes";
          }}
        />
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={[{ count: 0 }, { count: 10 }]}
            accessibilityLayer
            aria-label={`Chart ${name}`}
          >
            <Line
              dataKey="count"
              hide={!visible.includes("count")}
              stroke="var(--color-count)"
              isAnimationActive={false}
            />
            <Tooltip
              isAnimationActive={false}
              content={(tooltip) => (
                <TooltipContent
                  tooltip={tooltip}
                  aria-label={`${name} tooltip`}
                  ref={(node) => {
                    if (node) node.dataset.forwarded = "tooltip";
                  }}
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </Root>
    </section>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(
  <main style={{ width: "90vw", maxWidth: 700, margin: "auto" }}>
    <Fixture name="A" color="#2563eb" />
    <Fixture name="B" color="#15803d" />
  </main>,
);
