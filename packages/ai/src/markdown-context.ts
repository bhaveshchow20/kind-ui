"use client";

import { createContext } from "react";
import type { StreamdownProps } from "streamdown";

type MarkdownRenderConfiguration = {
  [Key in "plugins" | "components" | "translations" | "icons" | "controls" | "isAnimating"]?:
    | StreamdownProps[Key]
    | undefined;
};

export const MarkdownRenderContext = createContext<MarkdownRenderConfiguration>({});
