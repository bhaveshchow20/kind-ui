import type { ApiRow } from "@/components/api-table";

export const api = {
  Status: [
    {
      name: "state",
      type: '"neutral" | "pending" | "inflight" | "warning" | "active" | "error"',
      default: "Required",
      description:
        "Maps the state to its tone and dot treatment. Pending uses a dashed border and hollow dot.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | null',
      default: '"md"',
      description: "Badge padding and text size. Null leaves the base recipe sizing.",
    },
    {
      name: "pulse",
      type: "boolean",
      default: "false",
      description: "Pulses the decorative dot when reduced motion is not requested.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "state",
      description: "Visible label. Uses the state name if children are null or undefined.",
    },
    {
      name: "render",
      type: "ReactElement | render function",
      default: "<span>",
      description: "Replaces the host through Base UI composition.",
    },
    {
      name: "role / aria-live",
      type: 'AriaRole / AriaAttributes["aria-live"]',
      default: "—",
      description:
        "Consumer-owned announcement semantics. Use a stable status region for meaningful updates.",
    },
    {
      name: "className / style",
      type: "string / CSSProperties",
      default: "—",
      description: "Host styling merged with the status recipe.",
    },
    {
      name: "ref",
      type: "Ref<HTMLSpanElement>",
      default: "—",
      description: "Host reference. Native span attributes and event handlers are forwarded.",
    },
  ],
  statusVariants: [
    {
      name: "state",
      type: "StatusState | null",
      default: '"neutral"',
      description:
        "State in the optional options object; returns the status recipe as a class string. Null omits a semantic tone.",
    },
    {
      name: "size",
      type: "StatusSize | null",
      default: '"md"',
      description: "Padding and text size for the recipe.",
    },
    {
      name: "className / class",
      type: "ClassValue",
      default: "—",
      description: "Additional classes merged into the recipe.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
