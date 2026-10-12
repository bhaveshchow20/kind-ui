"use client";
import {
  CandlestickChart,
  CandlestickContent,
  CandlestickCrosshair,
  CandlestickGrid,
  CandlestickReferenceLine,
  CandlestickSeries,
  CandlestickXAxis,
  CandlestickYAxis,
  type SeriesConfig,
} from "@kind-ui/charts";

// Original simulated bid quotes for a contract with a USD 1 payout.
// These extrema describe the bid book; they do not describe executed trades.
const data = [
  {
    at: 1791280800000,
    firstBid: 0.42,
    highestBid: 0.48,
    lowestBid: 0.4,
    lastBid: 0.46,
    source: "Bid quotes",
    state: "final",
  },
  {
    at: 1791284400000,
    firstBid: 0.46,
    highestBid: 0.51,
    lowestBid: 0.44,
    lastBid: 0.49,
    source: "Bid quotes",
    state: "final",
  },
  {
    at: 1791288000000,
    firstBid: 0.49,
    highestBid: 0.54,
    lowestBid: 0.47,
    lastBid: 0.52,
    source: "Bid quotes",
    state: "final",
  },
  {
    at: 1791291600000,
    firstBid: 0.52,
    highestBid: 0.53,
    lowestBid: 0.45,
    lastBid: 0.47,
    source: "Bid quotes",
    state: "final",
  },
  {
    at: 1791295200000,
    firstBid: 0.47,
    highestBid: 0.57,
    lowestBid: 0.46,
    lastBid: 0.55,
    source: "Bid quotes",
    state: "final",
  },
  {
    at: 1791298800000,
    firstBid: 0.55,
    highestBid: 0.61,
    lowestBid: 0.53,
    lastBid: 0.59,
    source: "Bid quotes",
    state: "partial",
  },
];
type Quote = (typeof data)[number];
const config = {
  bid: { label: "Bid OHLC (USD per contract)", color: "#733bff" },
} satisfies SeriesConfig;
const quote = (value: number) => `$${value.toFixed(2)}`;
const time = (value: number | string) =>
  new Date(Number(value)).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

export function BinaryBidCandlestickChart() {
  return (
    <div>
      <p style={{ marginBottom: 16, fontSize: 12 }}>
        Simulated bid quotes · USD per contract · USD 1 payout · UTC
      </p>
      <CandlestickChart<Quote>
        config={config}
        data={data}
        timeMode="epoch-ms"
        spacing="elapsed"
        accessors={{
          time: "at",
          open: "firstBid",
          high: "highestBid",
          low: "lowestBid",
          close: "lastBid",
          state: "state",
        }}
        priceBounds={[0, 1]}
        priceDomain={[0, 1]}
        height={280}
        aria-label="Simulated binary contract bid OHLC in US dollars per contract"
        formatTime={time}
        formatPrice={quote}
        margin={{ top: 12, right: 8, bottom: 4, left: 0 }}
      >
        <CandlestickGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="currentColor"
          strokeOpacity={0.12}
        />
        <CandlestickXAxis axisLine={false} tickLine={false} tickMargin={10} minTickGap={24} />
        <CandlestickYAxis
          orientation="right"
          axisLine={false}
          tickLine={false}
          width={64}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
        />
        <CandlestickReferenceLine
          y={0.5}
          stroke="currentColor"
          strokeOpacity={0.3}
          strokeDasharray="4 4"
        />
        <CandlestickSeries<Quote>
          seriesKey="bid"
          rising="#733bff"
          falling="#a78bfa"
          unchanged="#666"
          maxBarSize={22}
        />
        <CandlestickCrosshair strokeOpacity={0.5} />
        <CandlestickContent<Quote>
          frameProps={{ style: { minHeight: 36, fontSize: 12, paddingTop: 12 } }}
        >
          {(point) =>
            point
              ? `${time(point.time)} UTC · ${point.original.source} · O ${quote(point.open ?? 0)} / H ${quote(point.high ?? 0)} / L ${quote(point.low ?? 0)} / C ${quote(point.close ?? 0)} · ${point.state}`
              : "Inspect a quote interval. The dashed line is a USD 0.50 reference."
          }
        </CandlestickContent>
      </CandlestickChart>
    </div>
  );
}
