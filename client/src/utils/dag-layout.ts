import type { BoardIssue } from '@/types/system';

export interface DAGNode {
  id: string;
  name: string;
  status: string;
  x: number;
  y: number;
  layer: number;
}

export interface DAGEdge {
  source: string;
  target: string;
  kind?: string;
}

export interface GraphLayoutNodeInput {
  id: string;
  name: string;
  status: string;
}

/**
 * Compute a layered DAG layout using topological sort.
 * Issues with no dependencies go to layer 0.
 * Each dependent issue is placed one layer after its latest dependency.
 */
export function computeDAGLayout(
  issues: BoardIssue[],
  width: number,
  height: number,
): { nodes: DAGNode[]; edges: DAGEdge[] } {
  const nodes = issues.map((issue) => ({
    id: issue.id,
    name: issue.name,
    status: issue.status,
  }));

  const edges: DAGEdge[] = [];
  const issueMap = new Map(issues.map((i) => [i.id, i]));

  for (const issue of issues) {
    for (const dep of issue.depends_on) {
      if (issueMap.has(dep)) {
        edges.push({ source: dep, target: issue.id, kind: 'depends_on' });
      }
    }
  }

  return computeDAGLayoutFromGraph(nodes, edges, width, height);
}

export function computeDAGLayoutFromGraph(
  rawNodes: GraphLayoutNodeInput[],
  edges: DAGEdge[],
  width: number,
  height: number,
): { nodes: DAGNode[]; edges: DAGEdge[] } {
  const nodeMap = new Map(rawNodes.map((node) => [node.id, node]));
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  // Initialize
  for (const node of rawNodes) {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  // Build adjacency from provided edges
  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) continue;
    adjList.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Sort adjacency deterministically
  for (const [id, neighbors] of adjList.entries()) {
    neighbors.sort((a, b) => a.localeCompare(b));
    adjList.set(id, neighbors);
  }

  // Topological sort with layer assignment
  const layers = new Map<string, number>();
  const queue: string[] = [];

  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
      layers.set(id, 0);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layers.get(current) || 0;

    for (const next of adjList.get(current) || []) {
      const newLayer = Math.max(layers.get(next) || 0, currentLayer + 1);
      layers.set(next, newLayer);
      inDegree.set(next, (inDegree.get(next) || 0) - 1);
      if (inDegree.get(next) === 0) {
        queue.push(next);
      }
    }
  }

  // Handle cycles (assign unvisited to layer 0)
  for (const node of rawNodes) {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  }

  // Compute positions
  const maxLayer = Math.max(0, ...layers.values());
  const layerGroups = new Map<number, string[]>();

  for (const [id, layer] of layers) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(id);
  }

  const padding = 60;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const layerSpacing = maxLayer > 0 ? usableWidth / maxLayer : 0;

  const nodes: DAGNode[] = rawNodes.map((node) => {
    const layer = layers.get(node.id) || 0;
    const group = layerGroups.get(layer)!;
    const indexInGroup = group.indexOf(node.id);
    const groupSize = group.length;
    const nodeSpacing = groupSize > 1 ? usableHeight / (groupSize - 1) : 0;

    return {
      id: node.id,
      name: node.name,
      status: node.status,
      x: padding + layer * layerSpacing,
      y: groupSize === 1 ? height / 2 : padding + indexInGroup * nodeSpacing,
      layer,
    };
  });

  return { nodes, edges };
}
