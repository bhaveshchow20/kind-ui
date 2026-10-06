"use client";

import type { ComponentPropsWithRef } from "react";

export type ChartLoadingProps = Omit<ComponentPropsWithRef<"div">, "aria-busy"> & {
  /** Controlled by the host request; empty data does not imply loading. */
  loading: boolean;
  /** Announced outside the busy region. Use a chart-specific description. */
  label?: string;
};

/** A presentation boundary: children stay mounted and retain their layout/state. */
export function ChartLoading({
  loading,
  label = "Loading chart",
  children,
  className,
  ...props
}: ChartLoadingProps) {
  return (
    <div
      {...props}
      className={["kind-ui-chart-loading", className].filter(Boolean).join(" ")}
      data-kind-ui="chart-loading"
      data-loading={loading ? "true" : "false"}
    >
      <div
        data-kind-ui="chart-loading-content"
        aria-busy={loading}
        aria-hidden={loading || undefined}
        inert={loading || undefined}
      >
        {children}
      </div>
      <div data-kind-ui="chart-loading-placeholder" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span data-kind-ui="chart-loading-status" role="status" aria-atomic="true">
        {loading ? label : ""}
      </span>
    </div>
  );
}
