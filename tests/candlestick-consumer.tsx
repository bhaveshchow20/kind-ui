import { normalizeCandlestickData } from "@kind-ui/charts";

const rows = [{ t: 1, price: 2, label: "trade", list: [1], gapFlag: 0 }];
normalizeCandlestickData(rows, {
  timeMode: "epoch-ms",
  accessors: { time: "t", open: "price", high: (row) => row.price, low: "price", close: "price" },
});
normalizeCandlestickData(rows, {
  timeMode: "epoch-ms",
  // @ts-expect-error Time accessor must produce a time identity.
  accessors: { time: "list" },
});
normalizeCandlestickData(rows, {
  timeMode: "epoch-ms",
  // @ts-expect-error A label is not a price.
  accessors: { open: "label" },
});
normalizeCandlestickData(rows, {
  timeMode: "epoch-ms",
  // @ts-expect-error Gap markers are explicit booleans.
  accessors: { gap: "gapFlag" },
});
normalizeCandlestickData(rows, {
  timeMode: "epoch-ms",
  // @ts-expect-error Closing prices must be numeric.
  accessors: { close: (row) => row.label },
});

import { CandlestickChart, type CandlestickVolumeProps } from "@kind-ui/charts";

<CandlestickChart
  data={[]}
  config={{ price: { color: "#427b67" } }}
  timeMode="epoch-ms"
  aria-label="Candlestick type contract"
  // @ts-expect-error Financial candles have a time X axis and a price Y axis.
  layout="vertical"
>
  <CandlestickChart.Series seriesKey="price" />
</CandlestickChart>;
const unsupportedVolume: CandlestickVolumeProps = {
  seriesKey: "volume",
  // @ts-expect-error Volume uses the root's validated records and time coordinates.
  data: [{ volume: 30 }],
};
void unsupportedVolume;

<CandlestickChart.ReferenceLine y={10} ifOverflow="visible" />;
// @ts-expect-error Reference annotations cannot mutate the root's fixed price domain.
<CandlestickChart.ReferenceLine y={10} ifOverflow="extendDomain" />;
