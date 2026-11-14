"use client";

import { Status as PrimitiveStatus } from "@kind-ui/primitives/status";

export type { StatusProps, StatusState } from "@kind-ui/primitives/status";
export { statusVariants } from "@kind-ui/primitives/status";

/** Retains the AI status contract while sharing its presentation recipe. */
export const Status = PrimitiveStatus;
