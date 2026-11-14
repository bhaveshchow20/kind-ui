const round = (value) => Math.round(value * 100) / 100;
const marketStart = Date.UTC(2026, 9, 13, 8);

function marketHistory() {
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
      time: marketStart + index * 60_000,
      open,
      high: round(Math.max(open, close) + 0.3 + random() * 1.8),
      low: Math.max(0.01, round(Math.min(open, close) - 0.3 - random() * 1.6)),
      close,
      volume: round(40 + Math.abs(move) * 24 + random() * 85),
      state: index === 239 ? "partial" : "final",
    };
  });
}

export const family = {
  id: "candlestick",
  examples: [
    {
      id: "candlestick",
      title: "Candlestick Chart",
      notes:
        "Simulated ETH / USD one-minute candles with volume, continuous updates and historical navigation.",
      acceptance:
        "OHLC, volume and current-price updates remain aligned through pause, step, zoom and historical browsing.",
    },
    {
      id: "candlestick-binary",
      title: "Bounded bid quotes",
      notes:
        "Original simulated bid OHLC in USD per contract, with explicit UTC intervals and a USD 1 payout.",
      acceptance:
        "Bid source and partial state stay visible; [0,1] bounds validate rather than clamp; no trade volume or opposite outcome is inferred.",
    },
    {
      id: "candlestick-updates",
      title: "Immutable live updates",
      notes:
        "Replace the forming candle, correct an older interval, append or prepend observations, and inspect an explicit feed gap. The chart-owned table follows current state.",
      acceptance:
        "Updates retain identities and original metadata; selection and history browsing survive updates; current observations table reflects every interaction.",
    },
  ],
  dataLabels: {
    candlestick: {
      caption:
        "Initial simulated ETH / USD history: one-minute UTC intervals, USD prices and ETH volume. The live preview updates the forming candle.",
      columns: {
        time: "Interval (epoch ms)",
        open: "Open (USD)",
        high: "High (USD)",
        low: "Low (USD)",
        close: "Close (USD)",
        volume: "Volume (ETH)",
      },
      rows: marketHistory(),
    },
    "candlestick-binary": {
      caption:
        "Original simulated hourly bid OHLC: epoch milliseconds in UTC and USD per contract; USD 1 payout. Volume is not supplied.",
      columns: {
        at: "Interval (epoch ms)",
        firstBid: "Open bid (USD)",
        highestBid: "High bid (USD)",
        lowestBid: "Low bid (USD)",
        lastBid: "Close bid (USD)",
        source: "Source",
        state: "State",
      },
      rows: [
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
      ],
    },
    "candlestick-updates": {
      caption:
        "Initial observations before updates: original simulated trade OHLC in USD, epoch milliseconds in UTC. The interactive Current observations table reflects replacements, corrections, appends and prepends.",
      columns: {
        time: "Interval (epoch ms)",
        open: "Open (USD)",
        high: "High (USD)",
        low: "Low (USD)",
        close: "Close (USD)",
        volume: "Volume",
        state: "State",
        source: "Source",
        reference: "Caller reference (USD)",
      },
      rows: [
        {
          time: 1791280800000,
          open: 72,
          high: 75,
          low: 71,
          close: 74,
          volume: "Not supplied",
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
          volume: "Not supplied",
          state: "final",
          source: "Trade OHLC",
          reference: 74,
        },
        {
          time: 1791288000000,
          open: "—",
          high: "—",
          low: "—",
          close: "—",
          volume: "Not supplied",
          state: "Feed unavailable",
          source: "Explicit gap",
          reference: "—",
        },
        {
          time: 1791291600000,
          open: 73,
          high: 76,
          low: 72,
          close: 75,
          volume: "Not supplied",
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
          volume: "Not supplied",
          state: "partial",
          source: "Trade OHLC",
          reference: 76,
        },
      ],
    },
  },
  variants: {
    candlestick: {
      control: "State",
      prop: "state",
      default: "ready",
      options: [
        { value: "ready", label: "Ready" },
        { value: "loading", label: "Loading" },
      ],
    },
  },
};
