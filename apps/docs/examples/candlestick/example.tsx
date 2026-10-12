"use client";
import {
  CandlestickChart,
  CandlestickContent,
  CandlestickCrosshair,
  CandlestickGrid,
  CandlestickSeries,
  type CandlestickViewport,
  CandlestickVolume,
  CandlestickXAxis,
  CandlestickYAxis,
  type SeriesConfig,
} from "@kind-ui/charts";
import { useState } from "react";

// Original simulated daily trade OHLC; prices are USD and volume is shares.
const data = [
  { time: "2026-09-21", open: 118.2, high: 121.6, low: 117.4, close: 120.8, volume: 18400 },
  { time: "2026-09-22", open: 120.8, high: 123.1, low: 119.9, close: 122.4, volume: 21900 },
  { time: "2026-09-23", open: 122.4, high: 123.7, low: 120.5, close: 121.1, volume: 16700 },
  { time: "2026-09-24", open: 121.1, high: 124.8, low: 120.7, close: 124.2, volume: 25300 },
  { time: "2026-09-25", open: 124.2, high: 125.6, low: 122.1, close: 123.5, volume: 20800 },
  { time: "2026-09-28", open: 123.5, high: 126.9, low: 122.8, close: 126.1, volume: 28600 },
  { time: "2026-09-29", open: 126.1, high: 127.4, low: 123.9, close: 125.2, volume: 19300 },
  { time: "2026-09-30", open: 125.2, high: 126.2, low: 123.4, close: 125.2, volume: 17600 },
  { time: "2026-10-01", open: 125.2, high: 129.3, low: 124.6, close: 128.4, volume: 31200 },
  { time: "2026-10-02", open: 128.4, high: 130.8, low: 127.7, close: 130.1, volume: 27900 },
  { time: "2026-10-05", open: 130.1, high: 131.4, low: 128.2, close: 129.3, volume: 23400 },
  { time: "2026-10-06", open: 129.3, high: 132.2, low: 128.8, close: 131.5, volume: 29800 },
];
const config = {
  price: { label: "Trade OHLC (USD)", color: "#733bff" },
  volume: { label: "Volume (shares)", color: "#733bff" },
} satisfies SeriesConfig;
const money = (value: number) => `$${value.toFixed(2)}`;

export function AssetCandlestickChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  const [viewport, setViewport] = useState<CandlestickViewport>({ from: -0.5, to: 11.5 });
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 12 }}>Simulated asset · Daily trade OHLC · USD / shares</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setViewport({ from: 5.5, to: 11.5 })}>
            6 sessions
          </button>
          <button type="button" onClick={() => setViewport({ from: -0.5, to: 11.5 })}>
            All sessions
          </button>
        </div>
      </div>
      <CandlestickChart
        config={config}
        data={data}
        timeMode="business-date"
        spacing="ordinal"
        viewport={viewport}
        onViewportChange={setViewport}
        height={320}
        loading={state === "loading"}
        loadingLabel="Loading simulated asset observations"
        aria-label="Simulated daily trade OHLC in US dollars with share volume"
        formatTime={(time) => String(time).slice(5)}
        formatPrice={money}
        formatVolume={(value) => `${value.toLocaleString("en-US")} shares`}
        margin={{ top: 12, right: 8, bottom: 4, left: 0 }}
      >
        <CandlestickGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="currentColor"
          strokeOpacity={0.12}
        />
        <CandlestickXAxis axisLine={false} tickLine={false} tickMargin={10} minTickGap={24} />
        <CandlestickYAxis orientation="right" axisLine={false} tickLine={false} width={72} />
        <CandlestickSeries
          seriesKey="price"
          rising="#15803d"
          falling="#be123c"
          unchanged="#733bff"
          maxBarSize={18}
        />
        <CandlestickVolume seriesKey="volume" fill="#733bff" axisProps={{ hide: true }} />
        <CandlestickCrosshair strokeOpacity={0.5} />
        <CandlestickContent
          frameProps={{ style: { minHeight: 36, fontSize: 12, paddingTop: 12 } }}
        />
      </CandlestickChart>
    </div>
  );
}
