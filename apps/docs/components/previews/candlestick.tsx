"use client";
import dynamic from "next/dynamic";
import { memo } from "react";
import type { PreviewProps } from "./types";

const loading = () => (
  <p className="component-loading" role="status">
    Loading chart…
  </p>
);
const Asset = dynamic(
  () => import("@/examples/candlestick/example").then((m) => memo(m.AssetCandlestickChart)),
  { loading, ssr: false },
);
const Binary = dynamic(
  () =>
    import("@/examples/candlestick-binary/example").then((m) => memo(m.BinaryBidCandlestickChart)),
  { loading, ssr: false },
);
const Updates = dynamic(
  () =>
    import("@/examples/candlestick-updates/example").then((m) => memo(m.UpdatedCandlestickChart)),
  { loading, ssr: false },
);
export const previews = {
  candlestick: ({ variant }: PreviewProps) => <Asset state={variant as "ready" | "loading"} />,
  "candlestick-binary": Binary,
  "candlestick-updates": Updates,
};
