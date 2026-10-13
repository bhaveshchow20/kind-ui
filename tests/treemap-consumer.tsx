import {
  type TreemapAccessors,
  TreemapChart,
  type TreemapChartProps,
  type TreemapColorEncoding,
  type TreemapDataTableProps,
  type TreemapDatum,
  type TreemapItem,
  useTreemap,
} from "@kind-ui/charts";
import { createRef } from "react";

interface MetadataRecord {
  key: string;
  name: string;
  size?: number;
  metric: number | null;
  members?: readonly MetadataRecord[];
  metadata: { unit: string; observedAt: Date };
}

const records: readonly MetadataRecord[] = [];
const accessors: TreemapAccessors<MetadataRecord> = {
  id: (datum) => datum.key,
  label: (datum) => datum.name,
  children: (datum) => datum.members,
  value: (datum) => datum.size ?? 0,
};
const encoding: TreemapColorEncoding<MetadataRecord> = {
  type: "diverging",
  value: (datum, node) => {
    const unit: string = node.datum.metadata.unit;
    const original: MetadataRecord = datum;
    void [unit, original];
    return datum.metric;
  },
  groupValue: (datum) => datum.metric,
  domainScope: "view",
  domain: [-10, 10],
};

const inspect = (item: TreemapItem<MetadataRecord>) => {
  const original: MetadataRecord = item.datum;
  const unit: string = item.datum.metadata.unit;
  const observedAt: Date = item.datum.metadata.observedAt;
  const path: readonly string[] = item.path;
  const shares: readonly (number | null)[] = [item.rootShare, item.parentShare, item.viewShare];
  const position: number | undefined = item.rectangle?.x;
  void [original, unit, observedAt, path, shares, position];
};

const props: TreemapChartProps<MetadataRecord> = {
  data: records,
  accessors,
  encoding,
  config: {},
  "aria-label": "Resource allocation",
  children: null,
  onActivate: inspect,
  onSelectionChange: (id, item) => {
    const stableId: string | null = id;
    if (item) inspect(item);
    void stableId;
  },
  onViewChange: (id, item) => {
    const stableId: string | null = id;
    if (item) inspect(item);
    void stableId;
  },
  onActiveChange: (id, item) => {
    const stableId: string | null = id;
    if (item) inspect(item);
    void stableId;
  },
};

void (
  <TreemapChart<MetadataRecord> {...props}>
    <TreemapChart.Tiles<MetadataRecord>
      tileProps={(node) => ({
        ref: createRef<HTMLButtonElement>(),
        "aria-label": `${node.datum.metadata.unit}: ${node.width}`,
      })}
    >
      {(node) => {
        const width: number = node.width;
        const share: number | null = node.viewShare;
        const date: Date = node.datum.metadata.observedAt;
        void [width, share, date];
        return node.datum.name;
      }}
    </TreemapChart.Tiles>
    <TreemapChart.Tooltip<MetadataRecord>>
      {(item) => {
        inspect(item);
        return item.datum.metadata.unit;
      }}
    </TreemapChart.Tooltip>
    <TreemapChart.DataTable<MetadataRecord> caption="All resources">
      {(item) => {
        inspect(item);
        return <td>{item.datum.metadata.unit}</td>;
      }}
    </TreemapChart.DataTable>
  </TreemapChart>
);

function ConsumerInspector() {
  const context = useTreemap<MetadataRecord>();
  const original: MetadataRecord | undefined = context.model.nodes[0]?.datum;
  const unit: string | undefined = context.rectangles[0]?.datum.metadata.unit;
  const item = context.items.get("resource");
  if (item) inspect(item);
  context.setView(null);
  void [original, unit];
  return null;
}
void ConsumerInspector;

// Inline standard data infers its literal discriminant and retains additional metadata.
void (
  <TreemapChart
    config={{}}
    aria-label="Inline allocation"
    data={[
      { kind: "leaf", id: "resource", label: "Resource", value: 10, metadata: { unit: "GB" } },
    ]}
    onActivate={(item) => {
      const kind: "leaf" = item.datum.kind;
      const unit: "GB" = item.datum.metadata.unit;
      void [kind, unit];
    }}
  >
    <TreemapChart.Tiles />
  </TreemapChart>
);

void (
  (
    // @ts-expect-error Custom records require accessors even when their generic is inferred.
    <TreemapChart data={records} config={{}} aria-label="Missing adapter">
      {null}
    </TreemapChart>
  )
);

const wrongCallback: TreemapChartProps<MetadataRecord> = {
  ...props,
  // @ts-expect-error Stable ID callbacks receive a string or null, not a number.
  onSelectionChange: (id: number) => {
    void id;
  },
};
void wrongCallback;

// @ts-expect-error Standard groups cannot supply independent area values.
const ambiguousGroup: TreemapDatum = {
  kind: "group",
  id: "group",
  label: "Group",
  children: [],
  value: 1,
};
void ambiguousGroup;

void (
  (
    // @ts-expect-error The owning chart requires explicit children.
    <TreemapChart<MetadataRecord>
      data={records}
      accessors={accessors}
      config={{}}
      aria-label="Missing parts"
    />
  )
);

const wrongRoot: TreemapChartProps<MetadataRecord> = {
  ...props,
  // @ts-expect-error Root native props stay direct; nested rootProps are unsupported.
  rootProps: { id: "nested" },
};
void wrongRoot;

const wrongArea: TreemapAccessors<MetadataRecord> = {
  ...accessors,
  // @ts-expect-error Area accessors require numbers, independently of color formatters.
  value: (datum) => String(datum.size),
};
void wrongArea;

// An inline root group does not describe the leaf records passed to callbacks.
void (
  <TreemapChart
    config={{}}
    aria-label="Nested inline allocation"
    data={[
      {
        kind: "group",
        id: "root",
        label: "Root",
        groupOnly: "root metadata",
        children: [
          {
            kind: "group",
            id: "nested",
            label: "Nested",
            groupOnly: "nested metadata",
            children: [{ kind: "leaf", id: "leaf", label: "Leaf", value: 2, unit: "GB" }],
          },
        ],
      },
    ]}
    onActivate={(item) => {
      if (item.datum.kind === "leaf") {
        const unit: "GB" = item.datum.unit;
        void unit;
      } else {
        const children: readonly unknown[] = item.datum.children;
        void children;
      }
      // @ts-expect-error Descendant leaves do not have root-only metadata.
      void item.datum.groupOnly;
    }}
    formatValue={(value, item) =>
      item.datum.kind === "leaf" ? `${value} ${item.datum.unit}` : String(value)
    }
    encoding={{
      type: "sequential",
      value: (datum) => (datum.kind === "leaf" ? datum.value : null),
    }}
  >
    <TreemapChart.Tiles />
  </TreemapChart>
);

const wrongVisibility: TreemapChartProps<MetadataRecord> = {
  ...props,
  // @ts-expect-error Treemap does not support series visibility.
  visibleSeries: [],
};
const wrongDefaultVisibility: TreemapChartProps<MetadataRecord> = {
  ...props,
  // @ts-expect-error Treemap does not support default series visibility.
  defaultVisibleSeries: [],
};
const wrongVisibilityCallback: TreemapChartProps<MetadataRecord> = {
  ...props,
  // @ts-expect-error Treemap does not support series visibility callbacks.
  onVisibleSeriesChange: () => {},
};
void [wrongVisibility, wrongDefaultVisibility, wrongVisibilityCallback];

const tablePresentation: TreemapDataTableProps<MetadataRecord> = {
  caption: "Resource metadata",
  rowProps: (node) => ({
    className: node.datum.metadata.unit,
    ref: createRef<HTMLTableRowElement>(),
    onClick: (event) => {
      const row: HTMLTableRowElement = event.currentTarget;
      void row;
    },
  }),
  children: (item) => {
    inspect(item);
    const unit: string = item.datum.metadata.unit;
    return <td>{unit}</td>;
  },
};
void (<TreemapChart.DataTable<MetadataRecord> {...tablePresentation} />);

const conflictingRowCells: TreemapDataTableProps<MetadataRecord> = {
  caption: "Conflicting row presentation",
  // @ts-expect-error Row prop bags cannot supply cells; use the table's typed children renderer.
  rowProps: () => ({ className: "consumer-row", children: "Discarded cells" }),
};
void conflictingRowCells;

// Accessor-owned records can use children for unrelated metadata.
interface CustomChildrenRecord {
  key: string;
  name: string;
  size: number;
  children: readonly { note: string }[];
  members?: readonly CustomChildrenRecord[];
}
const customChildren: readonly CustomChildrenRecord[] = [];
void (
  <TreemapChart
    data={customChildren}
    config={{}}
    aria-label="Custom children metadata"
    accessors={{
      id: (datum) => datum.key,
      label: (datum) => datum.name,
      value: (datum) => datum.size,
      children: (datum) => datum.members,
    }}
    onActivate={(item) => {
      const original: CustomChildrenRecord = item.datum;
      const key: string = item.datum.key;
      void [original, key];
    }}
  >
    {null}
  </TreemapChart>
);
