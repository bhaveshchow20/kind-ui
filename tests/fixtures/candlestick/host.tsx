import {
  CandlestickChart,
  type CandlestickDatum,
  type CandlestickSpacing,
  type CandlestickTime,
  type CandlestickViewport,
} from "@kind-ui/charts";
import { motion } from "motion/react";
import { useCallback, useState } from "react";

type Row = CandlestickDatum & { source: string };
const initial: Row[] = [
  {
    time: "2026-03-05",
    open: 100,
    high: 116,
    low: 94,
    close: 108,
    volume: 12,
    source: "Trade OHLC",
  },
  { time: "2026-03-06", open: 108, high: 112, low: 92, close: 98, volume: 0, source: "Trade OHLC" },
  { time: "2026-03-09", gap: true, source: "Explicit missing bucket" },
  { time: "2026-03-10", open: 102, high: 111, low: 96, close: 102, source: "Trade OHLC" },
  {
    time: "2026-03-11",
    open: 102,
    high: 114,
    low: 99,
    close: 112,
    volume: 8,
    state: "partial",
    source: "Trade OHLC",
  },
];
const params = new URLSearchParams(location.search);
const volumeRows: Row[] = initial.map((row, index) =>
  row.gap ? row : { ...row, volume: index === 0 || index === 4 ? 1e9 : index === 1 ? 200 : 100 },
);
export function CandlestickHost() {
  const [rows, setRows] = useState<Row[]>(
    params.has("initial-empty") ? [] : params.has("overscan-volume") ? volumeRows : initial,
  );
  const [spacing, setSpacing] = useState<CandlestickSpacing>("ordinal");
  const [small, setSmall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bounded, setBounded] = useState(false);
  const [follow, setFollow] = useState(false);
  const [viewport, setViewport] = useState<CandlestickViewport>(
    new URLSearchParams(location.search).has("initial-empty")
      ? { from: 0.5, to: 3.5 }
      : params.has("one-candle")
        ? { from: -0.5, to: 0.5 }
        : params.has("overscan-volume") || params.has("overlay-invalid")
          ? { from: 0.5, to: 3.5 }
          : { from: -0.5, to: 4.5 },
  );
  const [selected, setSelected] = useState<CandlestickTime | null>(null);
  const [reason, setReason] = useState("initial");
  const [logarithmic, setLogarithmic] = useState(params.get("overlay-invalid") === "log");
  const [veto, setVeto] = useState(false);
  const [vetoClick, setVetoClick] = useState(false);
  const ref = useCallback((node: SVGSVGElement | null) => {
    if (node) node.dataset.hostRef = "yes";
  }, []);
  return (
    <main style={{ maxWidth: small ? 300 : 700 }}>
      <h1>OHLC public contract</h1>
      <button
        type="button"
        onClick={() => setSpacing(spacing === "ordinal" ? "elapsed" : "ordinal")}
      >
        Spacing
      </button>
      <button type="button" onClick={() => setSmall(!small)}>
        Resize
      </button>
      <button type="button" onClick={() => setLoading(!loading)}>
        Loading
      </button>
      <button type="button" onClick={() => setBounded(!bounded)}>
        Fixed domain
      </button>
      <button type="button" onClick={() => setFollow(!follow)}>
        Follow latest
      </button>
      <button
        type="button"
        onClick={() =>
          setRows(
            rows.map((row) =>
              !row.gap && row.time === "2026-03-11"
                ? { ...row, close: 113, high: 119, state: "final" }
                : row,
            ),
          )
        }
      >
        Replace
      </button>
      <button
        type="button"
        onClick={() =>
          setRows(
            rows.map((row) => (!row.gap && row.time === "2026-03-05" ? { ...row, low: 88 } : row)),
          )
        }
      >
        Correct
      </button>
      <button
        type="button"
        onClick={() =>
          setRows(
            rows[0]?.time === "2026-03-04"
              ? rows
              : [
                  {
                    time: "2026-03-04",
                    open: 95,
                    low: 91,
                    high: 102,
                    close: 100,
                    volume: 4,
                    source: "Trade OHLC",
                  },
                  ...rows,
                ],
          )
        }
      >
        Prepend
      </button>
      <button
        type="button"
        onClick={() =>
          setRows(
            rows.at(-1)?.time === "2026-03-12"
              ? rows
              : [
                  ...rows,
                  {
                    time: "2026-03-12",
                    open: 113,
                    low: 110,
                    high: 123,
                    close: 119,
                    volume: 10,
                    source: "Trade OHLC",
                  },
                ],
          )
        }
      >
        Append
      </button>
      <button type="button" onClick={() => setLogarithmic(!logarithmic)}>
        Log scale
      </button>
      <button
        type="button"
        onClick={() =>
          setRows(
            Array.from({ length: 5000 }, (_, index) => ({
              time: new Date(Date.UTC(2000, 0, index + 1)).toISOString().slice(0, 10),
              open: 100 + index / 100,
              low: 96 + index / 100,
              high: 112 + index / 100,
              close: 108 + index / 100,
              volume: index % 30,
              source: "Dense OHLC",
            })),
          )
        }
      >
        Dense history
      </button>
      <button type="button" onClick={() => setRows(rows.filter((row) => row.time !== selected))}>
        Remove selection
      </button>
      <button type="button" onClick={() => setVeto(!veto)}>
        Veto pointer-up
      </button>
      <button type="button" onClick={() => setVetoClick(!vetoClick)}>
        Veto click
      </button>
      <button
        type="button"
        onClick={() => {
          setRows([
            { time: "2026-03-04", open: 95, low: 91, high: 102, close: 100, source: "Trade OHLC" },
            ...rows,
          ]);
          setViewport({ from: viewport.from + 1, to: viewport.to + 1 });
        }}
      >
        Atomic prepend
      </button>
      <button type="button" onClick={() => setViewport({ from: 2.5, to: 3.5 })}>
        One record window
      </button>
      <output aria-label="Observation count">{rows.length}</output>
      <button type="button" onClick={() => setRows(initial)}>
        Load observations
      </button>
      <button type="button" onClick={() => setRows([])}>
        Empty
      </button>
      <button type="button" onClick={() => setViewport({ from: 0.5, to: 3.5 })}>
        History window
      </button>
      <button type="button" onClick={() => setViewport({ from: -0.5, to: rows.length - 0.5 })}>
        Fit window
      </button>
      <output aria-label="Window">
        {viewport.from},{viewport.to}
      </output>
      <output aria-label="Reason">{reason}</output>
      <output aria-label="Selected time">{selected ?? "None"}</output>
      <CandlestickChart
        frameProps={{
          onPointerUp: (event) => {
            if (veto) event.preventDefault();
          },
          onClick: (event) => {
            if (vetoClick) event.preventDefault();
          },
        }}
        config={{
          price: { label: "Price", color: "#427b67" },
          volume: { label: "Volume", color: "#849c96" },
        }}
        data={rows}
        overscan={params.has("no-overscan") ? 0 : 1}
        {...(params.has("focus")
          ? {
              interaction: {
                kind: "series" as const,
                mode: "focus" as const,
                eligibleKeys: ["price", "volume"],
              },
            }
          : {})}
        {...(params.get("overlay-invalid") === "bounds" ? { priceBounds: [90, 125] as const } : {})}
        timeMode="business-date"
        spacing={spacing}
        priceScale={logarithmic ? "log" : "linear"}
        followLatest={follow}
        viewport={viewport}
        onViewportChange={(range, details) => {
          setViewport(range);
          setReason(details.reason);
        }}
        selection={selected}
        onSelectionChange={(point) => setSelected(point?.time ?? null)}
        {...(bounded ? { priceDomain: [95, 110] as const } : {})}
        loading={loading}
        animate={
          new URLSearchParams(location.search).has("animate") ? { revealDurationMs: 10000 } : false
        }
        height={360}
        ref={ref}
        aria-label="Session trade OHLC"
        formatTime={(time) => String(time)}
        formatPrice={(price) => `${price.toFixed(2)} USD`}
        formatVolume={(volume) => `${volume} contracts`}
      >
        <CandlestickChart.Grid />
        <CandlestickChart.XAxis
          {...(params.has("explicit-ticks") ? { ticks: [1.5, 3.5], interval: 0 } : {})}
        />
        <CandlestickChart.YAxis />
        <CandlestickChart.Series seriesKey="price" />
        <CandlestickChart.Volume seriesKey="volume" />
        {[94, 116, 100, 108].map((value) => (
          <CandlestickChart.ReferenceLine
            key={value}
            y={value}
            ifOverflow="visible"
            shape={({ x1, x2, y1, y2 }: { x1: number; x2: number; y1: number; y2: number }) => (
              <line data-oracle-price={value} x1={x1} x2={x2} y1={y1} y2={y2} opacity={0} />
            )}
          />
        ))}
        <CandlestickChart.Overlay<Row>
          seriesKey="price"
          dataKey={(row) => {
            if (row.gap) return null;
            if (params.has("overlay-invalid") && row.time === "2026-03-05") {
              return params.get("overlay-invalid") === "log"
                ? 0
                : params.get("overlay-invalid") === "bounds"
                  ? 140
                  : NaN;
            }
            return row.close;
          }}
          includeInDomain={params.has("overlay-invalid") && !params.has("clip-overlay")}
          stroke="#a67738"
        />
        <CandlestickChart.Crosshair />
        <CandlestickChart.Tooltip />
        {new URLSearchParams(location.search).has("strict-probe") && (
          <CandlestickChart.Content>
            {() => <motion.span>Full consumer Motion probe</motion.span>}
          </CandlestickChart.Content>
        )}
        {rows.length < 100 && (
          <CandlestickChart.DataTable<Row>
            caption="Observed session bars"
            renderMetadata={(point) => point.original.source}
          />
        )}
      </CandlestickChart>
    </main>
  );
}
