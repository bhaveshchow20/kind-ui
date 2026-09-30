export type Domain = readonly [number, number];
export type MissingPolicy = "gap" | "zero" | "reject";
export type XAxis =
  | { readonly kind: "number"; readonly unit: string | null }
  | { readonly kind: "time"; readonly timeZone: string };

export interface InputPoint {
  /** Stable business key, never an array index. Unique within this model. */
  readonly id: string;
  readonly x: number;
  readonly y: number | null | undefined;
  readonly label?: string;
}

export interface NormalizeOptions {
  readonly missing: MissingPolicy;
  readonly x: XAxis;
  readonly y: { readonly unit: string | null };
  readonly xDomain?: Domain;
  readonly yDomain?: Domain;
  readonly includeZero?: boolean;
}

export interface Point {
  readonly id: string;
  readonly x: number;
  readonly y: number | null;
  readonly rawY: number | null;
  readonly imputed: boolean;
  readonly label: string;
}

export interface ChartModel {
  readonly points: readonly Point[];
  readonly x: XAxis;
  readonly y: { readonly unit: string | null };
  readonly missing: MissingPolicy;
  readonly xDomain: Domain;
  readonly yDomain: Domain;
}

export interface PlotSize {
  readonly width: number;
  readonly height: number;
}
export interface PlotInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}
export interface PositionedPoint extends Point {
  readonly px: number;
  readonly py: number | null;
}
export interface Tick {
  readonly value: number;
  readonly position: number;
}
export interface LineGeometry {
  readonly path: string | null;
  readonly points: readonly PositionedPoint[];
  readonly xTicks: readonly Tick[];
  readonly yTicks: readonly Tick[];
  readonly plot: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  };
}
