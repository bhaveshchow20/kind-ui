export type FunnelDatum = {
  id: string;
  label: string;
  value: number | null | undefined;
};

export type FunnelAccessors<T> = {
  id: (datum: T, index: number) => string;
  label: (datum: T, index: number) => string;
  value: (datum: T, index: number) => number | null | undefined;
};

export type FunnelStage<T = FunnelDatum> = {
  id: string;
  label: string;
  value: number | null;
  datum: T;
  index: number;
  denominator: number | null;
  /** A fraction, not a percentage; unavailable when either operand is unknown or the denominator is zero. */
  ratio: number | null;
};

export type FunnelDenominator<T = FunnelDatum> =
  | "first"
  | "previous"
  | number
  /** Receives validated stages before any ratios or denominators have been populated. */
  | ((
      stage: FunnelStage<T>,
      index: number,
      stages: readonly FunnelStage<T>[],
    ) => number | null | undefined);

export type FunnelModelOptions<T = FunnelDatum> = {
  data: readonly T[];
  accessors?: FunnelAccessors<T>;
  denominator?: FunnelDenominator<T>;
  /** A positive common comparison scale, at least the largest known stage value. */
  scaleMax?: number;
};

export type FunnelCustomModelOptions<T> = FunnelModelOptions<T> & {
  accessors: FunnelAccessors<T>;
};

export type FunnelModel<T = FunnelDatum> = {
  stages: readonly FunnelStage<T>[];
  maximum: number;
  scaleMax: number;
};

export function createFunnelModel<T extends FunnelDatum>(
  options: FunnelModelOptions<T>,
): FunnelModel<T>;
export function createFunnelModel<T>(options: FunnelCustomModelOptions<T>): FunnelModel<T>;
/** Validates supplied stage values without sorting, imputing, aggregating, or qualifying event sequences. */
export function createFunnelModel<T>(options: FunnelModelOptions<T>): FunnelModel<T> {
  if (options === null || typeof options !== "object" || Array.isArray(options))
    throw new Error("Funnel options must be an object");
  const { data, accessors, denominator } = options;
  if (!Array.isArray(data)) throw new Error("Funnel data must be an array");
  if (accessors !== undefined) {
    if (
      accessors === null ||
      typeof accessors !== "object" ||
      typeof accessors.id !== "function" ||
      typeof accessors.label !== "function" ||
      typeof accessors.value !== "function"
    )
      throw new Error("Funnel accessors must provide id, label, and value functions");
  }
  if (
    denominator !== undefined &&
    denominator !== "first" &&
    denominator !== "previous" &&
    typeof denominator !== "function" &&
    (typeof denominator !== "number" || !Number.isFinite(denominator) || denominator < 0)
  )
    throw new Error(
      "Funnel denominator must be first, previous, a finite nonnegative number, or a function",
    );

  const ids = new Set<string>();
  let maximum = 0;
  const stages: FunnelStage<T>[] = [];
  // entries visits sparse slots, so absent records receive the same boundary validation as explicit undefined.
  for (const [index, datum] of data.entries()) {
    const path = `Funnel data[${index}]`;
    if (!Object.hasOwn(data, index)) throw new Error(`${path} must not be a sparse slot`);
    let id: unknown;
    let label: unknown;
    let value: unknown;
    if (accessors) {
      id = accessors.id(datum, index);
      label = accessors.label(datum, index);
      value = accessors.value(datum, index);
    } else {
      if (datum === null || typeof datum !== "object" || Array.isArray(datum))
        throw new Error(`${path} must be a datum object`);
      const record = datum as Record<string, unknown>;
      id = record.id;
      label = record.label;
      value = record.value;
    }
    if (typeof id !== "string" || !id.trim())
      throw new Error(`${path}.id must be a nonempty string`);
    if (ids.has(id)) throw new Error(`${path}.id must be unique: ${id}`);
    ids.add(id);
    if (typeof label !== "string") throw new Error(`${path}.label must be a string`);
    if (
      value !== null &&
      value !== undefined &&
      (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    )
      throw new Error(`${path}.value must be a finite nonnegative number, null, or undefined`);
    const normalizedValue = value ?? null;
    if (normalizedValue !== null) maximum = Math.max(maximum, normalizedValue);
    stages.push({
      id,
      label,
      value: normalizedValue,
      datum,
      index,
      denominator: null,
      ratio: null,
    });
  }

  const scaleMax = options.scaleMax === undefined ? maximum || 1 : options.scaleMax;
  if (
    typeof scaleMax !== "number" ||
    !Number.isFinite(scaleMax) ||
    scaleMax <= 0 ||
    scaleMax < maximum
  )
    throw new Error(
      "Funnel scaleMax must be finite, positive, and at least the largest known stage value",
    );
  for (const stage of stages) {
    if (stage.value !== null && stage.value > 0 && stage.value / scaleMax === 0)
      throw new Error(
        `Funnel data[${stage.index}].value is too small for scaleMax; rescale the supplied units`,
      );
  }

  // Resolve every callback against the same canonical facts, not partially calculated earlier-stage metrics.
  const denominators = stages.map((stage, index) => {
    const value =
      denominator === "first"
        ? stages[0]?.value
        : denominator === "previous"
          ? stages[index - 1]?.value
          : typeof denominator === "function"
            ? denominator(stage, index, stages)
            : denominator;
    if (
      value !== null &&
      value !== undefined &&
      (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    )
      throw new Error(
        `Funnel data[${index}].denominator must be a finite nonnegative number, null, or undefined`,
      );
    return value ?? null;
  });
  for (const [index, stage] of stages.entries()) {
    const divisor = denominators[index] ?? null;
    stage.denominator = divisor;
    if (stage.value === null || divisor === null || divisor === 0) continue;
    const ratio = stage.value / divisor;
    if (!Number.isFinite(ratio) || (stage.value > 0 && ratio === 0))
      throw new Error(
        `Funnel data[${index}].ratio exceeds the representable numeric range; rescale the supplied units`,
      );
    stage.ratio = ratio;
  }
  return { stages, maximum, scaleMax };
}
