"use client";
import { previews as area } from "./area";
import { previews as histogram } from "./histogram";
import { previews as line } from "./line";
import { previews as pie } from "./pie";
import { previews as radar } from "./radar";
import { previews as radial } from "./radial";
import { previews as sankey } from "./sankey";
export const previews = { ...line, ...area, ...pie, ...radar, ...radial, ...sankey, ...histogram };
