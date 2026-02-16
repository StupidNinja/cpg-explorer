const API_BASE_URL = '/api';

export interface Node {
  id: string;
  kind: string;
  name: string;
  type_info?: string;
  file?: string;
  line?: number;
  end_line?: number;
  package?: string;
}

export interface Edge {
  source: string;
  target: string;
  kind: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  metadata?: any;
}

export async function searchFunctions(query: string, signal?: AbortSignal): Promise<Node[]> {
  const response = await fetch(
    `${API_BASE_URL}/graph/functions/search?q=${encodeURIComponent(query)}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Failed to search functions');
  }
  return response.json();
}

export async function getCallGraph(
  functionId: string,
  depth: number = 3,
  maxNodes: number = 60,
  signal?: AbortSignal,
  edgeKinds: string[] = ['call'],
): Promise<GraphData> {
  const kindsParam = edgeKinds.join(',');
  const response = await fetch(
    `${API_BASE_URL}/graph/functions/${encodeURIComponent(functionId)}/call-graph?depth=${depth}&maxNodes=${maxNodes}&edgeKinds=${encodeURIComponent(kindsParam)}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch call graph');
  }
  return response.json();
}

export async function getFunctionNeighborhood(
  functionId: string,
  depth: number = 1,
  signal?: AbortSignal
): Promise<GraphData> {
  const response = await fetch(
    `${API_BASE_URL}/graph/functions/${encodeURIComponent(functionId)}/neighborhood?depth=${depth}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch function neighborhood');
  }
  return response.json();
}

export async function getCallers(functionId: string): Promise<GraphData> {
  const response = await fetch(
    `${API_BASE_URL}/graph/functions/${encodeURIComponent(functionId)}/callers`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch callers');
  }
  return response.json();
}

export interface TopFunction {
  node: Node;
  incomingEdges: number;
  outgoingEdges: number;
  totalEdges: number;
}

export async function fetchTopFunctions(limit: number = 10, signal?: AbortSignal): Promise<TopFunction[]> {
  const response = await fetch(
    `${API_BASE_URL}/graph/functions/top?limit=${limit}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch top functions');
  }
  return response.json();
}

export interface FunctionDetails {
  node: Node;
  callerCount: number;
  calleeCount: number;
  callers: Array<{ id: string; name: string; file?: string }>;
  callees: Array<{ id: string; name: string; file?: string }>;
}

export async function fetchFunctionDetails(nodeId: string, signal?: AbortSignal): Promise<FunctionDetails> {
  const response = await fetch(
    `${API_BASE_URL}/graph/functions/${encodeURIComponent(nodeId)}/details`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch function details');
  }
  return response.json();
}
