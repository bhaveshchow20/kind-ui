import type { ApiRow } from "@/components/api-table";

export const api = {
  Dialog: [
    {
      name: "open / defaultOpen",
      type: "boolean",
      default: "Uncontrolled / false",
      description: "Controlled or initial open state. The root renders no element.",
    },
    {
      name: "onOpenChange",
      type: "(open, eventDetails) => void",
      default: "—",
      description:
        "Respond to opening and dismissal; eventDetails includes the reason and cancel().",
    },
    {
      name: "onOpenChangeComplete",
      type: "(open: boolean) => void",
      default: "—",
      description: "Called when the open or close transition completes.",
    },
    {
      name: "modal",
      type: 'boolean | "trap-focus"',
      default: "true",
      description: "Control focus trapping, page scrolling and outside pointer access.",
    },
    {
      name: "disablePointerDismissal",
      type: "boolean",
      default: "false",
      description: "Prevent dismissal through outside pointer presses.",
    },
    {
      name: "actionsRef",
      type: "RefObject<{ close; unmount } | null>",
      default: "—",
      description: "Imperative close and manual unmount actions for externally managed animations.",
    },
    {
      name: "handle",
      type: "DialogHandle<Payload>",
      default: "—",
      description: "Associate external triggers with this root using a Base UI dialog handle.",
    },
    {
      name: "triggerId / defaultTriggerId",
      type: "string | null",
      default: "—",
      description: "Active trigger identity for controlled or initially open dialogs.",
    },
    {
      name: "children",
      type: "ReactNode | ((context) => ReactNode)",
      default: "—",
      description: "Dialog parts or a render function receiving the active trigger payload.",
    },
  ],
  DialogTrigger: [
    {
      name: "nativeButton",
      type: "boolean",
      default: "true",
      description: "Set false when render supplies a non-button host.",
    },
    {
      name: "render",
      type: "ReactElement | render function",
      default: "Outline Button, size sm",
      description: "Replace the trigger element while retaining Base UI behavior.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Prevent opening the dialog.",
    },
    {
      name: "payload",
      type: "Payload",
      default: "—",
      description: "Value provided to the dialog root's children render function.",
    },
    {
      name: "handle",
      type: "DialogHandle<Payload>",
      default: "—",
      description: "Connect a trigger outside the root to its dialog.",
    },
    {
      name: "className / style",
      type: "Value | (state => value)",
      default: "—",
      description: "Native styling or state-aware styling. Ref and event handlers are forwarded.",
    },
  ],
  DialogContent: [
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Modal contents, including an accessible title and a close action.",
    },
    {
      name: "container",
      type: "HTMLElement | ShadowRoot | RefObject | null",
      default: "document.body",
      description: "Portal destination.",
    },
    {
      name: "keepMounted",
      type: "boolean",
      default: "false",
      description: "Keep the portal mounted while the dialog is closed.",
    },
    {
      name: "themeSource",
      type: "HTMLElement | RefObject<HTMLElement | null> | null",
      default: "—",
      description: "Inherit local CSS variables, font and dark theme into the portal.",
    },
    {
      name: "portalProps / backdropProps",
      type: "DialogPortalProps / DialogBackdropProps",
      default: "—",
      description: "Customize the automatically composed portal and backdrop.",
    },
    {
      name: "initialFocus / finalFocus",
      type: "boolean | RefObject | focus callback",
      default: "Base UI focus behavior",
      description: "Choose where focus moves when opening or closing.",
    },
    {
      name: "className / style / render / ref",
      type: "DialogPopupProps",
      default: "—",
      description: "Customize the popup surface; className and style can receive popup state.",
    },
  ],
  DialogPortal: [
    {
      name: "container",
      type: "HTMLElement | ShadowRoot | RefObject | null",
      default: "document.body",
      description: "Parent for the portalled content.",
    },
    {
      name: "keepMounted",
      type: "boolean",
      default: "false",
      description: "Keep hidden portal contents in the DOM.",
    },
    {
      name: "themeSource",
      type: "HTMLElement | RefObject<HTMLElement | null> | null",
      default: "—",
      description: "Source of inherited theme variables, font and color scheme.",
    },
    {
      name: "children / render / ref",
      type: "Base UI portal props",
      default: "div portal",
      description: "Compose explicit popup and backdrop parts and customize the portal element.",
    },
  ],
  DialogBackdrop: [
    {
      name: "forceRender",
      type: "boolean",
      default: "false",
      description: "Render the backdrop even when this dialog is nested inside another dialog.",
    },
    {
      name: "className / style",
      type: "Value | (state => value)",
      default: "Dimmed fixed backdrop",
      description: "Customize appearance using dialog transition state.",
    },
    {
      name: "render / ref",
      type: "Base UI render prop / Ref<HTMLDivElement>",
      default: "div",
      description: "Customize or access the backdrop element; native div attributes are supported.",
    },
  ],
  DialogPopup: [
    {
      name: "initialFocus",
      type: "boolean | RefObject | ((interactionType) => element | boolean | void)",
      default: "First tabbable element or popup",
      description: "Choose focus after opening.",
    },
    {
      name: "finalFocus",
      type: "boolean | RefObject | ((interactionType) => element | boolean | void)",
      default: "Trigger or previous focus",
      description: "Choose focus after closing.",
    },
    {
      name: "className / style",
      type: "Value | (state => value)",
      default: "Centered modal surface",
      description: "Style from open, transitionStatus and nested dialog state.",
    },
    {
      name: "children / render / ref",
      type: "Base UI popup props",
      default: "div",
      description: "Provide contents, replace the element or access its ref.",
    },
  ],
  DialogTitle: [
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Accessible dialog title, automatically linked to the popup.",
    },
    {
      name: "render / ref",
      type: "Base UI render prop / Ref<HTMLHeadingElement>",
      default: "h2",
      description: "Customize or access the title. State-aware className and style are supported.",
    },
  ],
  DialogDescription: [
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Supporting description, automatically linked to the popup.",
    },
    {
      name: "render / ref",
      type: "Base UI render prop / Ref<HTMLParagraphElement>",
      default: "p",
      description:
        "Customize or access the description. State-aware className and style are supported.",
    },
  ],
  DialogClose: [
    {
      name: "nativeButton",
      type: "boolean",
      default: "true",
      description: "Set false when render supplies a non-button host.",
    },
    {
      name: "render",
      type: "ReactElement | render function",
      default: "Ghost Button, size sm",
      description: "Replace the close control while preserving dismissal behavior.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Prevent closing through this control.",
    },
    {
      name: "children / ref / onClick",
      type: "Base UI close button props",
      default: "—",
      description: "Set an accessible visible label and forward button refs and handlers.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
