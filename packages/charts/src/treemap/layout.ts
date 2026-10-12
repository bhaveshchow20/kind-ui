import {
  type HierarchyRectangularNode,
  hierarchy,
  treemap,
  treemapResquarify,
  treemapSquarify,
} from "d3-hierarchy";
import type { TreemapModel, TreemapNode } from "./model.js";

export type TreemapRectangle<T> = TreemapNode<T> & {
  x: number;
  y: number;
  width: number;
  height: number;
  viewShare: number | null;
};
export type TreemapLayoutOptions = {
  width: number;
  height: number;
  depth?: number;
  padding?: number;
  groupHeaderHeight?: number;
  layout?: "stable" | "squarify";
};
type LayoutDatum = { id: string; value: number; children?: LayoutDatum[] };
/** A chart-local cache retains resquarify rows only while topology and view are unchanged. */
export type TreemapLayoutCache = {
  signature: string;
  geometrySignature: string;
  root: HierarchyRectangularNode<LayoutDatum>;
};
export function layoutTreemap<T>(
  model: TreemapModel<T>,
  viewId: string | null,
  options: TreemapLayoutOptions,
  previous?: TreemapLayoutCache,
) {
  const {
    width,
    height,
    depth = Infinity,
    padding = 2,
    groupHeaderHeight = 20,
    layout = "stable",
  } = options;
  for (const [name, value] of [
    ["width", width],
    ["height", height],
    ["padding", padding],
    ["groupHeaderHeight", groupHeaderHeight],
  ] as const)
    if (!Number.isFinite(value) || value < 0)
      throw new Error(`Treemap ${name} must be finite and nonnegative`);
  if (layout !== "stable" && layout !== "squarify")
    throw new Error("Treemap layout must be stable or squarify");
  if (depth !== Infinity && (!Number.isInteger(depth) || depth < 1))
    throw new Error("Treemap depth must be a positive integer");
  const view = viewId === null ? undefined : model.byId.get(viewId);
  const roots = view?.children ?? model.roots;
  const convert = (node: TreemapNode<T>): LayoutDatum => ({
    id: node.id,
    value: node.kind === "leaf" ? node.value : 0,
    ...(node.kind === "group"
      ? { children: node.children.map(convert).sort((a, b) => a.id.localeCompare(b.id)) }
      : {}),
  });
  const data: LayoutDatum = {
    id: "",
    value: 0,
    children: roots.map(convert).sort((a, b) => a.id.localeCompare(b.id)),
  };
  const topology = (node: LayoutDatum): unknown => [node.id, node.children?.map(topology)];
  const signature = JSON.stringify([viewId, layout, topology(data)]);
  const root =
    previous?.signature === signature
      ? previous.root
      : (hierarchy(data).sort((a, b) =>
          a.data.id.localeCompare(b.data.id),
        ) as HierarchyRectangularNode<LayoutDatum>);
  const geometrySignature = JSON.stringify([
    signature,
    width,
    height,
    depth,
    padding,
    groupHeaderHeight,
    model.nodes.map((node) => [node.id, node.value]),
  ]);
  const total = view?.value ?? model.total;
  if (previous?.geometrySignature !== geometrySignature) {
    root.each((node) => {
      const item = model.byId.get(node.data.id);
      node.data.value = item?.kind === "leaf" ? item.value : 0;
    });
    // Normalize input units before d3's area arithmetic to avoid value × rectangle overflow.
    root.sum((node) => (total > 0 ? node.value / total : 0));
    treemap<LayoutDatum>()
      .tile(layout === "stable" ? treemapResquarify : treemapSquarify)
      .size([width, height])
      .paddingInner(padding)
      .paddingOuter(padding)
      .paddingTop((node) =>
        node.depth > 0 && node.children?.length ? groupHeaderHeight + padding : padding,
      )(root);
  }
  const rectangles: TreemapRectangle<T>[] = [];
  root.each((node) => {
    if (node.depth === 0 || node.depth > depth) return;
    const item = model.byId.get(node.data.id);
    if (!item || item.value <= 0 || node.x1 <= node.x0 || node.y1 <= node.y0) return;
    rectangles.push({
      ...item,
      x: node.x0,
      y: node.y0,
      width: Math.max(0, node.x1 - node.x0),
      height: Math.max(0, node.y1 - node.y0),
      viewShare: total > 0 ? item.value / total : null,
    });
  });
  return { rectangles, cache: { signature, geometrySignature, root }, total };
}

export function nearestTreemapAncestor<T>(
  id: string | null,
  model: TreemapModel<T>,
  previous: TreemapModel<T> | undefined,
): string | null {
  if (id === null || model.byId.has(id)) return id;
  const path = previous?.byId.get(id)?.path ?? [];
  for (let index = path.length - 2; index >= 0; index--) {
    const candidate = path[index];
    if (candidate !== undefined && model.byId.has(candidate)) return candidate;
  }
  return null;
}

/** Directional navigation prioritizes the nearest neighbor in the requested half-plane. */
export function treemapNeighbor<T>(
  items: readonly TreemapRectangle<T>[],
  id: string | null,
  key: string,
): string | null {
  if (key === "Home") return items[0]?.id ?? null;
  if (key === "End") return items.at(-1)?.id ?? null;
  const current = items.find((item) => item.id === id) ?? items[0];
  if (!current) return null;
  const x = current.x + current.width / 2,
    y = current.y + current.height / 2;
  let best: TreemapRectangle<T> | undefined;
  let distance = Infinity;
  for (const item of items) {
    if (item.id === current.id) continue;
    const dx = item.x + item.width / 2 - x,
      dy = item.y + item.height / 2 - y;
    const forward =
      key === "ArrowRight"
        ? dx
        : key === "ArrowLeft"
          ? -dx
          : key === "ArrowDown"
            ? dy
            : key === "ArrowUp"
              ? -dy
              : 0;
    if (forward <= 0) continue;
    const across = key === "ArrowRight" || key === "ArrowLeft" ? dy : dx;
    const score = forward * forward + across * across * 4;
    if (score < distance) {
      best = item;
      distance = score;
    }
  }
  return best?.id ?? current.id;
}
