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
  if (data === null || typeof data !== "object" || Array.isArray(data))
    throw new Error("Sankey data must be an object");
  const nodes = data.nodes;
  const flowLinks = data.links;
  if (!Array.isArray(data.nodes)) throw new Error("Sankey data.nodes must be an array");
  if (!Array.isArray(data.links)) throw new Error("Sankey data.links must be an array");
  const ids = new Map<string, number>();
  const checkId = (id: string, path: string) => {
    if (typeof id !== "string" || !id.trim())
      throw new Error(`${path} requires a nonempty string id`);
  };
  for (const [index, node] of nodes.entries()) {
    const path = `Sankey data.nodes[${index}]`;
    if (node === null || typeof node !== "object" || Array.isArray(node))
      throw new Error(`${path} must be a node object`);
    checkId(node.id, `${path}.id`);
    if (ids.has(node.id)) throw new Error(`${path}.id: Duplicate Sankey node id: ${node.id}`);
    if (typeof node.name !== "string") throw new Error(`${path}.name must be a string`);
    ids.set(node.id, index);
  }
  const endpoint = (value: string | number, path: string) => {
    const index = typeof value === "string" ? ids.get(value) : value;
    if (index === undefined || !Number.isInteger(index) || index < 0 || index >= nodes.length)
      throw new Error(`${path}: Invalid Sankey endpoint: ${String(value)}`);
    return index;
  };
  const linkIds = new Set<string>();
  const incoming = nodes.map(() => 0);
  const outgoing = nodes.map(() => 0);
  const edges = nodes.map(() => [] as number[]);
  const indegrees = nodes.map(() => 0);
  const hasIncoming = nodes.map(() => false);
  const links = Array.from(flowLinks, (link, index) => {
    const path = `Sankey data.links[${index}]`;
    if (link === null || typeof link !== "object" || Array.isArray(link))
      throw new Error(`${path} must be a link object`);
    checkId(link.id, `${path}.id`);
    if (linkIds.has(link.id)) throw new Error(`${path}.id: Duplicate Sankey link id: ${link.id}`);
    linkIds.add(link.id);
    if (typeof link.value !== "number" || !Number.isFinite(link.value) || link.value < 0)
      throw new Error(`${path}.value requires a finite nonnegative value`);
    const source = endpoint(link.source, `${path}.source`);
    const target = endpoint(link.target, `${path}.target`);
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
  if (queue.length !== nodes.length)
    throw new Error("Sankey cycles are unsupported (including zero-value cycles)");
  nodes.forEach((node, index) => {
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
  return { nodes: nodes.map((node) => ({ ...node })), links };
}

export function sankeyAdjacency(data: SankeyFlowData) {
  const adjacent = new Map<string, Set<string>>();
  for (const link of data.links) {
    const source = typeof link.source === "string" ? link.source : data.nodes[link.source]?.id;
    const target = typeof link.target === "string" ? link.target : data.nodes[link.target]?.id;
    if (source && target) {
      const from = adjacent.get(source) ?? new Set<string>();
      from.add(target);
      adjacent.set(source, from);
      const to = adjacent.get(target) ?? new Set<string>();
      to.add(source);
      adjacent.set(target, to);
    }
  }
  return adjacent;
}
