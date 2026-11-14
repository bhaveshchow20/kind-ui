import {
  extractTableData,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableCopyMenu,
  type TableData,
  TableDownloadMenu,
  TableFooter,
  TableFullscreen,
  TableFullscreenContent,
  TableFullscreenTrigger,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableViewport,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "@kind-ui/primitives";
import { createRef } from "react";

const container = createRef<HTMLDivElement>();
const table = createRef<HTMLTableElement>();
const head = createRef<HTMLTableSectionElement>();
const cell = createRef<HTMLTableCellElement>();
const row = createRef<HTMLTableRowElement>();
const caption = createRef<HTMLTableCaptionElement>();
const button = createRef<HTMLButtonElement>();

export const composedTable = (
  <TableContainer ref={container} labels={{ copy: "Copy data", copyCsv: "Copy comma separated" }}>
    <TableFullscreen open={false} onOpenChange={(_open, details) => details.cancel()}>
      <TableToolbar ref={container}>
        <TableCopyMenu
          ref={button}
          onCopy={(format) => format satisfies "markdown" | "csv" | "tsv"}
          onError={(error) => error.message}
          onClick={(event) => event.preventDefault()}
          className={(state) => (state.disabled ? "opacity-50" : "")}
        />
        <TableDownloadMenu
          filename="sales"
          ref={button}
          onDownload={(format) => format satisfies "csv" | "markdown"}
          onError={(error) => error.message}
        />
        <TableFullscreenTrigger ref={button} render={<button type="button" />} />
      </TableToolbar>
      <TableViewport ref={container} style={{ maxHeight: 240 }}>
        <Table ref={table} tabIndex={0} onKeyDown={(event) => event.currentTarget.focus()}>
          <TableCaption ref={caption}>Sales</TableCaption>
          <TableHeader ref={head}>
            <TableRow ref={row}>
              <TableHead ref={cell} scope="col" colSpan={2}>
                Region
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={head}>
            <TableRow ref={row}>
              <TableCell ref={cell} align="right" rowSpan={2} style={{ textAlign: "right" }}>
                North
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter ref={head}>
            <TableRow>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableViewport>
      <TableFullscreenContent
        ref={container}
        label="Sales table"
        closeLabel="Close sales"
        initialFocus={button}
        finalFocus={button}
        portalProps={{ keepMounted: true }}
        backdropProps={{ className: "bg-black/60" }}
        className={(state) => (state.open ? "consumer-open" : "")}
      >
        <TableToolbar>
          <TableCopyMenu />
          <TableDownloadMenu />
        </TableToolbar>
      </TableFullscreenContent>
    </TableFullscreen>
  </TableContainer>
);
export function serializeTable(element: HTMLTableElement): string[] {
  const data: TableData = extractTableData(element);
  return [tableDataToCSV(data), tableDataToTSV(data), tableDataToMarkdown(data)];
}
// @ts-expect-error A div ref cannot replace the native table ref.
export const invalidTableRef = <Table ref={container} />;
// @ts-expect-error Row spans retain the platform's numeric contract.
export const invalidCellSpan = <TableCell rowSpan="two" />;
// @ts-expect-error Serializers receive strings rather than a universal cell schema.
export const invalidTableData: TableData = { headers: ["One"], rows: [[{ text: "value" }]] };
// @ts-expect-error Download formats are CSV and Markdown.
export const invalidDownloadCallback = <TableDownloadMenu onDownload={(format: "tsv") => format} />;
