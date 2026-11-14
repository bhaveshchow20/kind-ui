import type { ApiRow } from "@/components/api-table";

export const api = {
  Collapsible: [
    {
      name: "open",
      type: "boolean",
      default: "Uncontrolled",
      description: "Control the disclosure state with onOpenChange.",
    },
    {
      name: "defaultOpen",
      type: "boolean",
      default: "false",
      description: "Initial state for uncontrolled use.",
    },
    {
      name: "onOpenChange",
      type: "(open, details) => void",
      default: "—",
      description: "Receive the next state and cancelable interaction details.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disable disclosure interaction.",
    },
    {
      name: "className",
      type: "string | ((state) => string)",
      default: "—",
      description: "Add classes; a callback receives this part’s current state.",
    },
    {
      name: "render",
      type: "ReactElement | ((props, state) => ReactElement)",
      default: "Native element",
      description: "Replace the element while preserving Base UI behavior, handlers and refs.",
    },
  ],
  CollapsibleTrigger: [
    {
      name: "disabled",
      type: "boolean",
      default: "Inherited from root",
      description: "Disable this trigger.",
    },
    {
      name: "nativeButton",
      type: "boolean",
      default: "true",
      description: "Whether the rendered element is a native button.",
    },
    {
      name: "render",
      type: "ReactElement | ((props, state) => ReactElement)",
      default: "Button: ghost",
      description: "Compose with your own control; expanded state and handlers are preserved.",
    },
    {
      name: "aria-controls",
      type: "string",
      default: "Panel ID when open",
      description: "For CollapsiblePreviewContent, pass the preview’s id explicitly.",
    },
  ],
  CollapsibleContent: [
    {
      name: "keepMounted",
      type: "boolean",
      default: "false",
      description: "Retain the hidden panel in the DOM.",
    },
    {
      name: "hiddenUntilFound",
      type: "boolean",
      default: "false",
      description: "Allow browser find-in-page to reveal hidden content; overrides keepMounted.",
    },
    {
      name: "className",
      type: "string | ((state) => string)",
      default: "—",
      description: "Add classes; a callback receives this part’s current state.",
    },
    {
      name: "render",
      type: "ReactElement | ((props, state) => ReactElement)",
      default: "Native element",
      description: "Replace the element while preserving Base UI behavior, handlers and refs.",
    },
  ],
  CollapsiblePreviewContent: [
    {
      name: "open",
      type: "boolean",
      default: "Required",
      description: "Use the same controlled state as the root.",
    },
    {
      name: "previewHeight",
      type: "number",
      default: "Required",
      description:
        "Maximum closed preview height in CSS pixels; negative or nonfinite values become zero.",
    },
    {
      name: "contentClassName",
      type: "string",
      default: "—",
      description: "Classes on the single measured inner content wrapper.",
    },
    {
      name: "previewDescription",
      type: "ReactNode",
      default: '"Content preview. Expand to read and interact with the full content."',
      description: "Accessible replacement for clipped, inert content.",
    },
    {
      name: "overlay",
      type: "ReactNode",
      default: "—",
      description: "Optional adornment outside the measured content, such as a fade.",
    },
    {
      name: "returnFocusRef",
      type: "RefObject<HTMLElement | null>",
      default: "Preview container",
      description: "Focus destination when closing would clip the focused descendant.",
    },
    {
      name: "className",
      type: "string",
      default: "—",
      description: "Classes on the outer preview container.",
    },
    {
      name: "style",
      type: "CSSProperties",
      default: "Closed maxHeight = previewHeight",
      description:
        "Explicit height or maxHeight remains consumer-owned and disables the automatic height transition.",
    },
    {
      name: "tabIndex",
      type: "number",
      default: "-1",
      description: "Allows the preview container to receive fallback focus.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
