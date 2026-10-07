import type { SeriesColor } from "./types.js";

export type ColorStops = { offsets: number[]; colors: string[] };

function stops(value: unknown, path: string): string[] {
  const values = typeof value === "string" ? [value] : value;
  if (!Array.isArray(values) || values.length === 0)
    throw new Error(
      `Series color ${path} requires a nonempty string or nonempty array of color strings`,
    );
  for (let index = 0; index < values.length; index++) {
    if (typeof values[index] !== "string" || values[index].trim() === "")
      throw new Error(
        `Series color ${path}${Array.isArray(value) ? `[${index}]` : ""} requires a nonempty color string`,
      );
  }
  return values;
}

function at(colors: string[], offset: number): string {
  if (colors.length === 1) return colors[0]!;
  const position = offset * (colors.length - 1);
  const index = Math.floor(position);
  const fraction = position - index;
  if (fraction < 1e-10) return colors[index]!;
  return `color-mix(in srgb, ${colors[index]} ${(1 - fraction) * 100}%, ${colors[index + 1]} ${fraction * 100}%)`;
}

/** Preserve each theme's evenly spaced stops, even with unequal stop counts. */
export function resolveSeriesColor(color: SeriesColor, key: string): ColorStops {
  const path = `config[${JSON.stringify(key)}].color`;
  const themed = color !== null && typeof color === "object" && !Array.isArray(color);
  if (
    themed &&
    (!Object.hasOwn(color, "light") ||
      !Object.hasOwn(color, "dark") ||
      Object.keys(color).some((key) => key !== "light" && key !== "dark"))
  )
    throw new Error(
      `Series color ${path} requires both light and dark definitions and no other fields`,
    );
  const variants = color as { light: unknown; dark: unknown };
  const light = stops(themed ? variants.light : color, themed ? `${path}.light` : path);
  const dark = stops(themed ? variants.dark : color, themed ? `${path}.dark` : path);
  const offsets = [
    ...new Set(
      [light, dark].flatMap((values) =>
        values.length === 1 ? [0] : values.map((_, index) => index / (values.length - 1)),
      ),
    ),
  ].sort((a, b) => a - b);
  return {
    offsets,
    colors: offsets.map((offset) =>
      themed ? `light-dark(${at(light, offset)}, ${at(dark, offset)})` : at(light, offset),
    ),
  };
}

export function colorResourceId(id: string, key: string) {
  return `kind-ui-color-${Array.from(`${id}:${key}`, (char) => char.codePointAt(0)?.toString(16)).join("-")}`;
}

/** Disjoint from legacy --color-<key>, whose valid keys include numeric suffixes. */
export function colorStopToken(key: string, index: number | "gradient") {
  const encoded = Array.from(key, (char) => char.codePointAt(0)?.toString(16)).join("-");
  return `--kind-ui-series-${encoded}-${index}`;
}
