import type { ApiRow } from "@/components/api-table";

export const api = {
  TableContainer: [
    {
      name: "labels",
      type: "Partial<TableLabels>",
      default: "English action labels",
      description: "Override toolbar, format, fullscreen and live-feedback labels.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description:
        "Table, toolbar and fullscreen parts. Controls act on the first table in this container.",
    },
    {
      name: "className / ref",
      type: "string / Ref<HTMLDivElement>",
      default: "—",
      description: "Style or access the native outer div; native div attributes are supported.",
    },
  ],
  Table: [
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Native table sections, rows, cells and caption.",
    },
    {
      name: "tabIndex",
      type: "number",
      default: "0",
      description: "Make the table reachable for keyboard scrolling.",
    },
    {
      name: "className / ref",
      type: "string / Ref<HTMLTableElement>",
      default: "—",
      description: "Native table styling, attributes, handlers and ref are supported.",
    },
  ],
  TableHeader: [
    {
      name: "children / className / ref",
      type: 'ComponentProps<"thead">',
      default: "—",
      description: "Semantic header section with a subtle background.",
    },
  ],
  TableBody: [
    {
      name: "children / className / ref",
      type: 'ComponentProps<"tbody">',
      default: "—",
      description: "Semantic body section; removes the final row's bottom border.",
    },
  ],
  TableFooter: [
    {
      name: "children / className / ref",
      type: 'ComponentProps<"tfoot">',
      default: "—",
      description: "Semantic footer for totals or summary rows.",
    },
  ],
  TableRow: [
    {
      name: "children / className / ref",
      type: 'ComponentProps<"tr">',
      default: "—",
      description: "Semantic table row with a subtle separator.",
    },
  ],
  TableHead: [
    {
      name: "scope",
      type: '"col" | "row" | "colgroup" | "rowgroup"',
      default: '"col"',
      description: "Identify the cells described by this header.",
    },
    {
      name: "children / colSpan / rowSpan / className / ref",
      type: 'ComponentProps<"th">',
      default: "—",
      description: "Native header-cell content, spans, styling and ref.",
    },
  ],
  TableCell: [
    {
      name: "children / colSpan / rowSpan / className / ref",
      type: 'ComponentProps<"td">',
      default: "—",
      description: "Native data-cell content, spans, styling and ref.",
    },
  ],
  TableCaption: [
    {
      name: "children / className / ref",
      type: 'ComponentProps<"caption">',
      default: "—",
      description: "Accessible table caption, displayed below the table by default.",
    },
  ],
  TableToolbar: [
    {
      name: "children / className / ref",
      type: 'ComponentProps<"div">',
      default: "—",
      description:
        "Compact, end-aligned row for table actions; does not add toolbar keyboard behavior.",
    },
  ],
  TableViewport: [
    {
      name: "children / className / ref",
      type: 'ComponentProps<"div">',
      default: "—",
      description: "Horizontal scroll container. Use around Table to preserve native table markup.",
    },
  ],
  TableCopyMenu: [
    {
      name: "onCopy",
      type: '(format: "markdown" | "csv" | "tsv") => void',
      default: "—",
      description:
        "Called after a successful copy. Reads rendered header and body text at activation.",
    },
    {
      name: "onError",
      type: "(error: Error) => void",
      default: "—",
      description: "Handle a missing table, unavailable clipboard or rejected write.",
    },
    {
      name: "timeout",
      type: "number",
      default: "2000",
      description: "Copied-feedback duration in milliseconds.",
    },
    {
      name: "children / copiedChildren",
      type: "ReactNode",
      default: "Copy / check icons",
      description: "Contents for idle and copied states.",
    },
    {
      name: "Button props",
      type: "ButtonProps except onCopy and onError",
      default: 'variant="ghost", size="icon-sm"',
      description: "Control disabled/loading state, styling and handlers on the menu trigger.",
    },
  ],
  TableDownloadMenu: [
    {
      name: "filename",
      type: "string",
      default: '"table"',
      description: "Download basename; the selected format appends .csv or .md.",
    },
    {
      name: "onDownload",
      type: '(format: "csv" | "markdown") => void',
      default: "—",
      description: "Called after starting the download of current rendered header and body text.",
    },
    {
      name: "onError",
      type: "(error: Error) => void",
      default: "—",
      description: "Handle a missing table or a failed download.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "Download icon",
      description: "Replace the menu trigger contents.",
    },
    {
      name: "Button props",
      type: "ButtonProps except onError",
      default: 'variant="ghost", size="icon-sm"',
      description: "Control disabled/loading state, styling and handlers on the menu trigger.",
    },
  ],
  TableFullscreen: [
    {
      name: "open / defaultOpen",
      type: "boolean",
      default: "Uncontrolled / false",
      description: "Controlled or initial fullscreen dialog state.",
    },
    {
      name: "onOpenChange / onOpenChangeComplete",
      type: "Dialog callbacks",
      default: "—",
      description: "Respond to dismissal and completed transitions.",
    },
    {
      name: "modal / disablePointerDismissal",
      type: 'boolean | "trap-focus" / boolean',
      default: "true / false",
      description: "Uses the Dialog root contract for focus, scrolling and dismissal.",
    },
    {
      name: "children / actionsRef / handle",
      type: "DialogProps",
      default: "—",
      description:
        "Other Dialog root props, including trigger identity and payload composition, are supported.",
    },
  ],
  TableFullscreenTrigger: [
    {
      name: "children",
      type: "ReactNode",
      default: "Fullscreen icon",
      description: "Replace the control contents.",
    },
    {
      name: "render",
      type: "ReactElement | render function",
      default: "Ghost Button, size icon-sm",
      description: "Replace the trigger element while retaining dialog behavior.",
    },
    {
      name: "aria-label / title",
      type: "string",
      default: 'labels.fullscreen ("View fullscreen")',
      description: "Accessible name and tooltip for the fullscreen action.",
    },
    {
      name: "disabled / ref / onClick",
      type: "DialogTriggerProps",
      default: "—",
      description: "Also accepts DialogTrigger state-aware styling and native handlers.",
    },
  ],
  TableFullscreenContent: [
    {
      name: "label",
      type: "ReactNode",
      default: 'labels.view ("Table view")',
      description: "Accessible dialog title in the fullscreen header.",
    },
    {
      name: "closeLabel",
      type: "string",
      default: 'labels.exitFullscreen ("Exit fullscreen")',
      description: "Accessible name for the close control.",
    },
    {
      name: "closeChildren",
      type: "ReactNode",
      default: "Close icon",
      description: "Replace the close control contents.",
    },
    {
      name: "portalProps / backdropProps",
      type: "DialogPortalProps / DialogBackdropProps",
      default: "—",
      description:
        "Customize portalling and the backdrop. The portal inherits its container's theme by default.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description:
        "Explicit fullscreen table contents; render the table again inside a scrollable viewport.",
    },
    {
      name: "initialFocus / finalFocus / className / render / ref",
      type: "DialogPopupProps",
      default: "Inset fullscreen surface",
      description:
        "Customize focus, surface styling, element and ref through the DialogPopup contract.",
    },
  ],
  TableLabels: [
    {
      name: "copy / download / fullscreen / exitFullscreen / view",
      type: "string",
      default: "Copy table / Download table / View fullscreen / Exit fullscreen / Table view",
      description: "Accessible action names and fullscreen title.",
    },
    {
      name: "copied / copyError / downloadError",
      type: "string",
      default: "Copied to clipboard / Unable to copy table / Unable to download table",
      description: "Polite live-feedback messages.",
    },
    {
      name: "markdown / csv / tsv",
      type: "string",
      default: "Markdown / CSV / TSV",
      description: "Visible format labels in action menus.",
    },
    {
      name: "copyMarkdown / copyCsv / copyTsv",
      type: "string",
      default: "Copy table as Markdown / CSV / TSV",
      description: "Accessible names for each copy format.",
    },
    {
      name: "downloadCsv / downloadMarkdown",
      type: "string",
      default: "Download table as CSV / Markdown",
      description: "Accessible names for each download format.",
    },
  ],
  Serialization: [
    {
      name: "extractTableData(table)",
      type: "(HTMLTableElement) => TableData",
      default: "—",
      description:
        "Extract the outer table’s header and body cells as { headers: string[], rows: string[][] }. Nested table text stays within its containing cell; nested rows are not extra entries. Captions, footers and merged-cell expansion are excluded.",
    },
    {
      name: "tableDataToCSV(data)",
      type: "(TableData) => string",
      default: "—",
      description: "Serialize headers and rows, quoting commas, quotes and line breaks.",
    },
    {
      name: "tableDataToTSV(data)",
      type: "(TableData) => string",
      default: "—",
      description: "Serialize headers and rows, escaping tabs and line breaks.",
    },
    {
      name: "tableDataToMarkdown(data)",
      type: "(TableData) => string",
      default: "—",
      description:
        "Serialize an escaped Markdown table; cell line breaks become <br>. Returns an empty string without headers.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
