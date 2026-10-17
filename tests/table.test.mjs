import assert from "node:assert/strict";
import test from "node:test";
import * as P from "@kind-ui/primitives";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

function sample(props = {}) {
  return h(
    P.Table,
    props,
    h(P.TableCaption, null, "Quarterly sales"),
    h(
      P.TableHeader,
      null,
      h(
        P.TableRow,
        null,
        h(P.TableHead, null, "Region"),
        h(P.TableHead, { scope: "row", style: { textAlign: "right" } }, "Total"),
      ),
    ),
    h(
      P.TableBody,
      null,
      h(
        P.TableRow,
        null,
        h(P.TableCell, null, h("strong", null, "North")),
        h(
          P.TableCell,
          { colSpan: 2, className: "px-6 text-right", style: { textAlign: "right" } },
          0,
        ),
      ),
    ),
    h(P.TableFooter, null, h(P.TableRow, null, h(P.TableCell, null, "End"))),
  );
}

test("Table native parts preserve semantics, rich children, native attributes and overrides", () => {
  const output = render(
    sample({ id: "sales", title: "A native table", className: "text-lg", style: { width: 420 } }),
  );
  assert.match(output, /^<table /);
  assert.match(output, /tabindex="0"/);
  assert.match(output, /id="sales"/);
  assert.match(output, /width:420px/);
  assert.match(output, /text-lg/);
  assert.doesNotMatch(output, /text-\[13px\]/);
  assert.match(output, /<caption[^>]*>Quarterly sales<\/caption>/);
  assert.match(output, /<thead /);
  assert.match(output, /<tbody /);
  assert.match(output, /<tfoot /);
  assert.match(output, /<th[^>]*scope="col"/);
  assert.match(output, /<th[^>]*scope="row"[^>]*text-align:right/);
  assert.match(output, /<td[^>]*colSpan="2"[^>]*text-align:right[^>]*>0<\/td>/i);
  assert.match(output, /<strong>North<\/strong>/);
  assert.match(render(sample({ tabIndex: -1 })), /tabindex="-1"/);
});

test("Table layout and action controls compose independently with translated labels", () => {
  const output = render(
    h(
      P.TableContainer,
      {
        labels: { copy: "Copier", download: "Enregistrer", fullscreen: "Agrandir" },
        className: "rounded-none",
        "data-owner": "consumer",
      },
      h(
        P.TableFullscreen,
        null,
        h(
          P.TableToolbar,
          { "aria-label": "Table actions" },
          h(P.TableCopyMenu, { disabled: true }),
          h(P.TableDownloadMenu),
          h(P.TableFullscreenTrigger),
        ),
        h(P.TableViewport, { className: "max-h-80" }, sample()),
        h(P.TableFullscreenContent, null, sample()),
      ),
    ),
  );
  assert.match(output, /data-owner="consumer"/);
  assert.match(output, /rounded-none/);
  assert.match(output, /max-h-80/);
  assert.match(output, /overflow-x-auto/);
  assert.match(output, /aria-label="Copier"/);
  assert.match(output, /aria-label="Enregistrer"/);
  assert.match(output, /aria-label="Agrandir"/);
  assert.equal((output.match(/data-slot="button-content"/g) ?? []).length, 3);
  assert.match(output, /disabled=""/);
  assert.match(output, /pointer-coarse:size-11/);
  assert.match(output, /size-7 min-h-7 min-w-7/);
  assert.doesNotMatch(output, /buttonState|=&gt;/);
  assert.equal((output.match(/<table /g) ?? []).length, 1);
});

test("Table controls require the nearest DOM container while native parts remain standalone", () => {
  for (const Part of [
    P.TableCopyMenu,
    P.TableDownloadMenu,
    P.TableFullscreenTrigger,
    P.TableFullscreenContent,
  ]) {
    assert.throws(() => render(h(Part)), /within TableContainer/);
  }
  assert.doesNotThrow(() => render(sample()));
  const output = render(h(P.TableContainer, null, h(P.TableViewport, null, sample())));
  assert.doesNotMatch(output, /<button|table-toolbar/);
});

test("CSV preserves empty rows and quotes commas, quotes, CR and LF without mutating input", () => {
  const data = {
    headers: ["Name", "Value"],
    rows: [["a,b", 'a"b'], ["line\rbreak", "line\nbreak"], ["", ""], []],
  };
  const original = structuredClone(data);
  assert.equal(
    P.tableDataToCSV(data),
    'Name,Value\n"a,b","a""b"\n"line\rbreak","line\nbreak"\n,\n',
  );
  assert.deepEqual(data, original);
  assert.equal(P.tableDataToCSV({ headers: [], rows: [] }), "");
  assert.equal(P.tableDataToCSV({ headers: [], rows: [["A", "B"]] }), "A,B");
  assert.equal(P.tableDataToCSV({ headers: ["One"], rows: [["value"]] }), "One\nvalue");
});

test("TSV escapes delimiters and line endings as literal sequences while retaining raw quotes", () => {
  assert.equal(
    P.tableDataToTSV({
      headers: ["A", "B"],
      rows: [["one\ttwo", "line\r\nnext"], ['a"b', ""], []],
    }),
    'A\tB\none\\ttwo\tline\\r\\nnext\na"b\t\n',
  );
  assert.equal(P.tableDataToTSV({ headers: [], rows: [["value"]] }), "value");
  assert.equal(P.tableDataToTSV({ headers: [], rows: [] }), "");
});

test("Markdown escapes slashes and pipes, pads short rows and retains excess cells", () => {
  const data = { headers: ["A|B", "C\\D"], rows: [["value"], ["a\\|b", "second", "extra"], []] };
  const original = structuredClone(data);
  assert.equal(
    P.tableDataToMarkdown(data),
    "| A\\|B | C\\\\D |\n| --- | --- |\n| value |  |\n| a\\\\\\|b | second | extra |\n|  |  |",
  );
  assert.deepEqual(data, original);
  assert.equal(P.tableDataToMarkdown({ headers: [], rows: [["value"]] }), "");
  assert.equal(P.tableDataToMarkdown({ headers: ["A"], rows: [] }), "| A |\n| --- |");
});

test("Markdown normalizes CRLF, CR and LF inside headers and cells without adding rows", () => {
  const data = {
    headers: ["First\r\nsecond", "A|B\rC\\D"],
    rows: [
      ["one\ntwo", "three\rfour\r\nfive"],
      ["", "unchanged"],
    ],
  };
  const original = structuredClone(data);
  assert.equal(
    P.tableDataToMarkdown(data),
    "| First<br>second | A\\|B<br>C\\\\D |\n| --- | --- |\n| one<br>two | three<br>four<br>five |\n|  | unchanged |",
  );
  assert.deepEqual(data, original);
});
