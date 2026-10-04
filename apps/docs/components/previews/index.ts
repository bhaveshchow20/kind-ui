"use client";
import { previews as area } from "./area";
import { previews as line } from "./line";
import { previews as pie } from "./pie";
export const previews = { ...line, ...area, ...pie };
