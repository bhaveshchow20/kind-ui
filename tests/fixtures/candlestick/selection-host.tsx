import {
  CandlestickChart,
  type CandlestickRecord,
  type CandlestickTime,
  type SeriesConfig,
} from "@kind-ui/charts";
import { useCallback, useRef, useState } from "react";

const observations: CandlestickRecord[] = [
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
  const [loading, setLoading] = useState(false);
  const contentRenders = useRef(0);
  const [showLabels, setShowLabels] = useState(true);
  const labelRef = useRef<SVGTextElement>(null);
  const consumerLabelRef = useCallback((node: SVGTextElement | null) => {
    if (!node) return;
    node.dataset.consumerRef = "attached";
    return () => {
      node.dataset.consumerCleaned = "true";
    };
  }, []);
  const [labelRefValue, setLabelRefValue] = useState("");
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
      {params.has("default-readout") && (
        <button
          type="button"
          onClick={() =>
            setData((old) =>
              old.map((row) =>
                row.time === 3000 && !row.gap
                  ? { ...row, close: row.close + 1, high: Math.max(row.high, row.close + 1) }
                  : row,
              ),
            )
          }
        >
          Update latest
        </button>
      )}
      <output aria-label="Selection callbacks">{JSON.stringify(changes)}</output>
      <button type="button" onClick={() => setLoading((old) => !old)}>
        Toggle loading
      </button>
      {params.has("label-ref") && (
        <>
          <button type="button" onClick={() => setShowLabels((old) => !old)}>
            Toggle crosshair labels
          </button>
          <button
            type="button"
            onClick={() => setLabelRefValue(labelRef.current?.textContent ?? "None")}
          >
            Read label ref
          </button>
          <output aria-label="Consumer label ref">{labelRefValue}</output>
        </>
      )}
      <CandlestickChart
        config={config}
        data={data}
        timeMode="epoch-ms"
        height={360}
        aria-label="Selection contract"
        defaultSelection={defaultSelection}
        onSelectionChange={(point) => setChanges((old) => [...old, point?.time ?? null])}
        loading={loading}
        spacing={params.has("elapsed") ? "elapsed" : "ordinal"}
        priceScale={params.has("log") ? "log" : "linear"}
        {...(params.has("axis-markers")
          ? { formatPrice: (value: number) => value.toFixed(2) }
          : {})}
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
        <CandlestickChart.XAxis
          reversed={params.has("reversed")}
          padding={params.has("padding") ? { left: 40, right: 70 } : {}}
        />
        <CandlestickChart.YAxis
          {...(params.has("axis-markers") ? { orientation: "right" as const, width: 76 } : {})}
        />
        <CandlestickChart.Series seriesKey="price" />
        <CandlestickChart.Volume seriesKey="volume" axisProps={{ hide: true }} />
        {params.has("crosshair-contract") && (
          <CandlestickChart.Crosshair
            {...(params.has("snap") ? { mode: "snap" as const } : {})}
            showLabels={showLabels}
            {...(params.has("label-ref")
              ? { labelProps: { ref: params.has("object-ref") ? labelRef : consumerLabelRef } }
              : {})}
          />
        )}
        {params.has("default-readout") ? (
          <>
            <CandlestickChart.Content>
              <span data-consumer-slot>Consumer summary</span>
            </CandlestickChart.Content>
            <CandlestickChart.Readout valueAnimation="shuffle" data-testid="default-readout" />
            {!params.has("omit-tooltip") && (
              <CandlestickChart.Tooltip valueAnimation="shuffle" data-testid="financial-tooltip" />
            )}
            <CandlestickChart.CurrentPrice seriesKey="price" />
          </>
        ) : (
          <>
            {" "}
            <CandlestickChart.Readout>
              {(point, selected) => (
                <span
                  data-content-render={++contentRenders.current}
                >{`Inspected ${point?.time ?? "None"}; selected ${selected?.time ?? "None"}`}</span>
              )}
            </CandlestickChart.Readout>
          </>
        )}
        <CandlestickChart.Table caption="Selection observations" />
      </CandlestickChart>
    </main>
  );
}
