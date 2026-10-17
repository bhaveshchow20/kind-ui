import type { ApiRow } from "@/components/api-table";

export const api = {
  Combobox: [
    {
      name: "items",
      type: "readonly Value[] | readonly Group<Value>[]",
      default: "—",
      description:
        "Available values for built-in filtering, collection rendering and empty feedback.",
    },
    {
      name: "value / defaultValue",
      type: "Value | null; Value[] when multiple",
      default: "Uncontrolled",
      description: "Controlled or initial selection, separate from the input search text.",
    },
    {
      name: "onValueChange",
      type: "(value, eventDetails) => void",
      default: "—",
      description:
        "Respond to selection or clearing; receives null when a single selection is cleared.",
    },
    {
      name: "inputValue / defaultInputValue",
      type: "Input value / initial value",
      default: "Uncontrolled",
      description: "Controlled or initial search text.",
    },
    {
      name: "onInputValueChange",
      type: "(text: string, eventDetails) => void",
      default: "—",
      description: "Respond to changes in the search input.",
    },
    {
      name: "open / defaultOpen",
      type: "boolean",
      default: "Uncontrolled / false",
      description: "Controlled or initial popup visibility.",
    },
    {
      name: "onOpenChange / onOpenChangeComplete",
      type: "Open-state callbacks",
      default: "—",
      description: "Respond to requested visibility changes and completed transitions.",
    },
    {
      name: "multiple",
      type: "boolean",
      default: "false",
      description: "Use an array of selected values.",
    },
    {
      name: "filter",
      type: "null | ((item, query, itemToString?) => boolean)",
      default: "Built-in filtering",
      description: "Customize matching; null disables internal filtering.",
    },
    {
      name: "filteredItems",
      type: "readonly Value[] | readonly Group<Value>[]",
      default: "—",
      description: "Provide externally filtered results instead of internal filtering.",
    },
    {
      name: "itemToStringLabel / itemToStringValue",
      type: "(item: Value) => string",
      default: "Automatic for strings and { label, value }",
      description: "Convert object items to visible labels and form values.",
    },
    {
      name: "isItemEqualToValue",
      type: "(item: Value, value: Value) => boolean",
      default: "Object.is",
      description: "Compare item values, particularly when objects are recreated.",
    },
    {
      name: "disabled / readOnly / required",
      type: "boolean",
      default: "false",
      description:
        "Disable interaction, prevent edits, or require a selection for form validation.",
    },
    {
      name: "name / form / autoComplete",
      type: "string",
      default: "—",
      description: "Form field name, associated form ID and browser autofill hint.",
    },
    {
      name: "autoHighlight / highlightItemOnHover / loopFocus",
      type: "boolean",
      default: "false / true / true",
      description:
        "Control automatic matching-item highlight, pointer highlight and wrapping keyboard navigation.",
    },
    {
      name: "openOnInputClick",
      type: "boolean",
      default: "true",
      description: "Open the popup when pressing the input.",
    },
    {
      name: "onItemHighlighted",
      type: "(value: Value | undefined, eventDetails) => void",
      default: "—",
      description: "Observe keyboard, pointer and programmatic highlight changes.",
    },
    {
      name: "inline / grid / virtualized / modal",
      type: "boolean",
      default: "false",
      description:
        "Enable a persistent inline list, grid navigation, virtualized rendering or modal popup behavior.",
    },
    {
      name: "limit",
      type: "number",
      default: "-1",
      description: "Maximum filtered result count; -1 shows all matching items.",
    },
    {
      name: "locale",
      type: "Intl.LocalesArgument",
      default: "Environment locale",
      description: "Locale used by built-in filtering.",
    },
    {
      name: "inputRef / actionsRef",
      type: "Ref<HTMLInputElement> / RefObject<{ unmount } | null>",
      default: "—",
      description: "Access the input or manage popup unmounting for external animations.",
    },
    {
      name: "children / id",
      type: "ReactNode / string",
      default: "—",
      description:
        "Compose parts and optionally supply a root identifier. The root renders no element.",
    },
  ],
  ComboboxInput: [
    {
      name: "placeholder",
      type: "string",
      default: "—",
      description: "Hint shown while the input is empty.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disable this input; the root can also disable the complete combobox.",
    },
    {
      name: "render / className / style / ref",
      type: "Base UI input props",
      default: "input",
      description:
        "Native input attributes, handlers and state-aware styling. Keep the accessible combobox role and labels.",
    },
  ],
  ComboboxInputGroup: [
    {
      name: "children / render / className / ref",
      type: "Base UI div props",
      default: "div",
      description:
        "Group the input with clear and trigger controls; styling can receive input-group state.",
    },
  ],
  ComboboxLabel: [
    {
      name: "children / render / className / ref",
      type: "Base UI label props",
      default: "div",
      description:
        "Label automatically associated with the trigger; id is managed internally. Label an editable input separately with a native label or aria-labelledby.",
    },
  ],
  ComboboxTrigger: [
    {
      name: "render",
      type: "ReactElement | render function",
      default: "Ghost Button, size icon-sm",
      description: "Replace the popup trigger element.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Prevent opening with this trigger.",
    },
    {
      name: "children / aria-label / className / ref",
      type: "Base UI button props",
      default: "—",
      description: "Provide an icon or label, an accessible name and state-aware styling.",
    },
  ],
  ComboboxClear: [
    {
      name: "render",
      type: "ReactElement | render function",
      default: "Ghost Button, size icon-sm",
      description: "Replace the control that clears the current value.",
    },
    {
      name: "disabled / keepMounted",
      type: "boolean",
      default: "false / false",
      description: "Prevent clearing or keep the hidden clear control in the DOM.",
    },
    {
      name: "children / aria-label / className / ref",
      type: "Base UI button props",
      default: "—",
      description: "Provide an icon or label, an accessible name and state-aware styling.",
    },
  ],
  ComboboxPortal: [
    {
      name: "container",
      type: "HTMLElement | ShadowRoot | RefObject | null",
      default: "document.body",
      description: "Destination for the popup. A local container preserves its inherited theme.",
    },
    {
      name: "keepMounted",
      type: "boolean",
      default: "false",
      description: "Keep hidden popup contents mounted.",
    },
    {
      name: "children / render / ref",
      type: "Base UI portal props",
      default: "div portal",
      description: "Compose the positioner and popup and customize the portal element.",
    },
  ],
  ComboboxPositioner: [
    {
      name: "side / align",
      type: 'Side / "start" | "center" | "end"',
      default: '"bottom" / "center"',
      description: "Preferred popup position; collisions may change the final placement.",
    },
    {
      name: "sideOffset / alignOffset",
      type: "number | offset callback",
      default: "0 / 0",
      description: "Spacing along the side and alignment axes in pixels.",
    },
    {
      name: "anchor",
      type: "Element | RefObject | virtual anchor | callback",
      default: "Combobox anchor",
      description: "Override the element used for positioning.",
    },
    {
      name: "positionMethod",
      type: '"absolute" | "fixed"',
      default: '"absolute"',
      description: "CSS positioning strategy.",
    },
    {
      name: "collisionBoundary / collisionPadding",
      type: "Boundary / Padding",
      default: '"clipping-ancestors" / 5',
      description: "Constrain placement and reserve space from boundary edges.",
    },
    {
      name: "collisionAvoidance",
      type: "CollisionAvoidance",
      default: "Base UI collision handling",
      description: "Choose flip, shift or no correction on supported axes.",
    },
    {
      name: "sticky / disableAnchorTracking",
      type: "boolean",
      default: "false / false",
      description:
        "Keep the popup visible after scrolling or disable anchor layout-shift tracking.",
    },
    {
      name: "children / render / className / ref",
      type: "Base UI positioner props",
      default: "div",
      description:
        "Compose the popup and customize styling using open, side, align and empty state.",
    },
  ],
  ComboboxPopup: [
    {
      name: "initialFocus / finalFocus",
      type: "boolean | RefObject | focus callback",
      default: "Base UI focus behavior",
      description: "Choose focus when opening and closing the popup.",
    },
    {
      name: "children / render / className / style / ref",
      type: "Base UI popup props",
      default: "div",
      description:
        "List surface with placement and transition state; built-in motion respects reduced motion.",
    },
  ],
  ComboboxList: [
    {
      name: "children",
      type: "ReactNode | ((item: Value, index: number) => ReactNode)",
      default: "—",
      description: "Explicit items or a renderer for the root's filtered items.",
    },
    {
      name: "render / className / ref",
      type: "Base UI list props",
      default: "div",
      description: "Scrollable listbox with empty-state styling support.",
    },
  ],
  ComboboxItem: [
    {
      name: "value",
      type: "Value",
      default: "null",
      description: "Unique selection value for this item.",
    },
    {
      name: "index",
      type: "number",
      default: "Inferred from DOM",
      description: "Explicit item index avoids calculating its position from the DOM.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Exclude this item from selection.",
    },
    {
      name: "onClick / onMouseUp",
      type: "Event handlers",
      default: "—",
      description: "Handle activation; preventDefault also cancels the Base UI selection handler.",
    },
    {
      name: "children / render / className / ref",
      type: "Base UI item props",
      default: "div",
      description:
        "Item label and selected indicator, with selected, highlighted and disabled styling state.",
    },
  ],
  ComboboxItemIndicator: [
    {
      name: "keepMounted",
      type: "boolean",
      default: "false",
      description: "Keep the indicator mounted when its item is not selected.",
    },
    {
      name: "children / render / className / ref",
      type: "Base UI span props",
      default: "span",
      description: "Your selected-item mark; no default check icon is inserted.",
    },
  ],
  ComboboxEmpty: [
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Message shown when no filtered items remain. Requires items on the root.",
    },
    {
      name: "render / className / ref",
      type: "Base UI div props",
      default: "div",
      description:
        "Keep this live region mounted and update its children for reliable announcements.",
    },
  ],
  ComboboxStatus: [
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Polite status feedback for loading or result updates; keep the region mounted.",
    },
    {
      name: "render / className / ref",
      type: "Base UI div props",
      default: "div",
      description: "Style or access the status region.",
    },
  ],
  ComboboxGroup: [
    {
      name: "items",
      type: "readonly Value[]",
      default: "—",
      description: "Items supplied to nested ComboboxCollection renderers.",
    },
    {
      name: "children / render / className / ref",
      type: "Base UI div props",
      default: "div",
      description: "Group related items with an accessible ComboboxGroupLabel.",
    },
  ],
  ComboboxGroupLabel: [
    {
      name: "children / render / className / ref",
      type: "Base UI div props",
      default: "div",
      description: "Accessible name of the enclosing item group.",
    },
  ],
  ComboboxSeparator: [
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      default: '"horizontal"',
      description: "Base UI separator orientation; the default styling is a horizontal rule.",
    },
    {
      name: "render / className / ref",
      type: "Base UI separator props",
      default: "div",
      description: "Customize the separator element and styling.",
    },
  ],
  ComboboxCollection: [
    {
      name: "children",
      type: "(item: Value, index: number) => ReactNode",
      default: "Required",
      description: "Render the current group or root collection without adding an element.",
    },
  ],
  ComboboxValue: [
    {
      name: "children",
      type: "ReactNode | ((value: Value) => ReactNode)",
      default: "Selected label",
      description: "Customize the rendered value; this component adds no wrapper element.",
    },
    {
      name: "placeholder",
      type: "ReactNode",
      default: "—",
      description:
        "Content when no value is selected, unless children or a null item's label overrides it.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
