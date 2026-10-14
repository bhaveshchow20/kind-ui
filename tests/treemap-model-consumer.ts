import {
  normalizeTreemap,
  type TreemapAccessors,
  type TreemapModel,
  type TreemapNode,
} from "@kind-ui/charts";

const standard: readonly TreemapNode[] = [
  {
    kind: "group",
    id: "root",
    label: "Root",
    children: [{ kind: "leaf", id: "child", label: "Child", value: 0 }],
  },
];
const standardModel: TreemapModel<TreemapNode> = normalizeTreemap(standard);
void standardModel;

interface RecordDatum {
  key: string;
  title: string;
  amount?: number;
  members?: readonly RecordDatum[];
  metadata: { unit: string };
}
const records: readonly RecordDatum[] = [];
const accessors: TreemapAccessors<RecordDatum> = {
  id: (datum) => datum.key,
  label: (datum) => datum.title,
  children: (datum) => datum.members,
  value: (datum) => datum.amount ?? 0,
};
const customModel = normalizeTreemap(records, accessors);
const unit: string | undefined = customModel.roots[0]?.datum.metadata.unit;
void unit;

// @ts-expect-error Custom record fields require explicit typed accessors.
normalizeTreemap(records);
// @ts-expect-error Group area derives from children and cannot be supplied independently.
const invalidGroup: TreemapNode = {
  kind: "group",
  id: "group",
  label: "Group",
  children: [],
  value: 1,
};
void invalidGroup;
// @ts-expect-error Leaves cannot also supply children.
const invalidLeaf: TreemapNode = {
  kind: "leaf",
  id: "leaf",
  label: "Leaf",
  value: 1,
  children: [],
};
void invalidLeaf;
// @ts-expect-error Area accessors must return a number; missing area requires a caller policy.
normalizeTreemap(records, { ...accessors, value: (datum) => datum.amount });
