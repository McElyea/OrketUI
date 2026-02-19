import type { ExecutionGraph, ExecutionGraphEdge, ExecutionGraphNode } from '@/types/sessions';
import type { LogEntry } from '@/api/logs.api';

type MutableNode = ExecutionGraphNode & { synthetic?: boolean };

interface SessionGraphBuildResult extends ExecutionGraph {
  component_count: number;
}

function normalizeIssueId(entry: LogEntry): string | null {
  if (entry.issue_id) return entry.issue_id;
  const data = (entry.data ?? {}) as Record<string, unknown>;
  const runtime = (data.runtime_event ?? {}) as Record<string, unknown>;
  const runtimeIssue = runtime.issue_id;
  return typeof runtimeIssue === 'string' && runtimeIssue.trim() ? runtimeIssue : null;
}

function stableSortLogs(logs: LogEntry[]): LogEntry[] {
  return [...logs].sort((a, b) => {
    const ai = a.turn_index ?? Number.MAX_SAFE_INTEGER;
    const bi = b.turn_index ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.timestamp.localeCompare(b.timestamp);
  });
}

function edgeKey(edge: ExecutionGraphEdge): string {
  return `${edge.source}->${edge.target}:${edge.kind ?? 'unknown'}`;
}

function connectedComponents(
  nodeIds: string[],
  edges: ExecutionGraphEdge[],
): string[][] {
  const adjacency = new Map<string, Set<string>>();
  for (const id of nodeIds) adjacency.set(id, new Set());

  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target)) continue;
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const id of nodeIds) {
    if (visited.has(id)) continue;
    const queue = [id];
    visited.add(id);
    const component: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }

    components.push(component);
  }

  return components;
}

export function buildSessionGraph(
  baseGraph: ExecutionGraph,
  logs: LogEntry[],
): SessionGraphBuildResult {
  const nodes: MutableNode[] = baseGraph.nodes.map((node) => ({ ...node }));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const edges: ExecutionGraphEdge[] = baseGraph.edges.map((edge) => ({
    ...edge,
    kind: edge.kind ?? 'depends_on',
  }));
  const edgeSet = new Set(edges.map(edgeKey));

  const turnCompletions = stableSortLogs(
    logs.filter((entry) => entry.event === 'turn_complete'),
  );

  let previousIssue: string | null = null;
  for (const entry of turnCompletions) {
    const currentIssue = normalizeIssueId(entry);
    if (!currentIssue) continue;

    if (!nodeById.has(currentIssue)) {
      const synthesized: MutableNode = {
        id: currentIssue,
        summary: currentIssue,
        status: 'unknown',
        seat: entry.role || 'unknown',
        synthetic: true,
      };
      nodeById.set(currentIssue, synthesized);
      nodes.push(synthesized);
    }

    if (previousIssue && previousIssue !== currentIssue) {
      const handoffEdge: ExecutionGraphEdge = {
        source: previousIssue,
        target: currentIssue,
        kind: 'handoff',
        source_event: entry.event,
        timestamp: entry.timestamp,
      };
      const key = edgeKey(handoffEdge);
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push(handoffEdge);
      }
    }

    previousIssue = currentIssue;
  }

  const primaryNodeIds = nodes.filter((node) => !node.synthetic).map((node) => node.id);
  const components = connectedComponents(primaryNodeIds, edges);

  if (components.length > 1) {
    const orderIndex = new Map(
      nodes.map((node, index) => [node.id, node.order_index ?? index]),
    );

    components.forEach((component, idx) => {
      const chainId = `chain-${baseGraph.session_id}-${idx + 1}`;
      const anchor = [...component].sort((a, b) => (orderIndex.get(a)! - orderIndex.get(b)!))[0];

      const chainNode: MutableNode = {
        id: chainId,
        summary: `Chain ${idx + 1}`,
        status: 'idle',
        synthetic: true,
      };
      nodes.push(chainNode);
      nodeById.set(chainId, chainNode);

      const chainEdge: ExecutionGraphEdge = {
        source: chainId,
        target: anchor,
        kind: 'parallel_chain',
      };
      const key = edgeKey(chainEdge);
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push(chainEdge);
      }
    });
  }

  return {
    ...baseGraph,
    nodes,
    edges,
    node_count: nodes.length,
    edge_count: edges.length,
    component_count: components.length,
  };
}
