import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface SchemaDoc {
  table_name: string;
  column_name: string;
  description: string;
}

export interface QueryDoc {
  query_name: string;
  description: string;
  sql: string;
}

@Injectable()
export class SchemaService {
  constructor(private readonly dbService: DatabaseService) {}

  getSchemaDocumentation(): SchemaDoc[] {
    return this.dbService.query<SchemaDoc>(
      'SELECT * FROM schema_docs ORDER BY table_name, column_name'
    );
  }

  getAvailableQueries(): QueryDoc[] {
    return this.dbService.query<QueryDoc>(
      'SELECT * FROM queries ORDER BY query_name'
    );
  }

  getTableList(): string[] {
    const tables = this.dbService.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    return tables.map(t => t.name);
  }

  getStats() {
    const nodeCount = this.dbService.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM nodes'
    );
    const edgeCount = this.dbService.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM edges'
    );
    const functionCount = this.dbService.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM nodes WHERE kind = 'function'"
    );

    return {
      nodes: nodeCount?.count || 0,
      edges: edgeCount?.count || 0,
      functions: functionCount?.count || 0,
    };
  }

  // Get comprehensive dashboard data from pre-computed tables
  getDashboard() {
    const overview = this.dbService.query<{ key: string; value: string }>(
      'SELECT key, value FROM dashboard_overview'
    );

    const nodeDistribution = this.dbService.query<{ node_kind: string; count: number; percentage: number }>(
      'SELECT node_kind, count, percentage FROM dashboard_node_distribution ORDER BY count DESC'
    );

    const edgeDistribution = this.dbService.query<{ edge_kind: string; count: number; percentage: number }>(
      'SELECT edge_kind, count, percentage FROM dashboard_edge_distribution ORDER BY count DESC'
    );

    const findingsSummary = this.dbService.query<{ category: string; severity: string; count: number }>(
      'SELECT category, severity, count FROM dashboard_findings_summary ORDER BY count DESC'
    );

    const hotspots = this.dbService.query<{
      function_id: string; name: string; package: string; file: string;
      complexity: number; loc: number; fan_in: number; fan_out: number;
      finding_count: number; hotspot_score: number;
    }>(
      'SELECT function_id, name, package, file, complexity, loc, fan_in, fan_out, finding_count, hotspot_score FROM dashboard_hotspots ORDER BY hotspot_score DESC LIMIT 20'
    );

    const complexityDistribution = this.dbService.query<{
      bucket: string; bucket_min: number; bucket_max: number; function_count: number;
    }>(
      'SELECT bucket, bucket_min, bucket_max, function_count FROM dashboard_complexity_distribution ORDER BY bucket_min'
    );

    const packages = this.dbService.query<{
      package: string; files: number; functions: number; types: number; loc: number;
    }>(
      'SELECT package, files, functions, types, loc FROM stats_packages ORDER BY loc DESC LIMIT 30'
    );

    const errorChains = this.dbService.query<{
      function_id: string; name: string; package: string;
      error_wraps: number; error_returns: number; chain_depth: number;
    }>(
      'SELECT function_id, name, package, error_wraps, error_returns, chain_depth FROM error_chains ORDER BY error_wraps DESC LIMIT 20'
    );

    return {
      overview: Object.fromEntries(overview.map(o => [o.key, o.value])),
      nodeDistribution,
      edgeDistribution,
      findingsSummary,
      hotspots,
      complexityDistribution,
      packages,
      errorChains,
    };
  }

  // Get findings with details
  getFindings(category?: string, limit: number = 50) {
    const safeLimit = Math.min(Math.max(1, limit), 200);

    if (category) {
      return this.dbService.query<{
        id: number; category: string; severity: string;
        node_id: string; file: string; line: number; message: string;
      }>(
        'SELECT id, category, severity, node_id, file, line, message FROM findings WHERE category = ? ORDER BY severity, id LIMIT ?',
        [category, safeLimit]
      );
    }

    return this.dbService.query<{
      id: number; category: string; severity: string;
      node_id: string; file: string; line: number; message: string;
    }>(
      'SELECT id, category, severity, node_id, file, line, message FROM findings ORDER BY severity, category LIMIT ?',
      [safeLimit]
    );
  }
}
