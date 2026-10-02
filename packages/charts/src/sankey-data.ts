export interface SankeyFlowNode {
  id: string;
  name: string;
  [key: string]: unknown;
}
export interface SankeyFlowLink {
  id: string;
  source: string | number;
  target: string | number;
  value: number;
  [key: string]: unknown;
}
export interface SankeyFlowData {
  nodes: readonly SankeyFlowNode[];
  links: readonly SankeyFlowLink[];
}

/** Validate the entire DAG, including zero flows. Never infer a missing flow. */
export function prepareSankeyData(data: SankeyFlowData) {
  const ids = new Map<string, number>();
  const checkId = (id: string, kind: string) => {
    if (typeof id !== "string" || !id.trim())
      throw new Error(`Sankey ${kind} requires a nonempty string id`);
  };
  data.nodes.forEach((node, index) => {
    checkId(node.id, "node");
    if (ids.has(node.id)) throw new Error(`Duplicate Sankey node id: ${node.id}`);
    if (typeof node.name !== "string") throw new Error(`Sankey node ${node.id} requires a name`);
    ids.set(node.id, index);
  });
  const endpoint = (value: string | number) => {
    const index = typeof value === "string" ? ids.get(value) : value;
    if (index === undefined || !Number.isInteger(index) || index < 0 || index >= data.nodes.length)
      throw new Error(`Invalid Sankey endpoint: ${String(value)}`);
    return index;
  };
  const linkIds = new Set<string>();
  const incoming = data.nodes.map(() => 0);
  const outgoing = data.nodes.map(() => 0);
  const edges = data.nodes.map(() => [] as number[]);
  const indegrees = data.nodes.map(() => 0);
  const hasIncoming = data.nodes.map(() => false);
  const links = data.links.map((link) => {
    checkId(link.id, "link");
    if (linkIds.has(link.id)) throw new Error(`Duplicate Sankey link id: ${link.id}`);
    linkIds.add(link.id);
    if (typeof link.value !== "number" || !Number.isFinite(link.value) || link.value < 0)
      throw new Error(`Sankey link ${link.id} requires a finite nonnegative value`);
    const source = endpoint(link.source);
    const target = endpoint(link.target);
    outgoing[source] = (outgoing[source] ?? 0) + link.value;
    incoming[target] = (incoming[target] ?? 0) + link.value;
    edges[source]?.push(target);
    hasIncoming[target] = true;
    indegrees[target] = (indegrees[target] ?? 0) + 1;
    return { ...link, source, target };
  });
  const queue = indegrees.flatMap((degree, index) => (degree === 0 ? [index] : []));
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const target of edges[queue[cursor] ?? 0] ?? []) {
      indegrees[target] = (indegrees[target] ?? 0) - 1;
      if (indegrees[target] === 0) queue.push(target);
    }
  }
  if (queue.length !== data.nodes.length)
    throw new Error("Sankey cycles are unsupported (including zero-value cycles)");
  data.nodes.forEach((node, index) => {
    const input = incoming[index] ?? 0;
    const output = outgoing[index] ?? 0;
    if (!Number.isFinite(input) || !Number.isFinite(output))
      throw new Error(`Sankey totals overflow at ${node.id}`);
    const hasInput = hasIncoming[index];
    const hasOutput = edges[index]?.length;
    if (hasInput && hasOutput && Math.abs(input - output) > 1e-9 * Math.max(input, output))
      throw new Error(
        `Inconsistent Sankey totals at ${node.id}: incoming ${input}, outgoing ${output}. Supply explicit loss/gain flows.`,
      );
  });
  return { nodes: data.nodes.map((node) => ({ ...node })), links };
}
