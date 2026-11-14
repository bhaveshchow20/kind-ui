import type { ApiRow } from "@/components/api-table";

export const api = {
  Tooltip: [
    {
      name: "content",
      type: "ReactNode",
      default: "Omitted",
      description:
        "Pass content for shorthand composition around one React element. Null, false or blank content suppresses the popup; omit for explicit parts.",
    },
    {
      name: "children",
      type: "ReactNode | ((payload) => ReactNode)",
      default: "—",
      description:
        "One trigger element in shorthand mode, or explicit parts when content is omitted.",
    },
    {
      name: "open",
      type: "boolean",
      default: "Uncontrolled",
      description:
        "Control requested visibility with onOpenChange; empty or disabled tooltips stay suppressed.",
    },
    {
      name: "defaultOpen",
      type: "boolean",
      default: "false",
      description: "Initial requested visibility for uncontrolled use.",
    },
    {
      name: "onOpenChange",
      type: "(open: boolean, details: TooltipChangeDetails) => void",
      default: "—",
      description:
        "Receive Base UI details or touch-press details. Call details.cancel() to reject the change.",
    },
    {
      name: "onOpenChangeComplete",
      type: "(open: boolean) => void",
      default: "—",
      description: "Receive completion of popup transitions.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Suppress the tooltip.",
    },
    {
      name: "asLabel",
      type: "boolean",
      default: "false",
      description:
        "Use content as the trigger’s accessible name, available even while closed; explicit names are preserved.",
    },
    {
      name: "followCursor",
      type: "boolean",
      default: "false",
      description: "Track both cursor axes; keyboard opening remains anchor-based.",
    },
    {
      name: "trackCursorAxis",
      type: '"none" | "x" | "y" | "both"',
      default: '"both" if followCursor; otherwise "none"',
      description: "Explicit cursor tracking overrides followCursor.",
    },
    {
      name: "delay",
      type: "number",
      default: "Provider / 600",
      description: "Shorthand or composed trigger opening delay in milliseconds.",
    },
    {
      name: "closeDelay",
      type: "number",
      default: "Provider / 0",
      description: "Trigger closing delay in milliseconds.",
    },
    {
      name: "disableHoverablePopup",
      type: "boolean",
      default: "false",
      description:
        "Close when the pointer leaves the trigger instead of allowing pointer travel into the popup.",
    },
    {
      name: "contentProps",
      type: 'Omit<TooltipContentProps, "children">',
      default: "—",
      description: "Override shorthand popup props.",
    },
    {
      name: "triggerProps",
      type: 'Omit<TooltipTriggerProps, "children" | "render">',
      default: "—",
      description: "Pass props to the shorthand trigger.",
    },
    {
      name: "triggerId / defaultTriggerId",
      type: "string | null",
      default: "—",
      description: "Associate controlled or initially open state with a trigger.",
    },
    {
      name: "actionsRef",
      type: "RefObject<{ close(): void; unmount(): void } | null>",
      default: "—",
      description: "Access imperative popup lifecycle actions.",
    },
    {
      name: "handle",
      type: "Base UI Tooltip handle",
      default: "—",
      description: "Associate an external trigger.",
    },
    {
      name: "side",
      type: '"top" | "bottom" | "left" | "right" | "inline-start" | "inline-end"',
      default: '"top"',
      description: "Preferred popup side.",
    },
    {
      name: "align",
      type: '"start" | "center" | "end"',
      default: '"center"',
      description: "Alignment relative to the anchor.",
    },
    {
      name: "sideOffset",
      type: "number | OffsetFunction",
      default: "8",
      description: "Gap from the anchor in pixels.",
    },
    {
      name: "alignOffset",
      type: "number | OffsetFunction",
      default: "0",
      description: "Offset along the alignment axis.",
    },
    {
      name: "collisionPadding",
      type: 'number | Partial<Record<"top" | "right" | "bottom" | "left", number>>',
      default: "8",
      description: "Space inside the collision boundary.",
    },
    {
      name: "arrow",
      type: "boolean",
      default: "false",
      description: "Show a small arrow pointing toward the anchor.",
    },
    {
      name: "anchorRef",
      type: "RefObject<Element | null>",
      default: "Trigger",
      description:
        "Position against an external element. In shorthand form, manage opening explicitly because the child is not wrapped as a trigger.",
    },
    {
      name: "anchorPoint",
      type: "{ x: number; y: number }",
      default: "—",
      description: "Fractional point inside the anchor; { x: 0.5, y: 0.5 } is its center.",
    },
    {
      name: "container",
      type: "HTMLElement | ShadowRoot | null | RefObject<HTMLElement | ShadowRoot | null>",
      default: "document.body",
      description: "Mount the popup inside a local theme or overlay boundary.",
    },
  ],
  TooltipProvider: [
    {
      name: "delay",
      type: "number",
      default: "400",
      description: "Shared opening delay in milliseconds.",
    },
    {
      name: "closeDelay",
      type: "number",
      default: "80",
      description: "Shared closing delay in milliseconds.",
    },
    {
      name: "timeout",
      type: "number",
      default: "400",
      description: "Time window for adjacent tooltips to open instantly.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Tooltips sharing these timing defaults.",
    },
  ],
  TooltipTrigger: [
    {
      name: "render",
      type: "ReactElement | ((props, state) => ReactElement)",
      default: "button",
      description: "Compose with an existing element; preserve its handlers and ref.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Suppress this tooltip; this prop alone does not disable the native trigger.",
    },
    {
      name: "delay",
      type: "number",
      default: "Root / provider / 600",
      description: "Override the opening delay in milliseconds.",
    },
    {
      name: "closeDelay",
      type: "number",
      default: "Root / provider / 0",
      description: "Override the closing delay in milliseconds.",
    },
    {
      name: "closeOnClick",
      type: "boolean",
      default: "true",
      description: "Dismiss on pointer click; touch press uses Kind’s toggle behavior.",
    },
    {
      name: "payload",
      type: "Payload",
      default: "—",
      description: "Data passed to the root’s children render function.",
    },
    {
      name: "handle",
      type: "Base UI Tooltip handle",
      default: "—",
      description: "Associate with an external root.",
    },
  ],
  TooltipContent: [
    {
      name: "side",
      type: '"top" | "bottom" | "left" | "right" | "inline-start" | "inline-end"',
      default: '"top"',
      description: "Preferred popup side.",
    },
    {
      name: "align",
      type: '"start" | "center" | "end"',
      default: '"center"',
      description: "Alignment relative to the anchor.",
    },
    {
      name: "sideOffset",
      type: "number | OffsetFunction",
      default: "8",
      description: "Gap from the anchor in pixels.",
    },
    {
      name: "alignOffset",
      type: "number | OffsetFunction",
      default: "0",
      description: "Offset along the alignment axis.",
    },
    {
      name: "collisionPadding",
      type: 'number | Partial<Record<"top" | "right" | "bottom" | "left", number>>',
      default: "8",
      description: "Space inside the collision boundary.",
    },
    {
      name: "arrow",
      type: "boolean",
      default: "false",
      description: "Show a small arrow pointing toward the anchor.",
    },
    {
      name: "anchorRef",
      type: "RefObject<Element | null>",
      default: "Trigger",
      description:
        "Position against an external element. In shorthand form, manage opening explicitly because the child is not wrapped as a trigger.",
    },
    {
      name: "anchorPoint",
      type: "{ x: number; y: number }",
      default: "—",
      description: "Fractional point inside the anchor; { x: 0.5, y: 0.5 } is its center.",
    },
    {
      name: "container",
      type: "HTMLElement | ShadowRoot | null | RefObject<HTMLElement | ShadowRoot | null>",
      default: "document.body",
      description: "Mount the popup inside a local theme or overlay boundary.",
    },
    {
      name: "positionerProps",
      type: 'Omit<Base UI Tooltip.Positioner.Props, "children" | placement props>',
      default: "—",
      description: "Additional anchor, collision and positioner configuration.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Popup content; null, false and blank content render no popup.",
    },
    {
      name: "role",
      type: "AriaRole",
      default: '"tooltip"',
      description: "Semantic role for the popup.",
    },
    {
      name: "id",
      type: "string",
      default: "Generated ID",
      description: "Override the popup ID used by the trigger description.",
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
} satisfies Record<string, ApiRow[]>;
