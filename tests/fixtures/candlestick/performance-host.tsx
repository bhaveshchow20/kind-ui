import {
  CandlestickChart,
  type CandlestickDatum,
  CandlestickMark,
  type CandlestickSeriesProps,
} from "@kind-ui/charts";
import type { ComponentProps } from "react";

const rows: CandlestickDatum[] = Array.from({ length: 240 }, (_, index) => {
  const open = 2375 + Math.sin(index * 0.14) * 12;
  const close = index === 239 ? 2399 : open + Math.cos(index * 0.4) * 2;
  return {
    time: 1760000000000 + index * 60000,
    open,
    close,
    high: Math.max(open, close) + 1,
    low: Math.min(open, close) - 1,
    volume: 80 + (index % 70),
  };
});
let paints = 0;
const shape: NonNullable<CandlestickSeriesProps["shape"]> = ({
  point: _point,
  native: _native,
  ...props
}) => {
  document.documentElement.dataset.candlePaints = String(++paints);
  return <CandlestickMark {...props} />;
};
const inspect: NonNullable<Parameters<typeof CandlestickChart>[0]["onInspect"]> = (point) => {
  document.documentElement.dataset.inspectedTime = String(point?.time ?? "");
};
const formatPrice = (value: number) => value.toFixed(2);
const config = {
  price: { label: "Price", color: "teal" },
  volume: { label: "Volume", color: "slategray" },
};

function CustomPriceTick({ x, y, textAnchor }: ComponentProps<"text">) {
  return (
    <text x={x} y={y} textAnchor={textAnchor} fill="purple" data-custom-axis-tick="">
      Custom
    </text>
  );
}

export function CandlestickPerformanceHost() {
  const params = new URLSearchParams(location.search);
  const custom = params.has("custom");
  const orientation = params.has("axis-left") ? "left" : "right";
  return (
    <CandlestickChart
      aria-label="Large candle performance"
      data={rows}
      timeMode="epoch-ms"
      config={config}
      width={1000}
      height={600}
      priceDomain={[2350, 2400]}
      formatPrice={formatPrice}
      onInspect={inspect}
      animate={{ revealDurationMs: 0 }}
    >
      <CandlestickChart.XAxis height={30} />
      <CandlestickChart.YAxis
        orientation={orientation}
        width={90}
        tickFormatter={formatPrice}
        {...(params.has("custom-tick")
          ? { tick: <CustomPriceTick /> }
          : params.has("styled-tick")
            ? {
                tick: {
                  fontSize: 18,
                  className: "styled-price-tick",
                  style: { fontWeight: 700, fill: "purple" },
                },
              }
            : {})}
      />
      <CandlestickChart.Series seriesKey="price" {...(custom ? { shape } : {})} />
      <CandlestickChart.Volume seriesKey="volume" axisProps={{ hide: true }} />
      <CandlestickChart.CurrentPrice
        orientation={orientation}
        axisLabelVisible={!params.has("no-price-label")}
        {...(params.has("consumer-hidden-label")
          ? { labelProps: { style: { visibility: "hidden" } } }
          : {})}
      />
      <CandlestickChart.Crosshair showLabels={!params.has("no-crosshair-labels")} />
      <CandlestickChart.Content />
      <CandlestickChart.Controls />
      <CandlestickChart.HistoryNavigator />
    </CandlestickChart>
  );
}
