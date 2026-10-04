"use client";
import { previews as area } from "./area";
import { previews as line } from "./line";
import { previews as pie } from "./pie";
import { previews as radar } from "./radar";
import { previews as sankey } from "./sankey";
export const previews = { ...line, ...area, ...pie, ...radar, ...sankey };
