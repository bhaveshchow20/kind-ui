import {
  BarChart,
  BarSeries,
  Legend,
  LineChart,
  LineSeries,
  Root,
  type SeriesConfig,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { TrendingUp } from "lucide-react";
import { type CSSProperties, useState } from "react";
export function IntegrationHost() {
  const config = {
    total: { label: "Total", color: "#4055ee", icon: TrendingUp },
  } satisfies SeriesConfig;
  return (
    <LineChart
      data={[
        { month: "Jan", total: 0 },
        { month: "Feb", total: 12 },
      ]}
      config={config}
      xDataKey="month"
      aria-label="Monthly icon totals"
      className="h-80 text-blue-700"
      rootProps={{ className: "max-w-xl" }}
      legend={{ className: "gap-6 p-4 text-blue-700" }}
      grid={{ className: "stroke-fuchsia-600" }}
      tooltip={{ formatter: (value) => [`${value} units`, "Total"] }}
    />
  );
}

// The existing Next App Router fixture owns server rendering and actual hydration.
export function PatternHydrationHost() {
  const [visible, setVisible] = useState(["first", "second", "third"]);
  return (
    <section data-pattern-hydration="">
      {[0, 1].map((chart) => (
        <Root
          interaction={{
            kind: "series",
            mode: "visibility",
            eligibleKeys: Object.keys({
              first: { color: "red", pattern: { kind: "hatch" } },
              second: { color: "blue", pattern: { kind: "stripe" } },
              third: { color: "green", pattern: { kind: "duotone" } },
            }),
          }}
          key={chart}
          config={{
            first: { color: "red", pattern: { kind: "hatch" } },
            second: { color: "blue", pattern: { kind: "stripe" } },
            third: { color: "green", pattern: { kind: "duotone" } },
          }}
          visibleSeries={visible}
          onVisibleSeriesChange={setVisible}
        >
          <Legend />
          <BarChart
            width={320}
            height={180}
            data={[
              { category: "A", first: 8, second: 4, third: 2 },
              { category: "B", first: 5, second: 3, third: 1 },
            ]}
          >
            <XAxis dataKey="category" />
            <YAxis />
            <BarSeries dataKey="first" />
            <BarSeries dataKey="second" />
            <BarSeries dataKey="third" />
          </BarChart>
        </Root>
      ))}
    </section>
  );
}

// Root gradient resources are emitted by the real Next server before hydration.
export function ColorHydrationHost() {
  const [dark, setDark] = useState(false);
  return (
    <section
      data-color-hydration=""
      style={{ colorScheme: dark ? "dark" : "light", "--brand": "red" } as CSSProperties}
    >
      <button type="button" onClick={() => setDark(!dark)}>
        Color theme
      </button>
      {[0, 1].map((chart) => (
        <Root
          key={chart}
          config={{
            value: {
              color: { light: ["var(--brand)", "blue"], dark: ["white", "gray", "black"] },
            },
          }}
        >
          <Legend />
          <LineChart width={320} height={180} data={[{ value: 8 }, { value: 8 }]}>
            <XAxis />
            <YAxis />
            <LineSeries dataKey="value" dot={false} />
          </LineChart>
        </Root>
      ))}
    </section>
  );
}
