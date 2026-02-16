const API_BASE_URL = '/api';

export interface Stats {
  nodes: number;
  edges: number;
  functions: number;
}

export async function fetchStats(): Promise<Stats> {
  const response = await fetch(`${API_BASE_URL}/schema/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
}

export interface DashboardData {
  overview: Record<string, string>;
  nodeDistribution: Array<{ node_kind: string; count: number; percentage: number }>;
  edgeDistribution: Array<{ edge_kind: string; count: number; percentage: number }>;
  findingsSummary: Array<{ category: string; severity: string; count: number }>;
  hotspots: Array<{
    function_id: string; name: string; package: string; file: string;
    complexity: number; loc: number; fan_in: number; fan_out: number;
    finding_count: number; hotspot_score: number;
  }>;
  complexityDistribution: Array<{
    bucket: string; bucket_min: number; bucket_max: number; function_count: number;
  }>;
  packages: Array<{
    package: string; files: number; functions: number; types: number; loc: number;
  }>;
  errorChains: Array<{
    function_id: string; name: string; package: string;
    error_wraps: number; error_returns: number; chain_depth: number;
  }>;
}

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardData> {
  const response = await fetch(`${API_BASE_URL}/schema/dashboard`, { signal });
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

export interface Finding {
  id: number;
  category: string;
  severity: string;
  node_id: string;
  file: string;
  line: number;
  message: string;
}

export async function fetchFindings(category?: string, limit: number = 50, signal?: AbortSignal): Promise<Finding[]> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  params.set('limit', String(limit));
  const response = await fetch(`${API_BASE_URL}/schema/findings?${params}`, { signal });
  if (!response.ok) {
    throw new Error('Failed to fetch findings');
  }
  return response.json();
}
