import * as Chart from "@kind-ui/charts";
import { useState } from "react";

const rows = [
  { id: "first", name: "First", value: 20 },
  { id: "second", name: "Second", value: 30 },
  { id: "third", name: "Third", value: 50 },
];
const config = {
  first: { label: "First", color: "#f00" },
  second: { label: "Second", color: "#00f" },
  third: { label: "Third", color: "#0a0" },
};
export function PieHideFixture() {
  const [visible, setVisible] = useState(["first", "second", "third"]);
  const [payload, setPayload] = useState("");
  const [wholeHidden, setWholeHidden] = useState(false);
  return (
    <>
      <section id="pie-pin-hidden">
        <Chart.Root
          config={config}
          visibleSeries={["second", "third"]}
          interaction={{
            kind: "category",
            mode: "visibility",
            markActivation: "matching-legend",
            eligibleKeys: Object.keys(config),
          }}
        >
          <Chart.PieChart width={400} height={300} defaultPinnedCategory="second">
            <Chart.PieSeries
              data={rows}
              dataKey="value"
              nameKey="name"
              categoryKey="id"
              interactionBinding="root"
            />
            <Chart.Tooltip
              content={(tooltip) => (
                <output data-native-index={tooltip.activeIndex}>
                  {tooltip.payload.map((entry) => `${entry.payload.id}:${entry.value}`).join(",")}
                </output>
              )}
            />
          </Chart.PieChart>
        </Chart.Root>
      </section>
      <section id="pie-pin-default">
        <Chart.Root
          config={config}
          visibleSeries={["second", "third"]}
          interaction={{ kind: "category", mode: "visibility", eligibleKeys: Object.keys(config) }}
        >
          <Chart.PieChart width={400} height={300} defaultPinnedCategory="second">
            <Chart.PieSeries
              data={rows}
              dataKey="value"
              nameKey="name"
              categoryKey="id"
              interactionBinding="root"
            />
            <Chart.Tooltip />
          </Chart.PieChart>
        </Chart.Root>
      </section>
      <section id="pie-hide">
        <button type="button" onClick={() => setWholeHidden(true)}>
          Hide all pie sectors
        </button>
        <button type="button" onClick={() => setWholeHidden(false)}>
          Restore all pie sectors
        </button>
        <button type="button" onClick={() => setVisible(["second", "third"])}>
          Hide first pie category
        </button>
        <button type="button" onClick={() => setVisible(["first", "second", "third"])}>
          Restore pie categories
        </button>
        <output>{payload}</output>
        <Chart.Root
          config={config}
          visibleSeries={visible}
          onVisibleSeriesChange={setVisible}
          interaction={{
            kind: "category",
            mode: "visibility",
            markActivation: "matching-legend",
            eligibleKeys: Object.keys(config),
          }}
        >
          <Chart.PieChart
            width={400}
            height={300}
            animate={{ revealDurationMs: 2000, hoverTransition: { duration: 1, ease: "linear" } }}
            defaultPinnedCategory="second"
          >
            <Chart.PieSeries
              hide={wholeHidden}
              label
              data={rows}
              dataKey="value"
              nameKey="name"
              categoryKey="id"
              interactionBinding="root"
              outerRadius={100}
              innerRadius={30}
              onMouseEnter={(sector) => setPayload(`${sector.payload.id}:${sector.value}`)}
            />
            <Chart.Tooltip />
          </Chart.PieChart>
        </Chart.Root>
      </section>
    </>
  );
}
