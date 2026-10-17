import type { ApiRow } from "@/components/api-table";

export const api = {
  Badge: [
    {
      name: "tone",
      type: '"neutral" | "info" | "success" | "warning" | "danger" | null',
      default: '"neutral"',
      description: "Semantic color treatment. Null omits tone-specific styling.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | null',
      default: '"md"',
      description: "Padding and text size. Null leaves the base recipe sizing.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Short readable label; communicate meaning in text as well as color.",
    },
    {
      name: "render",
      type: "ReactElement | render function",
      default: "<span>",
      description:
        "Replaces the host using Base UI composition; does not add interactive behavior.",
    },
    {
      name: "className / style",
      type: "string / CSSProperties",
      default: "—",
      description: "Host styling merged with the badge recipe.",
    },
    {
      name: "ref",
      type: "Ref<HTMLSpanElement>",
      default: "—",
      description: "Host reference. Native span attributes and event handlers are forwarded.",
    },
  ],
  badgeVariants: [
    {
      name: "tone / size",
      type: "BadgeTone | null / BadgeSize | null",
      default: '"neutral" / "md"',
      description: "Options in an optional object; returns the badge recipe as a class string.",
    },
    {
      name: "className / class",
      type: "ClassValue",
      default: "—",
      description: "Additional classes merged into the recipe.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
