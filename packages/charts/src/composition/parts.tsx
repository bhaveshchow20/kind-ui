"use client";

import {
  Brush,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import { Tooltip } from "../animation.js";
import { Grid, XAxis, YAxis } from "../cartesian-parts.js";
import { ChartBackgroundPattern } from "../chart-background-pattern.js";
import { FamilyLegend } from "../family-root.js";

export const cartesian = {
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  Legend: FamilyLegend,
  Background: ChartBackgroundPattern,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Brush,
};
export const polar = {
  Grid: PolarGrid,
  AngleAxis: PolarAngleAxis,
  RadiusAxis: PolarRadiusAxis,
  Tooltip,
  Legend: FamilyLegend,
};
