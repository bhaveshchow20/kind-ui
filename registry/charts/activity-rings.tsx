"use client";
import {
  ActivityRings as CoreActivityRings,
  type ActivityRingsProps as CoreProps,
} from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

export type ActivityRingsProps = CoreProps;
// Standalone cores already supply their own context; caller owns all observations.
export function ActivityRings(props: ActivityRingsProps) {
  return <CoreActivityRings height={300} innerRadius="30%" outerRadius="90%" {...props} />;
}
export type { ActivityRing, ActivityRingDatum } from "@kind-ui/charts";
export * from "./chart.js";
