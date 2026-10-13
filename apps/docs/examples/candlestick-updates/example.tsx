"use client";
import {
  CandlestickChart,
  CandlestickContent,
  CandlestickCrosshair,
  CandlestickDataTable,
  type CandlestickDatum,
  CandlestickGrid,
  CandlestickOverlay,
  CandlestickSeries,
  CandlestickXAxis,
  CandlestickYAxis,
  type SeriesConfig,
} from "@kind-ui/charts";
import { useState } from "react";

const buttonStyle = {
  border: "1px solid var(--border, #dfe2e8)",
  borderRadius: 8,
  padding: "5px 10px",
  font: "inherit",
  fontSize: 12,
  background: "transparent",
  color: "inherit",
};

type Observation = CandlestickDatum & { source: string; reference?: number };
// Original simulated trade observations; UTC intervals, USD prices, no volume feed.
const data: Observation[] = [
  {
    time: 1791280800000,
    open: 72,
    high: 75,
    low: 71,
    close: 74,
    state: "final",
    source: "Trade OHLC",
    reference: 73,
  },
  {
    time: 1791284400000,
    open: 74,
    high: 76,
    low: 72,
    close: 73,
    state: "final",
    source: "Trade OHLC",
    reference: 74,
  },
  { time: 1791288000000, gap: true, state: "Feed unavailable", source: "Explicit gap" },
  {
    time: 1791291600000,
    open: 73,
    high: 76,
    low: 72,
    close: 75,
    state: "final",
    source: "Trade OHLC",
    reference: 74,
  },
  {
    time: 1791295200000,
    open: 75,
    high: 79,
    low: 74,
    close: 78,
    state: "partial",
    source: "Trade OHLC",
    reference: 76,
  },
];
const config = {
  price: { label: "Trade OHLC (USD)", color: "#733bff" },
  reference: { label: "Caller-supplied reference (USD)", color: "#888" },
} satisfies SeriesConfig;
const money = (value: number) => `$${value.toFixed(2)}`;
const time = (value: number | string) =>
  new Date(Number(value)).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

export function UpdatedCandlestickChart() {
  const [observations, setObservations] = useState<Observation[]>(data);
  const [replaced, setReplaced] = useState(false);
  const [corrected, setCorrected] = useState(false);
  const [appended, setAppended] = useState(false);
  const [prepended, setPrepended] = useState(false);
  const replaceCurrent = () => {
    setObservations((rows) =>
      rows.map((row) =>
        !row.gap && row.time === 1791295200000
          ? { ...row, high: 80, close: 79, state: "partial replacement" }
          : row,
      ),
    );
    setReplaced(true);
  };
  const correctOlder = () => {
    setObservations((rows) =>
      rows.map((row) =>
        !row.gap && row.time === 1791280800000 ? { ...row, low: 70, state: "corrected" } : row,
      ),
    );
    setCorrected(true);
  };
  const append = () => {
    setObservations((rows) => [
      ...rows.map((row) => (row.time === 1791295200000 ? { ...row, state: "final" } : row)),
      {
        time: 1791298800000,
        open: 79,
        high: 81,
        low: 78,
        close: 80,
        state: "partial",
        source: "Trade OHLC",
        reference: 78,
      },
    ]);
    setAppended(true);
  };
  const prepend = () => {
    setObservations((rows) => [
      {
        time: 1791277200000,
        open: 71,
        high: 73,
        low: 70,
        close: 72,
        state: "final",
        source: "Trade OHLC",
        reference: 72,
      },
      ...rows,
    ]);
    setPrepended(true);
  };
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ marginBottom: 16, fontSize: 12 }}>
        Simulated trade feed · USD · UTC · Missing volume stays missing
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          style={buttonStyle}
          type="button"
          disabled={replaced || appended}
          onClick={replaceCurrent}
        >
          Replace current
        </button>
        <button style={buttonStyle} type="button" disabled={corrected} onClick={correctOlder}>
          Correct older
        </button>
        <button style={buttonStyle} type="button" disabled={appended} onClick={append}>
          Append
        </button>
        <button style={buttonStyle} type="button" disabled={prepended} onClick={prepend}>
          Prepend
        </button>
      </div>
      <CandlestickChart<Observation>
        config={config}
        data={observations}
        timeMode="epoch-ms"
        spacing="elapsed"
        height={280}
        aria-label="Simulated trade OHLC with immutable live update controls and one explicit feed gap"
        formatTime={time}
        formatPrice={money}
        defaultViewport={{ from: -0.5, to: 4.5 }}
        followLatest
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
        <CandlestickSeries<Observation>
          seriesKey="price"
          rising="var(--candlestick-rising, #087f68)"
          falling="var(--candlestick-falling, #c43d54)"
          unchanged="var(--candlestick-neutral, #53657b)"
          maxBarSize={22}
        />
        <CandlestickOverlay<Observation>
          seriesKey="reference"
          dataKey="reference"
          strokeDasharray="4 4"
          includeInDomain
          connectNulls={false}
        />
        <CandlestickCrosshair strokeOpacity={0.5} />
        <CandlestickContent<Observation>
          frameProps={{ style: { minHeight: 36, fontSize: 12, paddingTop: 12 } }}
        >
          {(point, selected) =>
            point
              ? `${time(point.time)} UTC · ${point.original.source} · ${point.state}${point.gap ? "" : ` · Close ${money(point.close ?? 0)}`}${selected?.identity === point.identity ? " · Selected" : ""}`
              : "Inspect the corrected interval, the feed gap or the partial latest candle; Enter selects."
          }
        </CandlestickContent>
        <CandlestickDataTable<Observation>
          caption="Current observations"
          renderMetadata={(point) => point.original.source}
          metadataLabel="Source"
          style={{ width: "100%", fontSize: 12, marginTop: 12 }}
        />
      </CandlestickChart>
    </div>
  );
}
