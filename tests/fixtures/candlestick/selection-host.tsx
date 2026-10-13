import {
  CandlestickChart,
  type CandlestickDatum,
  type CandlestickTime,
  type SeriesConfig,
} from "@kind-ui/charts";
import { useState } from "react";

const observations: CandlestickDatum[] = [
  { time: 1000, open: 10, high: 14, low: 8, close: 12, volume: 4 },
  { time: 2000, open: 12, high: 15, low: 11, close: 13, volume: 6 },
  { time: 3000, open: 13, high: 16, low: 10, close: 11, volume: 5 },
];
const config = {
  price: { label: "Observed price", color: "#733bff" },
  volume: { label: "Observed volume", color: "#888" },
} satisfies SeriesConfig;
export function CandlestickSelectionHost() {
  const params = new URLSearchParams(location.search);
  const [data, setData] = useState(params.has("initial-empty") ? [] : observations);
  const [defaultSelection, setDefaultSelection] = useState<CandlestickTime>(
    params.has("missing-default") ? 4000 : 2000,
  );
  const [changes, setChanges] = useState<(CandlestickTime | null)[]>([]);
  return (
    <main style={{ maxWidth: 700 }}>
      <h1>Candlestick selection and focus transitions</h1>
      <button type="button" onClick={() => setData(observations)}>
        Load observations
      </button>
      <button type="button" onClick={() => setData([])}>
        Empty observations
      </button>
      <button type="button" onClick={() => setDefaultSelection(3000)}>
        Change default selection
      </button>
      <output aria-label="Selection callbacks">{JSON.stringify(changes)}</output>
      <CandlestickChart
        config={config}
        data={data}
        timeMode="epoch-ms"
        height={360}
        aria-label="Selection contract"
        defaultSelection={defaultSelection}
        onSelectionChange={(point) => setChanges((old) => [...old, point?.time ?? null])}
        animate={
          params.has("motion")
            ? {
                revealDurationMs: 0,
                hoverTransition: { type: "tween", duration: 1, ease: "linear" },
              }
            : false
        }
        interaction={{ kind: "series", mode: "focus", eligibleKeys: ["price", "volume"] }}
      >
        <CandlestickChart.XAxis />
        <CandlestickChart.YAxis />
        <CandlestickChart.Series seriesKey="price" />
        <CandlestickChart.Volume seriesKey="volume" axisProps={{ hide: true }} />
        <CandlestickChart.Content>
          {(point, selected) =>
            `Inspected ${point?.time ?? "None"}; selected ${selected?.time ?? "None"}`
          }
        </CandlestickChart.Content>
        <CandlestickChart.DataTable caption="Selection observations" />
      </CandlestickChart>
    </main>
  );
}
