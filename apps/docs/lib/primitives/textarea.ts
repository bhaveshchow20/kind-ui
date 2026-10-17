import type { ApiRow } from "@/components/api-table";

export const api = {
  Textarea: [
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "Minimum height and padding preset.",
    },
    {
      name: "autoGrow",
      type: "boolean",
      default: "true",
      description:
        "Uses CSS field-sizing: content to grow with text, up to the maximum height. Set false to use native rows sizing.",
    },
    {
      name: "rows",
      type: "number",
      default: "4",
      description: "Native visible row count; controls sizing when autoGrow is false.",
    },
    {
      name: "value / defaultValue",
      type: 'TextareaProps["value"] / TextareaProps["defaultValue"]',
      default: "—",
      description: "Controlled content or the initial uncontrolled content.",
    },
    {
      name: "onChange",
      type: "ChangeEventHandler<HTMLTextAreaElement>",
      default: "—",
      description: "Receives native changes. Update value here when controlling the field.",
    },
    {
      name: "id / name",
      type: "string",
      default: "—",
      description: "Connects a visible label and identifies the field in form data.",
    },
    {
      name: "placeholder",
      type: "string",
      default: "—",
      description: "Short hint shown while empty; does not replace a label.",
    },
    {
      name: "maxLength",
      type: "number",
      default: "—",
      description: "Native maximum character count.",
    },
    {
      name: "disabled / readOnly / required",
      type: "boolean",
      default: "false",
      description: "Native field interaction and form validation behavior.",
    },
    {
      name: "aria-invalid",
      type: 'AriaAttributes["aria-invalid"]',
      default: "—",
      description:
        "Exposes invalid input and applies the invalid border. Describe the error with aria-describedby.",
    },
    {
      name: "className / style",
      type: "string / CSSProperties",
      default: "—",
      description: "Overrides native textarea styling, including height and maximum height.",
    },
    {
      name: "ref",
      type: "Ref<HTMLTextAreaElement>",
      default: "—",
      description:
        "Native textarea reference. Other native textarea and accessibility attributes are forwarded.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
