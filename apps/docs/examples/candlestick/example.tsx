"use client";
import { CandlestickChart, type CandlestickPoint, type SeriesConfig } from "@kind-ui/charts";
import { memo, useCallback, useEffect, useReducer, useState } from "react";

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
const rising = "var(--candlestick-rising, #087f68)";
const falling = "var(--candlestick-falling, #c43d54)";
const unchanged = "var(--candlestick-neutral, #53657b)";
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
  onInspect,
}: {
  rows: Candle[];
  loading: boolean;
  onInspect: (point: CandlestickPoint<Candle> | null) => void;
}) {
  return (
    <CandlestickChart<Candle>
      config={config}
      data={rows}
      timeMode="epoch-ms"
      spacing="ordinal"
      defaultViewport={{ from: 189.5, to: 239.5 }}
      followLatest
      onInspect={onInspect}
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
      <CandlestickChart.Series
        seriesKey="price"
        rising={rising}
        falling={falling}
        unchanged={unchanged}
        maxBarSize={12}
      />
      <CandlestickChart.Volume
        seriesKey="volume"
        rising={rising}
        falling={falling}
        unchanged={unchanged}
        fillOpacity={0.78}
        axisProps={{ hide: true }}
      />
      <CandlestickChart.CurrentPrice
        labelTextColor="var(--candlestick-label-text, #fff)"
        seriesKey="price"
        rising={rising}
        falling={falling}
        unchanged={unchanged}
      />
      <CandlestickChart.Crosshair strokeOpacity={0.5} />
      <CandlestickChart.Content className="sr-only" />
      <CandlestickChart.Controls />
      <CandlestickChart.HistoryNavigator />
    </CandlestickChart>
  );
});

export function AssetCandlestickChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  const [feed, step] = useReducer(advance, undefined, () => ({ rows: history(), tick: 0 }));
  const [running, setRunning] = useState(true);
  const [inspected, setInspected] = useState<CandlestickPoint<Candle> | null>(null);
  const onInspect = useCallback((point: CandlestickPoint<Candle> | null) => {
    setInspected((current) => (current?.time === point?.time ? current : point));
  }, []);
  useEffect(() => {
    if (!running || state === "loading") return;
    const interval = setInterval(step, 700);
    return () => clearInterval(interval);
  }, [running, state]);
  const candle =
    (inspected ? feed.rows.find((row) => row.time === inspected.time) : null) ?? feed.rows.at(-1);
  const change = candle ? ((candle.close - candle.open) / candle.open) * 100 : 0;
  const direction = change > 0 ? rising : change < 0 ? falling : unchanged;
  return (
    <div style={{ minWidth: 0 }}>
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
          <button
            style={buttonStyle}
            type="button"
            disabled={state === "loading"}
            onClick={() => setRunning(!running)}
          >
            {running ? "Pause" : "Resume"}
          </button>
          <button
            style={buttonStyle}
            type="button"
            disabled={state === "loading"}
            onClick={() => {
              setRunning(false);
              step();
            }}
          >
            Step
          </button>
        </div>
      </div>
      <div
        data-kind-ui="candle-readout"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 12px",
          fontSize: 12,
          fontVariantNumeric: "tabular-nums",
          marginBottom: 12,
          minHeight: 20,
        }}
      >
        {state !== "loading" && candle && (
          <>
            <span>{time(candle.time)} UTC</span>
            {(["open", "high", "low", "close"] as const).map((key) => (
              <span key={key}>
                {key[0]?.toUpperCase()}{" "}
                <span style={{ color: direction }}>{money(candle[key])}</span>
              </span>
            ))}
            <span>Vol {candle.volume.toFixed(1)}</span>
            <span style={{ color: direction }}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          </>
        )}
      </div>
      <MarketPlot rows={feed.rows} loading={state === "loading"} onInspect={onInspect} />
    </div>
  );
}
