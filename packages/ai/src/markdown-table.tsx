"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableCopyMenu,
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
} from "@kind-ui/primitives/table";
import { type ComponentProps, useContext } from "react";
import { defaultTranslations, type ExtraProps, StreamdownContext } from "streamdown";
import { MarkdownRenderContext } from "./markdown-context.js";

/** Parsed cells remain React children; the shared primitive owns table behavior. */
export function MarkdownTable({
  node: _node,
  children,
  ...props
}: ComponentProps<"table"> & ExtraProps) {
  const configuration = useContext(MarkdownRenderContext);
  const context = useContext(StreamdownContext);
  const controls = configuration.controls ?? context.controls;
  const tableControls = typeof controls === "boolean" ? controls : controls.table;
  const copy = typeof tableControls === "boolean" ? tableControls : tableControls?.copy !== false;
  const download =
    typeof tableControls === "boolean" ? tableControls : tableControls?.download !== false;
  const fullscreen =
    typeof tableControls === "boolean" ? tableControls : tableControls?.fullscreen !== false;
  const disabled = configuration.isAnimating ?? context.isAnimating;
  const translations = { ...defaultTranslations, ...configuration.translations };
  const icons = configuration.icons;
  const CopyIcon = icons?.CopyIcon;
  const CheckIcon = icons?.CheckIcon;
  const DownloadIcon = icons?.DownloadIcon;
  const FullscreenIcon = icons?.Maximize2Icon;
  const CloseIcon = icons?.XIcon;
  const labels = {
    copy: translations.copyTable,
    download: translations.downloadTable,
    fullscreen: translations.viewFullscreen,
    exitFullscreen: translations.exitFullscreen,
    copied: translations.copied,
    csv: translations.tableFormatCsv,
    tsv: translations.tableFormatTsv,
    markdown: translations.tableFormatMarkdown,
    copyCsv: translations.copyTableAsCsv,
    copyTsv: translations.copyTableAsTsv,
    copyMarkdown: translations.copyTableAsMarkdown,
    downloadCsv: translations.downloadTableAsCsv,
    downloadMarkdown: translations.downloadTableAsMarkdown,
  };
  const actions = (
    <>
      {copy && (
        <TableCopyMenu
          disabled={disabled}
          copiedChildren={CheckIcon ? <CheckIcon aria-hidden="true" /> : undefined}
        >
          {CopyIcon ? <CopyIcon aria-hidden="true" /> : undefined}
        </TableCopyMenu>
      )}
      {download && (
        <TableDownloadMenu disabled={disabled}>
          {DownloadIcon ? <DownloadIcon aria-hidden="true" /> : undefined}
        </TableDownloadMenu>
      )}
    </>
  );
  // The normal table retains its native ref and ID when a second view opens.
  const { ref: _ref, id: _id, ...fullscreenProps } = props;
  return (
    <TableContainer className="my-4" labels={labels}>
      {(copy || download || fullscreen) && (
        <TableToolbar>
          {actions}
          {fullscreen && (
            <TableFullscreen>
              <TableFullscreenTrigger disabled={disabled} aria-label={translations.viewFullscreen}>
                {FullscreenIcon ? <FullscreenIcon aria-hidden="true" /> : undefined}
              </TableFullscreenTrigger>
              <TableFullscreenContent
                label={translations.viewFullscreen}
                closeLabel={translations.exitFullscreen}
                closeChildren={CloseIcon ? <CloseIcon aria-hidden="true" /> : undefined}
              >
                {(copy || download) && <TableToolbar>{actions}</TableToolbar>}
                <TableViewport>
                  <Table {...fullscreenProps}>{children}</Table>
                </TableViewport>
              </TableFullscreenContent>
            </TableFullscreen>
          )}
        </TableToolbar>
      )}
      <TableViewport>
        <Table {...props}>{children}</Table>
      </TableViewport>
    </TableContainer>
  );
}

function MarkdownTableHeader({ node: _node, ...props }: ComponentProps<"thead"> & ExtraProps) {
  return <TableHeader {...props} />;
}
function MarkdownTableBody({ node: _node, ...props }: ComponentProps<"tbody"> & ExtraProps) {
  return <TableBody {...props} />;
}
function MarkdownTableFooter({ node: _node, ...props }: ComponentProps<"tfoot"> & ExtraProps) {
  return <TableFooter {...props} />;
}
function MarkdownTableRow({ node: _node, ...props }: ComponentProps<"tr"> & ExtraProps) {
  return <TableRow {...props} />;
}
function MarkdownTableHead({ node: _node, ...props }: ComponentProps<"th"> & ExtraProps) {
  return <TableHead {...props} />;
}
function MarkdownTableCell({ node: _node, ...props }: ComponentProps<"td"> & ExtraProps) {
  return <TableCell {...props} />;
}
function MarkdownTableCaption({ node: _node, ...props }: ComponentProps<"caption"> & ExtraProps) {
  return <TableCaption {...props} />;
}

export const markdownTableComponents = {
  table: MarkdownTable,
  thead: MarkdownTableHeader,
  tbody: MarkdownTableBody,
  tfoot: MarkdownTableFooter,
  tr: MarkdownTableRow,
  th: MarkdownTableHead,
  td: MarkdownTableCell,
  caption: MarkdownTableCaption,
};
