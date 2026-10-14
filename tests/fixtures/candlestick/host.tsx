import {
  CandlestickChart,
  type CandlestickDatum,
  type CandlestickSpacing,
  type CandlestickTime,
  type CandlestickViewport,
} from "@kind-ui/charts";
import { motion } from "motion/react";
import { type ComponentProps, type MouseEvent, useCallback, useState } from "react";

type Row = CandlestickDatum & { source: string };
function CustomVolumeElement({ width = 900 }: { width?: number }) {
  return <rect data-custom-volume="element" x={0} y={0} width={width} height={900} fill="orange" />;
}
function CenteredVolumeElement({
  x,
  y,
  width,
  height,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  return (
    <rect data-custom-volume="centered" x={x} y={y} width={width} height={height} fill="orange" />
  );
}
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
const entranceOptions = { revealDurationMs: 10000 };
const viewportOptions = { revealDurationMs: 0 };
let historyPaints = 0;
const historyTimeFormatter = (time: CandlestickTime) => String(time);
const historyPaintBrushProps: NonNullable<
  ComponentProps<typeof CandlestickChart.HistoryNavigator>["brushProps"]
> = {
  traveller: (geometry) => {
    document.documentElement.dataset.historyPaints = String(++historyPaints);
    return <rect {...geometry} />;
  },
};
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
  const [revealEnabled, setRevealEnabled] = useState(
    params.has("animate") && !params.has("deferred-animate"),
  );
  const [bounded, setBounded] = useState(false);
  const [follow, setFollow] = useState(false);
  const [defaultRange, setDefaultRange] = useState<CandlestickViewport>({ from: 0.5, to: 3.5 });
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
  const [overlayClick, setOverlayClick] = useState("None");
  const [inspection, setInspection] = useState<CandlestickTime | null>(null);
  const [windowChanges, setWindowChanges] = useState(0);
  const [cancelEvents, setCancelEvents] = useState<string[]>([]);
  const [logarithmic, setLogarithmic] = useState(params.get("overlay-invalid") === "log");
  const [veto, setVeto] = useState(false);
  const [vetoClick, setVetoClick] = useState(false);
  const ref = useCallback((node: SVGSVGElement | null) => {
    if (node) node.dataset.hostRef = "yes";
  }, []);
  return (
    <main style={{ maxWidth: small ? 300 : 700 }}>
      <h1>OHLC public contract</h1>
      {params.has("current-price") &&
        ["Up", "Down", "Neutral"].map((movement) => (
          <button
            type="button"
            key={movement}
            onClick={() =>
              setRows((current) =>
                current.map((row, index) =>
                  !row.gap && index === current.length - 1
                    ? {
                        ...row,
                        close: movement === "Up" ? 113 : movement === "Down" ? 100 : 102,
                        high: 119,
                        low: 94,
                      }
                    : row,
                ),
              )
            }
          >
            Latest {movement}
          </button>
        ))}
      {params.has("deferred-animate") && (
        <button type="button" onClick={() => setRevealEnabled(true)}>
          Start reveal
        </button>
      )}
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
      {params.has("navigation") && (
        <button
          type="button"
          onClick={() =>
            setRows((current) => {
              const date = new Date(String(current.at(-1)?.time ?? "2026-03-11"));
              date.setUTCDate(date.getUTCDate() + 1);
              return [
                ...current,
                {
                  time: date.toISOString().slice(0, 10),
                  open: 119,
                  low: 115,
                  high: 125,
                  close: 122,
                  volume: 12,
                  source: "Trade OHLC",
                },
              ];
            })
          }
        >
          Append next observation
        </button>
      )}
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
      {params.has("pending-default") && (
        <button type="button" onClick={() => setDefaultRange({ from: 2.5, to: 3.5 })}>
          Change default window
        </button>
      )}
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
      {params.has("overlay-focus") && <output aria-label="Overlay click">{overlayClick}</output>}
      <output aria-label="Selected time">{selected ?? "None"}</output>
      {params.has("navigation") && (
        <>
          <output aria-label="Inspection">{inspection ?? "None"}</output>
          <output aria-label="Window changes">{windowChanges}</output>
          {params.has("navigation-cancel") && (
            <output aria-label="Navigator cancel events">{cancelEvents.join(",")}</output>
          )}
        </>
      )}
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
          ...(params.has("overlay-focus")
            ? { overlay: { label: "Close overlay", color: "#a67738" } }
            : {}),
        }}
        data={rows}
        {...(params.has("legend-top") ? { legendPosition: "top" } : {})}
        overscan={params.has("no-overscan") ? 0 : 1}
        {...(params.has("focus")
          ? {
              interaction: {
                kind: "series" as const,
                mode: "focus" as const,
                eligibleKeys: params.has("overlay-focus")
                  ? ["price", "volume", "overlay"]
                  : ["price", "volume"],
              },
            }
          : {})}
        {...(params.get("overlay-invalid") === "bounds" ? { priceBounds: [90, 125] as const } : {})}
        timeMode="business-date"
        spacing={spacing}
        priceScale={logarithmic ? "log" : "linear"}
        followLatest={follow}
        {...(params.has("pending-default") ? { defaultViewport: defaultRange } : { viewport })}
        onViewportChange={(range, details) => {
          if (params.has("navigation")) setWindowChanges((count) => count + 1);
          setViewport(range);
          setReason(details.reason);
        }}
        {...(params.has("navigation")
          ? { onInspect: (point) => setInspection(point?.time ?? null) }
          : {})}
        selection={selected}
        onSelectionChange={(point) => setSelected(point?.time ?? null)}
        {...(params.has("current-price") && !bounded
          ? { priceDomain: [90, 130] as const }
          : bounded
            ? { priceDomain: [95, 110] as const }
            : {})}
        loading={loading}
        animate={
          params.has("viewport-motion") ? viewportOptions : revealEnabled ? entranceOptions : false
        }
        height={360}
        ref={ref}
        aria-label="Session trade OHLC"
        formatTime={params.has("history-paints") ? historyTimeFormatter : (time) => String(time)}
        formatPrice={(price) => `${price.toFixed(2)} USD`}
        formatVolume={(volume) => `${volume} contracts`}
      >
        {params.has("navigation") && (
          <CandlestickChart.Controls
            zoomInProps={{
              onClick: (event) => {
                if (params.has("controls-veto")) event.preventDefault();
              },
            }}
          />
        )}
        {params.has("navigation") && (
          <CandlestickChart.HistoryNavigator
            {...(params.has("history-paints") ? { brushProps: historyPaintBrushProps } : {})}
            {...(params.has("navigation-cancel")
              ? {
                  onTouchCancelCapture: (event) => {
                    setCancelEvents((events) => [...events, "fieldset capture"]);
                    if (params.has("cancel-capture-stop")) event.stopPropagation();
                    if (params.has("cancel-capture-throw"))
                      throw new Error("Consumer touchcancel error");
                  },
                  onTouchCancel: () => setCancelEvents((events) => [...events, "fieldset bubble"]),
                  brushProps: {
                    traveller: (geometry) => (
                      <rect
                        {...geometry}
                        data-cancel-traveller=""
                        onTouchCancelCapture={(event) => {
                          setCancelEvents((events) => [...events, "traveller capture"]);
                          if (params.has("cancel-traveller-capture-stop")) event.stopPropagation();
                        }}
                        onTouchCancel={(event) => {
                          setCancelEvents((events) => [...events, "traveller bubble"]);
                          if (params.has("cancel-prevent")) event.preventDefault();
                          if (params.has("cancel-stop")) event.stopPropagation();
                          if (params.has("cancel-throw"))
                            throw new Error("Consumer touchcancel error");
                        }}
                      />
                    ),
                  },
                }
              : {})}
          />
        )}
        <CandlestickChart.Grid />
        <CandlestickChart.XAxis
          {...(params.has("mirror-x") ? { mirror: true } : {})}
          {...(params.has("reversed-x") ? { reversed: true } : {})}
          {...(params.has("padded-x") ? { padding: { left: 72, right: 40 } } : {})}
          {...(params.has("explicit-ticks") ? { ticks: [1.5, 3.5], interval: 0 } : {})}
        />
        <CandlestickChart.YAxis
          {...(params.has("current-price") ? { orientation: "right", width: 96 } : {})}
        />
        <CandlestickChart.Series seriesKey="price" />
        <CandlestickChart.Volume
          seriesKey="volume"
          {...(params.has("volume-paint") ? { fill: "purple", fillOpacity: 0.7 } : {})}
          {...(params.has("subpixel-volume") ? { maxBarSize: 0.5 } : {})}
          {...(params.has("centered-volume")
            ? {
                shape:
                  params.get("centered-volume") === "element" ? (
                    <CenteredVolumeElement />
                  ) : params.get("centered-volume") === "object" ? (
                    { fill: "orange" }
                  ) : params.get("centered-volume") === "false" ? (
                    false
                  ) : (
                    (native: { x: number; y: number; width: number; height: number }) => (
                      <CenteredVolumeElement {...native} />
                    )
                  ),
              }
            : params.has("custom-volume")
              ? {
                  shape:
                    params.get("custom-volume") === "element" ? (
                      <CustomVolumeElement width={900} />
                    ) : params.get("custom-volume") === "object" ? (
                      {
                        x: 0,
                        y: 0,
                        width: 900,
                        height: 900,
                        fill: "orange",
                        className: "custom-volume-object",
                      }
                    ) : params.get("custom-volume") === "false" ? (
                      false
                    ) : (
                      () => (
                        <rect
                          data-custom-volume="function"
                          x={0}
                          y={0}
                          width={900}
                          height={900}
                          fill="orange"
                        />
                      )
                    ),
                }
              : {})}
        />
        {params.has("current-price") && <CandlestickChart.CurrentPrice seriesKey="price" />}
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
          seriesKey={params.has("overlay-focus") ? "overlay" : "price"}
          hide={params.has("overlay-hidden")}
          {...(params.has("overlay-focus")
            ? {
                onClick: (...args) => {
                  // Native Curve supplies (props, event), despite Line's item-event declaration.
                  const event = args.at(-1) as MouseEvent<SVGElement>;
                  setOverlayClick(`${args.length}:${event.type}:${event.button}`);
                  if (params.has("overlay-veto")) event.preventDefault();
                },
              }
            : {})}
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
