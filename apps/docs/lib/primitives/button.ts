import type { ApiRow } from "@/components/api-table";

export const api = {
  Button: [
    {
      name: "variant",
      type: '"default" | "secondary" | "outline" | "link" | "ghost" | "destructive"',
      default: '"default"',
      description: "Visual treatment; link changes appearance while retaining button semantics.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | "icon-sm" | "icon-md" | "icon-lg"',
      default: '"md"',
      description: "Control dimensions. Give icon-only buttons an accessible name.",
    },
    {
      name: "loading",
      type: "boolean",
      default: "false",
      description:
        "Shows a spinner, prevents activation and sets aria-busy. Remains focusable while loading.",
    },
    {
      name: "loadingText",
      type: "string",
      default: "—",
      description:
        "Visible label beside the spinner. Without it, loading uses a circular button and keeps the label available to assistive technology.",
    },
    {
      name: "contentKey",
      type: "React.Key",
      default: "Text or number children",
      description:
        "Changes the crossfade identity for complex children. Plain text changes animate automatically.",
    },
    {
      name: "count",
      type: "number",
      default: "—",
      description: "Count badge alongside the label; zero is displayed.",
    },
    {
      name: "shortcut",
      type: "string",
      default: "—",
      description: "Visual keyboard hint. Register the actual shortcut in your application.",
    },
    {
      name: "leadingIcon / trailingIcon",
      type: "ReactNode",
      default: "—",
      description: "Decorative icons before or after the label; hidden from assistive technology.",
    },
    { name: "children", type: "ReactNode", default: "—", description: "Action label or content." },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Prevents activation. Loading also disables the action.",
    },
    {
      name: "type",
      type: '"button" | "submit" | "reset"',
      default: '"button"',
      description: "Native button behavior; use submit for form submission.",
    },
    {
      name: "onClick",
      type: 'ButtonProps["onClick"]',
      default: "—",
      description: "Action handler with the Base UI button event contract.",
    },
    {
      name: "render",
      type: "ReactElement | render function",
      default: "Animated button",
      description:
        "Replaces the host element while preserving Base UI composition. A custom host replaces the built-in button motion.",
    },
    {
      name: "nativeButton",
      type: "boolean",
      default: "true",
      description: "Set false when render supplies a non-button host.",
    },
    {
      name: "className / style",
      type: 'ButtonProps["className"] / ButtonProps["style"]',
      default: "—",
      description: "Host styling; accepts values or callbacks receiving the disabled state.",
    },
    {
      name: "ref",
      type: "Ref<HTMLElement>",
      default: "—",
      description:
        "Reference to the rendered host. Native button and accessibility attributes are forwarded.",
    },
  ],
  buttonVariants: [
    {
      name: "variant / size",
      type: 'Pick<ButtonProps, "variant" | "size">',
      default: '"default" / "md"',
      description:
        "Optional options object; returns the button recipe as a class string for semantic links or other hosts.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
