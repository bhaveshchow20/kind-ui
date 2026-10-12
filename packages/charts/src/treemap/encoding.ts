import type { TreemapNode } from "./model.js";

export interface TreemapColorStop {
  offset: number;
  color: string;
}

interface ColorOptions {
  label?: string;
  unknownColor?: string;
  unknownLabel?: string;
}

interface NumericOptions<T> extends ColorOptions {
  value: (datum: T, node: TreemapNode<T>) => number | null | undefined;
  groupValue?: (datum: T, node: TreemapNode<T>) => number | null | undefined;
  /** Opt-in aggregation of descendant leaf metrics, including missing values. */
  aggregate?: (
    values: readonly (number | null)[],
    node: TreemapNode<T>,
  ) => number | null | undefined;
  formatValue?: (value: number) => string;
}

interface ContinuousOptions<T> extends NumericOptions<T> {
  /** Fixed comparison bounds; omitted bounds are inferred from finite color metrics. */
  domain?: readonly [number, number];
  /** Inference defaults to the supplied root dataset, including explicit group metrics. */
  domainScope?: "root" | "view";
  /** Ordered CSS colors spanning offsets 0 through 1; interpolation uses CSS color-mix. */
  stops?: readonly TreemapColorStop[];
}

export type TreemapColorEncoding<T> =
  | (ColorOptions & {
      type: "categorical";
      value: (datum: T, node: TreemapNode<T>) => string | null | undefined;
      groupValue?: (datum: T, node: TreemapNode<T>) => string | null | undefined;
      categories: readonly { value: string; color: string; label?: string }[];
    })
  | (ContinuousOptions<T> & { type: "sequential" | "diverging" })
  | (NumericOptions<T> & {
      type: "threshold";
      thresholds: readonly number[];
      colors: readonly string[];
    })
  | (NumericOptions<T> & {
      type: "custom";
      color: (value: number, node: TreemapNode<T>) => string;
      legend?: readonly { label: string; color: string }[];
    });

export interface TreemapColorReadout {
  color: string;
  /** Original metric; paint clamping never changes this value. */
  value: number | string | null;
  formattedValue: string;
  unknown: boolean;
}

export type TreemapColorLegend = {
  label: string;
  unknown: { color: string; label: string };
} & (
  | { type: "categorical" | "custom"; items: readonly { label: string; color: string }[] }
  | {
      type: "sequential" | "diverging";
      domain: readonly [number, number];
      stops: readonly TreemapColorStop[];
      ticks: readonly { value: number; label: string; offset: number }[];
    }
  | {
      type: "threshold";
      thresholds: readonly number[];
      items: readonly {
        label: string;
        color: string;
        lower: number | null;
        upper: number | null;
      }[];
    }
);

export interface TreemapResolvedColors {
  colors: ReadonlyMap<string, TreemapColorReadout>;
  legend: TreemapColorLegend;
}

const sequentialStops: readonly TreemapColorStop[] = [
  { offset: 0, color: "#dbeafe" },
  { offset: 1, color: "#1d4ed8" },
];
const divergingStops: readonly TreemapColorStop[] = [
  { offset: 0, color: "#dc2626" },
  { offset: 0.5, color: "#e5e7eb" },
  { offset: 1, color: "#16a34a" },
];

function paint(color: string): string {
  if (typeof color !== "string" || !color.trim()) {
    throw new Error("Treemap colors must be nonempty CSS paint strings.");
  }
  return color;
}

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function offset(value: number, domain: readonly [number, number], diverging: boolean): number {
  const [min, max] = domain;
  if (min === max) return 0.5;
  if (diverging && value === 0) return 0.5;
  if (value <= min) return 0;
  if (value >= max) return 1;
  const span = max - min;
  // Divide before subtracting only when the finite endpoints overflow the span.
  const ratio = diverging
    ? value < 0
      ? 0.5 + (value / Math.abs(min)) * 0.5
      : 0.5 + (value / max) * 0.5
    : Number.isFinite(span)
      ? (value - min) / span
      : (value / 2 - min / 2) / (max / 2 - min / 2);
  return Math.max(0, Math.min(1, ratio));
}

function interpolate(stops: readonly TreemapColorStop[], position: number): string {
  const first = stops[0];
  if (!first) throw new Error("Treemap color stops are missing.");
  if (position <= first.offset) return first.color;
  for (let index = 1; index < stops.length; index++) {
    const right = stops[index];
    const left = stops[index - 1];
    if (!right || !left) continue;
    if (position <= right.offset) {
      if (position === right.offset) return right.color;
      const weight = ((position - left.offset) / (right.offset - left.offset)) * 100;
      return `color-mix(in srgb, ${left.color} ${100 - weight}%, ${right.color} ${weight}%)`;
    }
  }
  return stops[stops.length - 1]?.color ?? first.color;
}

/**
 * Resolves paint and legend together; geometry and area values are never read.
 * Continuous paint clamps to the domain and collapsed domains use the midpoint.
 * Diverging inference uses symmetric bounds and always centers numerical zero.
 * Threshold equality enters the upper interval. Missing/nonfinite metrics are unknown.
 */
export function resolveTreemapColors<T>(
  nodes: readonly TreemapNode<T>[],
  viewNodes: readonly TreemapNode<T>[],
  encoding: TreemapColorEncoding<T>,
): TreemapResolvedColors {
  const unknownColor = paint(encoding.unknownColor ?? "#9ca3af");
  const unknownLabel = encoding.unknownLabel ?? "Unknown";
  const base = {
    label: encoding.label ?? "Color",
    unknown: { color: unknownColor, label: unknownLabel },
  };
  const colors = new Map<string, TreemapColorReadout>();
  const unknown = (): TreemapColorReadout => ({
    color: unknownColor,
    value: null,
    formattedValue: unknownLabel,
    unknown: true,
  });
  if (encoding.type === "categorical") {
    const categories = new Map<string, { color: string; label: string }>();
    for (const category of encoding.categories) {
      if (categories.has(category.value))
        throw new Error("Treemap categories must have unique values.");
      categories.set(category.value, {
        color: paint(category.color),
        label: category.label ?? category.value,
      });
    }
    for (const node of nodes) {
      const value =
        node.kind === "leaf"
          ? encoding.value(node.datum, node)
          : encoding.groupValue?.(node.datum, node);
      const category = value == null ? undefined : categories.get(value);
      colors.set(
        node.id,
        category && value != null
          ? { color: category.color, value, formattedValue: category.label, unknown: false }
          : unknown(),
      );
    }
    return { colors, legend: { ...base, type: "categorical", items: [...categories.values()] } };
  }
  if (encoding.groupValue && encoding.aggregate)
    throw new Error("Treemap color requires either groupValue or aggregate, not both.");
  const values = new Map<string, number | null>();
  for (const node of nodes) {
    if (node.kind === "leaf") values.set(node.id, finite(encoding.value(node.datum, node)));
  }
  const descendantValues = (node: TreemapNode<T>): (number | null)[] =>
    node.kind === "leaf" ? [values.get(node.id) ?? null] : node.children.flatMap(descendantValues);
  for (const node of nodes) {
    if (node.kind === "group")
      values.set(
        node.id,
        finite(
          encoding.groupValue?.(node.datum, node) ??
            (encoding.aggregate ? encoding.aggregate(descendantValues(node), node) : null),
        ),
      );
  }
  const format = encoding.formatValue ?? String;
  let legend: TreemapColorLegend;
  let color: (value: number, node: TreemapNode<T>) => string;
  if (encoding.type === "threshold") {
    if (encoding.colors.length !== encoding.thresholds.length + 1)
      throw new Error("Treemap thresholds require one more color than boundaries.");
    encoding.thresholds.forEach((boundary, index) => {
      if (
        !Number.isFinite(boundary) ||
        (index > 0 && boundary <= (encoding.thresholds[index - 1] ?? boundary))
      )
        throw new Error("Treemap thresholds must be finite and strictly increasing.");
    });
    const paints = encoding.colors.map(paint);
    color = (value) =>
      paints[encoding.thresholds.filter((boundary) => value >= boundary).length] ?? unknownColor;
    legend = {
      ...base,
      type: "threshold",
      thresholds: [...encoding.thresholds],
      items: paints.map((item, index) => {
        const lower = encoding.thresholds[index - 1] ?? null;
        const upper = encoding.thresholds[index] ?? null;
        return {
          color: item,
          lower,
          upper,
          label:
            lower === null
              ? upper === null
                ? "All values"
                : `< ${format(upper)}`
              : upper === null
                ? `≥ ${format(lower)}`
                : `${format(lower)} ≤ value < ${format(upper)}`,
        };
      }),
    };
  } else if (encoding.type === "custom") {
    color = (value, node) => paint(encoding.color(value, node));
    legend = {
      ...base,
      type: "custom",
      items: (encoding.legend ?? []).map((item) => ({
        label: item.label,
        color: paint(item.color),
      })),
    };
  } else {
    const scope = encoding.domainScope === "view" ? viewNodes : nodes;
    const metrics = scope.flatMap((node) => {
      const value = values.get(node.id);
      return value == null ? [] : [value];
    });
    let min = 0;
    let max = 0;
    if (metrics.length) {
      min = metrics[0] ?? 0;
      max = min;
      for (const metric of metrics) {
        min = Math.min(min, metric);
        max = Math.max(max, metric);
      }
    }
    if (encoding.type === "diverging") {
      const extent = Math.max(Math.abs(min), Math.abs(max));
      min = extent === 0 ? 0 : -extent;
      max = extent;
    }
    const domain = encoding.domain ?? [min, max];
    if (
      !Number.isFinite(domain[0]) ||
      !Number.isFinite(domain[1]) ||
      domain[0] > domain[1] ||
      (encoding.type === "diverging" && (domain[0] > 0 || domain[1] < 0))
    )
      throw new Error(
        "Treemap domain must be finite and ordered; diverging domains must contain zero.",
      );
    const stops =
      encoding.stops ?? (encoding.type === "diverging" ? divergingStops : sequentialStops);
    if (stops.length < 2 || stops[0]?.offset !== 0 || stops[stops.length - 1]?.offset !== 1)
      throw new Error("Treemap color stops must include endpoints zero and one.");
    stops.forEach((stop, index) => {
      paint(stop.color);
      if (
        !Number.isFinite(stop.offset) ||
        stop.offset < 0 ||
        stop.offset > 1 ||
        (index > 0 && stop.offset <= (stops[index - 1]?.offset ?? stop.offset))
      )
        throw new Error(
          "Treemap color stop offsets must be strictly increasing between zero and one.",
        );
    });
    const diverging = encoding.type === "diverging";
    color = (value) => interpolate(stops, offset(value, domain, diverging));
    const ticks =
      domain[0] === domain[1]
        ? [domain[0]]
        : diverging
          ? [...new Set([domain[0], 0, domain[1]])]
          : [domain[0], domain[1]];
    legend = {
      ...base,
      type: encoding.type,
      domain: [domain[0], domain[1]],
      stops: stops.map((stop) => ({ ...stop })),
      ticks: ticks.map((value) => ({
        value,
        label: format(value),
        offset: offset(value, domain, diverging),
      })),
    };
  }
  for (const node of nodes) {
    const value = values.get(node.id) ?? null;
    colors.set(
      node.id,
      value === null
        ? unknown()
        : { color: color(value, node), value, formattedValue: format(value), unknown: false },
    );
  }
  return { colors, legend };
}
