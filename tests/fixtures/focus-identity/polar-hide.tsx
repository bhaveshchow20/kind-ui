import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { useState } from "react";

const config = {
  first: { color: "red", label: "First" },
  second: { color: "blue", label: "Second" },
};
const data = [
  { key: "first", first: 5, second: 90 },
  { key: "second", first: 10, second: 70 },
  { key: "third", first: 20, second: 60 },
];
function Case({ family }: { family: string }) {
  const [pointer, setPointer] = useState<unknown>(null);
  const [visible, setVisible] = useState(["first", "second"]);
  const rings = [
    { key: "first", value: 20 },
    { key: "second", value: 90 },
  ];
  return (
    <section id={`polar-hide-${family}`}>
      <button
        type="button"
        onClick={() => setVisible((old) => (old.length === 2 ? ["second"] : ["first", "second"]))}
      >
        Hide
      </button>
      {family.startsWith("activity") ? (
        <Chart.ActivityRings
          config={config}
          rings={rings}
          width={400}
          height={300}
          animate={true}
          labels={{}}
          series={{
            onMouseEnter: (entry, index) =>
              setPointer({
                series: entry.payload.key,
                row: entry.payload.key,
                value: entry.payload.rawValue,
                index,
              }),
          }}
          aria-label="Rings"
          rootProps={{
            visibleSeries: visible,
            onVisibleSeriesChange: setVisible,
            ...(family === "activity-visibility"
              ? {
                  interaction: {
                    kind: "category",
                    mode: "visibility",
                    eligibleKeys: ["first", "second"],
                  },
                }
              : {}),
          }}
        />
      ) : (
        <Chart.Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
          {family === "radar" ? (
            <Chart.RadarChart width={400} height={300} data={data} animate={true}>
              <Chart.PolarAngleAxis dataKey="key" />
              <Chart.PolarRadiusAxis />
              <Chart.RadarSeries dataKey="first" dot label>
                <Chart.LabelList dataKey="first" />
              </Chart.RadarSeries>
              <Chart.RadarSeries
                dataKey="second"
                dot
                onMouseEnter={(entry) =>
                  setPointer({
                    series: "second",
                    rows: entry.points?.map((point) => ({
                      row: point.payload.key,
                      value: point.payload.second,
                    })),
                  })
                }
              >
                <Chart.LabelList
                  dataKey="second"
                  content={(props) => (
                    <text
                      x={"x" in props ? Number(props.x) : 0}
                      y={"y" in props ? Number(props.y) : 0}
                    >
                      {props.value}
                    </text>
                  )}
                />
              </Chart.RadarSeries>
            </Chart.RadarChart>
          ) : (
            <Chart.RadialBarChart width={400} height={300} data={data} animate={true}>
              <Chart.PolarAngleAxis type="number" />
              <Chart.PolarRadiusAxis type="category" dataKey="key" />
              <Chart.RadialBarSeries dataKey="first" background label>
                <Chart.LabelList dataKey="first" />
              </Chart.RadialBarSeries>
              <Chart.RadialBarSeries
                dataKey="second"
                background
                onMouseEnter={(entry, index) =>
                  setPointer({
                    series: "second",
                    row: entry.payload.key,
                    value: entry.payload.second,
                    index,
                  })
                }
              >
                <Chart.LabelList dataKey="second" />
              </Chart.RadialBarSeries>
            </Chart.RadialBarChart>
          )}
          <Chart.Legend />
        </Chart.Root>
      )}
      <output data-polar-pointer={JSON.stringify(pointer)} />
    </section>
  );
}
export function PolarHideCases() {
  return ["radar", "radial", "activity", "activity-visibility"].map((family) => (
    <Case key={family} family={family} />
  ));
}
