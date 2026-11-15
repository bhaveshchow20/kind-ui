import { CandlestickChart, type CandlestickRecord } from "@kind-ui/charts";
import { createRoot } from "react-dom/client";

const rows: CandlestickRecord[] = [
  { time: 1_791_244_800_000, open: 40, high: 44, low: 38, close: 43, volume: 120 },
  { time: 1_791_331_200_000, open: 43, high: 45, low: 39, close: 41, volume: 95 },
];
createRoot(document.createElement("div")).render(
  <CandlestickChart
    data={rows}
    timeMode="epoch-ms"
    config={{
      price: { label: "Trade OHLC in USD", color: "#537f76" },
      volume: { label: "Volume in units", color: "#94a3b8" },
    }}
    width={600}
    height={260}
    aria-label="Illustrative trade candles and volume"
  >
    <CandlestickChart.Grid />
    <CandlestickChart.XAxis />
    <CandlestickChart.YAxis />
    <CandlestickChart.Series seriesKey="price" />
    <CandlestickChart.Volume seriesKey="volume" />
    <CandlestickChart.Crosshair />
    <CandlestickChart.Tooltip />
  </CandlestickChart>,
);
