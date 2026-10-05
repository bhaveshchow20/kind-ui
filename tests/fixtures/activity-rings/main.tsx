import {
  type ActivityRing,
  type ActivityRingDatum,
  ActivityRings,
  type ActivityRingsProps,
  Cell,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBarSeries,
  Root,
} from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { useState } from "react";
import { createRoot } from "react-dom/client";

const config = {
  move: { label: "Move", color: "#ff2266" },
  exercise: { label: "Exercise", color: "#33aa44" },
  stand: { label: "Stand", color: "#2288ff" },
};
const initial: ActivityRing[] = [
  { key: "move", value: 75 },
  { key: "exercise", value: 30 },
  { key: "stand", value: 50 },
];
const typed: ActivityRingsProps = { config, rings: initial, "aria-label": "Typed" };
void typed;
// @ts-expect-error Generated axes own the normalized progress domain.
const invalidAxis: ActivityRingsProps["series"] = { angleAxisId: 1 };
void invalidAxis;
// @ts-expect-error Accessible chart name is required.
const missingName: ActivityRingsProps = { config, rings: initial };
void missingName;
// @ts-expect-error Domains have two numeric bounds.
const invalidRing: ActivityRing = { key: "move", value: 1, domain: [0, 1, 2] };
void invalidRing;
// @ts-expect-error Consumers own value semantics, numeric values are required.
const invalidValue: ActivityRing = { key: "move", value: "75" };
void invalidValue;

function App() {
  const [rings, setRings] = useState(initial);
  const tooltipMode = new URLSearchParams(window.location.search).get("tooltip");
  return (
    <>
      <button type="button" onClick={() => setRings([...rings].reverse())}>
        Reorder
      </button>
      <button type="button" onClick={() => setRings(rings.map((ring) => ({ ...ring, value: 50 })))}>
        Update
      </button>
      <div id="defaults">
        <ActivityRings
          config={config}
          rings={rings}
          aria-label="Daily activity"
          width={300}
          height={300}
          responsive={false}
        />
      </div>
      <div id="explicit">
        <Root config={config}>
          <RadialBarChart
            data={rings.map((ring) => ({ ...ring, progress: ring.value }))}
            width={300}
            height={300}
            innerRadius="30%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            barCategoryGap="15%"
            layout="radial"
            aria-label="Explicit equivalent"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
            <PolarRadiusAxis type="category" dataKey="key" tick={false} axisLine={false} />
            <RadialBarSeries dataKey="progress" background cornerRadius="50%">
              {rings.map((ring) => (
                <Cell key={ring.key} fill={`var(--color-${ring.key})`} />
              ))}
            </RadialBarSeries>
          </RadialBarChart>
        </Root>
      </div>
      <div id="zero">
        <ActivityRings
          config={config}
          rings={[
            { key: "move", value: 0 },
            { key: "exercise", value: 100 },
          ]}
          aria-label="Zero and full"
          width={300}
          height={300}
          animate
          responsive={false}
          labels={{}}
        />
      </div>
      <div id="empty">
        <ActivityRings
          config={config}
          rings={[]}
          aria-label="Empty activity"
          width={300}
          height={300}
          legend={false}
          responsive={false}
        />
      </div>
      <div id="normalized">
        <Root config={config}>
          <RadialBarChart
            data={[
              { key: "move", progress: 75 },
              { key: "exercise", progress: 100 },
              { key: "stand", progress: 0 },
            ]}
            aria-label="Normalized native equivalent"
            width={400}
            height={400}
            innerRadius={70}
            outerRadius={150}
            cx={180}
            cy={180}
            startAngle={180}
            endAngle={0}
            barCategoryGap="25%"
            layout="radial"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
            <PolarRadiusAxis type="category" dataKey="key" tick={false} axisLine={false} />
            <RadialBarSeries
              dataKey="progress"
              background={{ fill: "#ddd" }}
              cornerRadius={0}
              fill="orange"
            />
          </RadialBarChart>
        </Root>
      </div>
      <div id="overrides">
        <ActivityRings
          config={config}
          rings={[
            {
              key: "move",
              value: 25,
              domain: [-50, 50],
              cellProps: { fill: "purple", "aria-label": "Custom move paint" },
            },
            { key: "exercise", value: 300, domain: [0, 200] },
            { key: "stand", value: -10 },
          ]}
          aria-labelledby="override-title"
          aria-describedby="description"
          width={400}
          height={400}
          innerRadius={70}
          outerRadius={150}
          cx={180}
          cy={180}
          startAngle={180}
          endAngle={0}
          barCategoryGap="25%"
          series={{ background: { fill: "#ddd" }, cornerRadius: 0, fill: "orange" }}
          tooltip={
            tooltipMode === "options"
              ? { itemKey: () => "move", valueAnimation: "shuffle" }
              : tooltipMode === "custom"
                ? {
                    content: ({ active, payload }) => {
                      const ring = payload[0]?.payload as
                        | (ActivityRingDatum & { payload?: ActivityRingDatum })
                        | undefined;
                      return active && ring ? (
                        <output data-test="custom-ring-tooltip">
                          {ring.rawValue}/{ring.progress}/{ring.value}/{ring.payload?.value}
                        </output>
                      ) : null;
                    },
                  }
                : {}
          }
          labels={{ position: "insideStart", content: undefined }}
          legend={false}
          responsive={false}
        />
        <h2 id="override-title">Custom domains and geometry</h2>
        <p id="description">Values retain their original units.</p>
      </div>
    </>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing activity rings root");
createRoot(root).render(<App />);
