"use client";
import { previews as area } from "./area";
import { previews as boxPlot } from "./box-plot";
import { previews as combo } from "./combo";
import { previews as histogram } from "./histogram";
import { previews as line } from "./line";
import { previews as pie } from "./pie";
import { previews as radar } from "./radar";
import { previews as radial } from "./radial";
import { previews as sankey } from "./sankey";
import { previews as scatter } from "./scatter";
import { previews as waterfall } from "./waterfall";
export const previews = {
  ...line,
  ...area,
  ...combo,
  ...pie,
  ...radar,
  ...radial,
  ...scatter,
  ...waterfall,
  ...sankey,
  ...histogram,
  ...boxPlot,
};
