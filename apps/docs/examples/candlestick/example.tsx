"use client";
import { CandlestickChart, type SeriesConfig } from "@kind-ui/charts";
import { memo, useEffect, useReducer, useState } from "react";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  state: "final" | "partial";
};
const buttonStyle = {
  border: "1px solid var(--border, #dfe2e8)",
  borderRadius: 8,
  padding: "5px 10px",
  font: "inherit",
  fontSize: 12,
  background: "transparent",
  color: "inherit",
};
const round = (value: number) => Math.round(value * 100) / 100;
const start = Date.UTC(2026, 9, 13, 8);
function history(): Candle[] {
  let close = 2360;
  let seed = 721;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: 240 }, (_, index) => {
    const open = close;
    const move = (random() - 0.5) * 3.8 + Math.sin(index * 0.73) * 0.3;
    close = Math.max(1, round(open + move));
    return {
      time: start + index * 60_000,
      open,
      high: round(Math.max(open, close) + 0.3 + random() * 1.8),
      low: Math.max(0.01, round(Math.min(open, close) - 0.3 - random() * 1.6)),
      close,
      volume: round(40 + Math.abs(move) * 24 + random() * 85),
      state: index === 239 ? "partial" : "final",
    };
  });
}
type Feed = { rows: Candle[]; tick: number };
function advance(feed: Feed): Feed {
  const latest = feed.rows.at(-1);
  if (!latest) return feed;
  const tick = feed.tick + 1;
  const close = Math.max(
    1,
    round(latest.close + Math.sin(tick * 2.17) * 0.7 + Math.cos(tick * 0.91) * 0.4),
  );
  if (tick % 8 === 0)
    return {
      tick,
      rows: [
        ...feed.rows.slice(0, -1),
        { ...latest, state: "final" },
        {
          time: latest.time + 60_000,
          open: latest.close,
          high: Math.max(latest.close, close),
          low: Math.min(latest.close, close),
          close,
          volume: 8.4,
          state: "partial",
        },
      ],
    };
  return {
    tick,
    rows: [
      ...feed.rows.slice(0, -1),
      {
        ...latest,
        close,
        high: Math.max(latest.high, close),
        low: Math.min(latest.low, close),
        volume: round(latest.volume + 4 + Math.abs(Math.sin(tick * 2.17)) * 19),
      },
    ],
  };
}
const config = {
  price: { label: "ETH / USD", color: "#15803d" },
  volume: { label: "Volume (ETH)", color: "#64748b" },
} satisfies SeriesConfig;
const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const money = (value: number) => priceFormatter.format(value);
const time = (value: number | string) => timeFormatter.format(new Date(Number(value)));

const MarketPlot = memo(function MarketPlot({
  rows,
  loading,
}: {
  rows: Candle[];
  loading: boolean;
}) {
  return (
    <CandlestickChart<Candle>
      config={config}
      data={rows}
      timeMode="epoch-ms"
      defaultViewport={{ from: 189.5, to: 239.5 }}
      followLatest
      legendPosition="top"
      height={340}
      loading={loading}
      loadingLabel="Loading simulated ETH / USD history"
      aria-label="Simulated ETH / USD one minute candles with volume and historical navigator"
      formatTime={time}
      formatPrice={money}
      formatVolume={(value) => `${value.toFixed(1)} ETH`}
      animate
      margin={{ top: 12, right: 8, bottom: 4, left: 0 }}
    >
      <CandlestickChart.Grid
        vertical={false}
        strokeDasharray="3 3"
        stroke="currentColor"
        strokeOpacity={0.1}
      />
      <CandlestickChart.XAxis axisLine={false} tickLine={false} tickMargin={10} minTickGap={32} />
      <CandlestickChart.YAxis orientation="right" axisLine={false} tickLine={false} width={76} />
      <CandlestickChart.Series seriesKey="price" maxBarSize={12} />
      <CandlestickChart.Volume seriesKey="volume" fillOpacity={0.78} axisProps={{ hide: true }} />
      <CandlestickChart.CurrentPrice
        labelTextColor="var(--candlestick-label-text, #fff)"
        seriesKey="price"
      />
      <CandlestickChart.Crosshair strokeOpacity={0.5} />
      <CandlestickChart.Readout valueAnimation="shuffle" className="mb-3" />
      <CandlestickChart.Controls />
      <CandlestickChart.HistoryNavigator />
    </CandlestickChart>
  );
});

export function AssetCandlestickChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  const [feed, step] = useReducer(advance, undefined, () => ({ rows: history(), tick: 0 }));
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running || state === "loading") return;
    const interval = setInterval(step, 700);
    return () => clearInterval(interval);
  }, [running, state]);
  const loading = state === "loading";
  return (
    <div style={{ minWidth: 0 }}>
      {!loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <strong style={{ fontSize: 14 }}>ETH / USD · 1m</strong>
            <span
              style={{
                border: "1px solid var(--border, #dfe2e8)",
                borderRadius: 5,
                padding: "2px 6px",
                fontSize: 10,
                color: "var(--muted-foreground)",
              }}
            >
              SIMULATED
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={buttonStyle} type="button" onClick={() => setRunning(!running)}>
              {running ? "Pause" : "Resume"}
            </button>
            <button
              style={buttonStyle}
              type="button"
              onClick={() => {
                setRunning(false);
                step();
              }}
            >
              Step
            </button>
          </div>
        </div>
      )}
      <MarketPlot rows={feed.rows} loading={loading} />
    </div>
  );
}
