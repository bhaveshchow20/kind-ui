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

import type { CandlestickDatum } from "@kind-ui/charts";

const completeObservation: CandlestickDatum = { time: 1, open: 10, high: 12, low: 9, close: 11 };
const explicitObservation: CandlestickDatum = {
  time: 2,
  gap: false,
  open: 11,
  high: 13,
  low: 10,
  close: 12,
  volume: 0,
};
const explicitGap: CandlestickDatum = { time: 3, gap: true, state: "Feed unavailable" };
const defaultRows: CandlestickDatum[] = [completeObservation, explicitObservation, explicitGap];
normalizeCandlestickData(defaultRows, { timeMode: "epoch-ms" });
normalizeCandlestickData<CandlestickDatum>([], {
  timeMode: "epoch-ms",
  accessors: {
    time: "time",
    open: "open",
    high: "high",
    low: "low",
    close: "close",
    gap: "gap",
    state: "state",
  },
});
// @ts-expect-error A nongap observation requires every OHLC value.
const missingOHLC: CandlestickDatum = { time: 4, open: 10 };
// @ts-expect-error Missing prices require an explicit gap: true discriminant.
const missingGapFlag: CandlestickDatum = { time: 4 };
// @ts-expect-error An explicit nongap row still requires complete OHLC.
const incompleteNongap: CandlestickDatum = { time: 4, gap: false, close: 11 };
// @ts-expect-error A gap cannot carry invented OHLC observations.
const gapWithPrice: CandlestickDatum = { time: 4, gap: true, open: 10 };
// @ts-expect-error A gap cannot carry observed volume, including zero.
const gapWithVolume: CandlestickDatum = { time: 4, gap: true, volume: 0 };
void [missingOHLC, missingGapFlag, incompleteNongap, gapWithPrice, gapWithVolume];

const numericRows = [{ 0: 1, 1: 10, 2: 12, 3: 9, 4: 11, source: "trade" }];
const numericPoints = normalizeCandlestickData(numericRows, {
  timeMode: "epoch-ms",
  accessors: { time: 0, open: 1, high: 2, low: 3, close: 4 },
});
const numericSource: string | undefined = numericPoints[0]?.original.source;
void numericSource;
