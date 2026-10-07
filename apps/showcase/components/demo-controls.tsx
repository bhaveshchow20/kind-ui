"use client";
import { motion, useReducedMotion } from "motion/react";
import { Slider } from "radix-ui";
import { useId } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { DemoOptions } from "@/lib/demo-options";

type Control =
  | {
      kind: "range";
      key: keyof DemoOptions;
      label: string;
      min: number;
      max: number;
      step?: number;
      unit?: string;
    }
  | { kind: "switch"; key: keyof DemoOptions; label: string }
  | {
      kind: "choice";
      key: keyof DemoOptions;
      label: string;
      choices: { label: string; value: string | boolean }[];
    };
const curve: Control = {
  kind: "choice",
  key: "curve",
  label: "Curve",
  choices: [
    { label: "Smooth", value: "monotone" },
    { label: "Straight", value: "linear" },
    { label: "Stepped", value: "stepAfter" },
  ],
};
const corners: Control = {
  kind: "range",
  key: "radius",
  label: "Corners",
  min: 0,
  max: 16,
  unit: "px",
};
const grid: Control = { kind: "switch", key: "showGrid", label: "Grid lines" };
const legend: Control = { kind: "switch", key: "showLegend", label: "Legend" };
const weight: Control = {
  kind: "range",
  key: "strokeWidth",
  label: "Line weight",
  min: 1,
  max: 6,
  step: 0.5,
  unit: "px",
};
const labels: Control = { kind: "switch", key: "showLabels", label: "Labels" };
const barWidth: Control = {
  kind: "range",
  key: "width",
  label: "Bar width",
  min: 8,
  max: 48,
  unit: "px",
};
const fill: Control = {
  kind: "range",
  key: "fillOpacity",
  label: "Fill",
  min: 0,
  max: 0.8,
  step: 0.05,
};
export function controlsFor(family: string, id: string): Control[] {
  switch (family) {
    case "Area":
      return [curve, fill, weight, grid];
    case "Line":
      return [curve, { kind: "switch", key: "dots", label: "Show points" }, weight, grid];
    case "Bar":
      return [
        id === "grouped"
          ? {
              kind: "choice",
              key: "stacked",
              label: "Arrangement",
              choices: [
                { label: "Grouped", value: false },
                { label: "Stacked", value: true },
              ],
            }
          : barWidth,
        corners,
        id === "grouped" ? barWidth : legend,
        grid,
      ];
    case "Combo":
      return [
        id === "combo-area" ? curve : corners,
        { kind: "switch", key: "dots", label: "Target points" },
        weight,
        grid,
      ];
    case "Pie":
      return [
        { kind: "range", key: "innerRadius", label: "Center opening", min: 0, max: 70, unit: "%" },
        legend,
        {
          kind: "range",
          key: "rotation",
          label: "Rotation",
          min: 0,
          max: 360,
          step: 15,
          unit: "°",
        },
        corners,
      ];
    case "Radar":
      return [
        {
          kind: "choice",
          key: "gridType",
          label: "Grid",
          choices: [
            { label: "Polygon", value: "polygon" },
            { label: "Circle", value: "circle" },
          ],
        },
        fill,
        weight,
        { kind: "range", key: "outerRadius", label: "Size", min: 50, max: 90, unit: "%" },
      ];
    case "Radial":
      return id === "activity"
        ? [
            {
              kind: "range",
              key: "progress",
              label: "Move",
              min: 0,
              max: 650,
              step: 10,
              unit: "kcal",
            },
            { kind: "range", key: "exercise", label: "Exercise", min: 0, max: 90, unit: "min" },
            { kind: "range", key: "stand", label: "Stand", min: 0, max: 16, unit: "hrs" },
            { kind: "range", key: "gap", label: "Ring spacing", min: 1, max: 12, unit: "px" },
          ]
        : [
            { kind: "range", key: "progress", label: "Completed", min: 0, max: 100, unit: "%" },
            corners,
            {
              kind: "range",
              key: "rotation",
              label: "Rotation",
              min: 90,
              max: 270,
              step: 15,
              unit: "°",
            },
            { kind: "range", key: "outerRadius", label: "Size", min: 60, max: 95, unit: "%" },
          ];
    case "Scatter":
      return [
        {
          kind: "choice",
          key: "pointShape",
          label: "Points",
          choices: [
            { label: "Circle", value: "circle" },
            { label: "Diamond", value: "diamond" },
            { label: "Square", value: "square" },
          ],
        },
        { kind: "range", key: "width", label: "Point size", min: 20, max: 160 },
        grid,
        legend,
      ];
    case "Heatmap":
      return [
        { kind: "switch", key: "showValues", label: "Show values" },
        { kind: "range", key: "gap", label: "Cell spacing", min: 0, max: 12, unit: "px" },
        corners,
        labels,
      ];
    case "Histogram":
      return [
        {
          kind: "choice",
          key: "density",
          label: "Measure",
          choices: [
            { label: "Count", value: false },
            { label: "Density", value: true },
          ],
        },
        { kind: "switch", key: "binBorders", label: "Bin borders" },
        grid,
        legend,
      ];
    case "Box Plot":
      return [
        { kind: "range", key: "width", label: "Box width", min: 12, max: 48, unit: "px" },
        { kind: "range", key: "outlierRadius", label: "Outlier size", min: 1, max: 8, unit: "px" },
        weight,
        grid,
      ];
    case "Waterfall":
      return [
        { kind: "switch", key: "connectors", label: "Connect steps" },
        corners,
        barWidth,
        grid,
      ];
    case "Sankey":
      return [
        { kind: "range", key: "nodeWidth", label: "Node width", min: 6, max: 28, unit: "px" },
        { kind: "range", key: "nodePadding", label: "Flow spacing", min: 8, max: 48, unit: "px" },
        {
          kind: "range",
          key: "linkOpacity",
          label: "Flow opacity",
          min: 0.15,
          max: 0.85,
          step: 0.05,
        },
        labels,
      ];
    default:
      return [];
  }
}
export function DemoControls({
  family,
  id,
  options,
  onChange,
}: {
  family: string;
  id: string;
  options: DemoOptions;
  onChange: (options: DemoOptions) => void;
}) {
  const scope = useId();
  const reduced = useReducedMotion();
  return (
    <div className="demo-controls">
      {controlsFor(family, id).map((control) => {
        const value = options[control.key];
        const update = (next: string | boolean | number) =>
          onChange({ ...options, [control.key]: next });
        if (control.kind === "switch")
          return (
            <div className="demo-switch" key={control.key}>
              <span>{control.label}</span>
              <Switch
                checked={Boolean(value)}
                onCheckedChange={update}
                aria-label={control.label}
              />
            </div>
          );
        if (control.kind === "range")
          return (
            <div className="demo-range" key={control.key}>
              <span>
                {control.label}
                <output>
                  {Number(value).toFixed(control.step && control.step < 1 ? 2 : 0)}
                  {control.unit && ` ${control.unit}`}
                </output>
              </span>
              <Slider.Root
                className="demo-slider"
                aria-label={control.label}
                min={control.min}
                max={control.max}
                step={control.step ?? 1}
                value={[Number(value)]}
                onValueChange={(values) => update(values[0] ?? control.min)}
              >
                <Slider.Track className="demo-slider-track">
                  <Slider.Range className="demo-slider-fill" />
                </Slider.Track>
                <Slider.Thumb className="demo-slider-thumb" aria-label={control.label} />
              </Slider.Root>
            </div>
          );
        return (
          <div className="demo-choice" key={control.key}>
            <span>{control.label}</span>
            <RadioGroup
              aria-label={control.label}
              value={String(value)}
              onValueChange={(next) =>
                update(next === "true" ? true : next === "false" ? false : next)
              }
            >
              {control.choices.map((choice) => (
                <RadioGroupItem
                  asChild
                  key={String(choice.value)}
                  value={String(choice.value)}
                  aria-label={choice.label}
                >
                  <motion.button type="button" whileTap={reduced ? undefined : { scale: 0.97 }}>
                    {value === choice.value && (
                      <motion.span
                        className="demo-choice-selection"
                        layoutId={reduced ? undefined : `${scope}-${control.key}`}
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="demo-choice-label">{choice.label}</span>
                  </motion.button>
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </div>
        );
      })}
    </div>
  );
}
