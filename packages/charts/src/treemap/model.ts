/** Standard hierarchy records. Group area is always derived from descendants. */
export type TreemapDatum =
  | {
      readonly kind?: "leaf";
      readonly id: string;
      readonly label: string;
      readonly value: number;
      readonly children?: never;
    }
  | {
      readonly kind?: "group";
      readonly id: string;
      readonly label: string;
      readonly children: readonly TreemapDatum[];
      readonly value?: never;
    };

/** Undefined children identify a leaf; an empty array identifies an empty group. */
export interface TreemapAccessors<T> {
  id: (datum: T) => string;
  label: (datum: T) => string;
  children: (datum: T) => readonly T[] | undefined;
  /** Called for leaves only. Missing area requires an explicit caller policy. */
  value: (datum: T) => number;
}

export interface TreemapNode<T> {
  readonly id: string;
  readonly label: string;
  readonly kind: "leaf" | "group";
  readonly parentId: string | null;
  /** Forest roots have depth zero. */
  readonly depth: number;
  /** Root-to-node stable IDs, including this node. */
  readonly path: readonly string[];
  readonly datum: T;
  readonly value: number;
  readonly children: readonly TreemapNode<T>[];
  /** Share of the supplied forest; null when its total is zero. */
  readonly rootShare: number | null;
  /** Share of the parent, or forest for roots; null when that total is zero. */
  readonly parentShare: number | null;
}

export interface TreemapModel<T> {
  readonly roots: readonly TreemapNode<T>[];
  /** All nodes in caller order, with parents preceding their descendants. */
  readonly nodes: readonly TreemapNode<T>[];
  readonly byId: ReadonlyMap<string, TreemapNode<T>>;
  readonly total: number;
}

type MutableNode<T> = {
  -readonly [K in keyof TreemapNode<T>]: TreemapNode<T>[K];
};

function fail(location: string, reason: string): never {
  throw new Error(`Treemap ${location}: ${reason}.`);
}

function standardRecord(datum: unknown): Record<string, unknown> {
  // Record shape is checked with its location before these accessors run.
  return datum as Record<string, unknown>;
}

const standardAccessors: TreemapAccessors<unknown> = {
  id: (datum) => standardRecord(datum).id as string,
  label: (datum) => standardRecord(datum).label as string,
  children: (datum) => standardRecord(datum).children as readonly unknown[] | undefined,
  value: (datum) => standardRecord(datum).value as number,
};

export function normalizeTreemap(data: readonly TreemapDatum[]): TreemapModel<TreemapDatum>;
export function normalizeTreemap<T>(
  data: readonly T[],
  accessors: TreemapAccessors<T>,
): TreemapModel<T>;
export function normalizeTreemap<T>(
  data: readonly T[],
  accessors?: TreemapAccessors<T>,
): TreemapModel<T> {
  if (!Array.isArray(data)) fail("data", "expected an array of records");
  // The no-accessor overload accepts only TreemapDatum; its fields are validated below.
  const read = accessors ?? (standardAccessors as TreemapAccessors<T>);
  const byId = new Map<string, MutableNode<T>>();
  const nodes: MutableNode<T>[] = [];
  const seen = new Map<object, string>();
  const ancestors = new Set<object>();

  function sum(children: readonly TreemapNode<T>[], location: string): number {
    let total = 0;
    for (const child of children) {
      total += child.value;
      if (!Number.isFinite(total)) fail(location, "derived total must be finite");
    }
    return total;
  }

  function visit(datum: T, parent: MutableNode<T> | null, index: number): MutableNode<T> {
    const position = parent ? `${parent.path.join(" / ")} children[${index}]` : `data[${index}]`;
    const identity = typeof datum === "object" && datum !== null ? datum : null;
    if (!accessors && !identity) fail(position, "expected a record");
    if (identity && ancestors.has(identity)) fail(position, "cycle detected in hierarchy");
    if (identity && seen.has(identity)) {
      fail(position, `record from ${seen.get(identity)} reused in hierarchy`);
    }

    const id = read.id(datum);
    if (typeof id !== "string" || id.trim().length === 0) {
      fail(position, "id must be a nonempty string");
    }
    const location = `${position} (${id})`;
    if (byId.has(id)) fail(location, `duplicate id ${JSON.stringify(id)}`);
    const label = read.label(datum);
    if (typeof label !== "string" || label.trim().length === 0) {
      fail(location, "label must be a nonempty string");
    }
    const children = read.children(datum);
    if (children !== undefined && !Array.isArray(children)) {
      fail(location, "children must be an array or undefined");
    }
    if (!accessors) {
      const record = standardRecord(datum);
      const kind = record.kind ?? (children === undefined ? "leaf" : "group");
      if (kind !== "leaf" && kind !== "group") {
        fail(location, 'kind must be "leaf" or "group"');
      }
      if (kind === "group") {
        if (children === undefined) fail(location, "group children must be an array");
        if ("value" in record) fail(location, "group cannot supply independent value");
      } else if (children !== undefined) {
        fail(location, "leaf cannot supply children");
      }
    }

    const node: MutableNode<T> = {
      id,
      label,
      kind: children === undefined ? "leaf" : "group",
      parentId: parent?.id ?? null,
      depth: parent ? parent.depth + 1 : 0,
      path: [...(parent?.path ?? []), id],
      datum,
      value: 0,
      children: [],
      rootShare: null,
      parentShare: null,
    };
    byId.set(id, node);
    nodes.push(node);
    if (identity) {
      seen.set(identity, location);
      ancestors.add(identity);
    }
    if (children === undefined) {
      const value = read.value(datum);
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        fail(location, "leaf value must be a finite nonnegative number");
      }
      node.value = value === 0 ? 0 : value;
    } else {
      node.children = Array.from(children, (child, childIndex) => {
        if (!(childIndex in children)) {
          fail(`${node.path.join(" / ")} children[${childIndex}]`, "expected a record");
        }
        return visit(child, node, childIndex);
      });
      node.value = sum(node.children, location);
    }
    if (identity) ancestors.delete(identity);
    return node;
  }

  const roots = Array.from(data, (datum, index) => {
    if (!(index in data)) fail(`data[${index}]`, "expected a record");
    return visit(datum, null, index);
  });
  const total = sum(roots, "data");
  for (const node of nodes) {
    node.rootShare = total > 0 ? node.value / total : null;
    const parentTotal = node.parentId === null ? total : byId.get(node.parentId)?.value;
    node.parentShare = parentTotal && parentTotal > 0 ? node.value / parentTotal : null;
  }
  return { roots, nodes, byId, total };
}
