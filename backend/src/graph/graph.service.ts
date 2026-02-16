import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Node {
  id: string;
  kind: string;
  name: string;
  type_info?: string;
  file?: string;
  line?: number;
  end_line?: number;
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

@Injectable()
export class GraphService {
  constructor(private readonly dbService: DatabaseService) {}

  // Get function by ID
  getFunction(id: string): Node | null {
    const result = this.dbService.queryOne<Node>(
      `SELECT id, kind, name, type_info, file, line, end_line
       FROM nodes
       WHERE id = ? AND kind = 'function'`,
      [id]
    );
    return result || null;
  }

  // Get function details with caller/callee counts
  getFunctionDetails(id: string): {
    node: Node;
    callerCount: number;
    calleeCount: number;
    callers: Array<{ id: string; name: string; file?: string }>;
    callees: Array<{ id: string; name: string; file?: string }>;
  } | null {
    const node = this.getFunction(id);
    if (!node) {
      // Try to get any node (not just functions)
      const anyNode = this.dbService.queryOne<Node>(
        `SELECT id, kind, name, type_info, file, line, end_line FROM nodes WHERE id = ?`,
        [id]
      );
      if (!anyNode) return null;
      return {
        node: anyNode,
        callerCount: 0,
        calleeCount: 0,
        callers: [],
        callees: [],
      };
    }

    const callerCount = this.dbService.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM edges WHERE target = ? AND kind = 'call'`,
      [id]
    );

    const calleeCount = this.dbService.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM edges WHERE source = ? AND kind = 'call'`,
      [id]
    );

    const callers = this.dbService.query<{ id: string; name: string; file: string }>(
      `SELECT n.id, n.name, n.file
       FROM edges e
       JOIN nodes n ON e.source = n.id
       WHERE e.target = ? AND e.kind = 'call'
       LIMIT 10`,
      [id]
    );

    const callees = this.dbService.query<{ id: string; name: string; file: string }>(
      `SELECT n.id, n.name, n.file
       FROM edges e
       JOIN nodes n ON e.target = n.id
       WHERE e.source = ? AND e.kind = 'call'
       LIMIT 10`,
      [id]
    );

    return {
      node,
      callerCount: callerCount?.count || 0,
      calleeCount: calleeCount?.count || 0,
      callers,
      callees,
    };
  }

  // Search functions by name (optimized for speed)
  searchFunctions(query: string, limit: number = 50): Node[] {
    // Sanitize input to prevent SQL injection in LIKE patterns
    const sanitized = query.replace(/[%_\\]/g, '\\$&');
    
    // Validate limit
    const safeLimit = Math.min(Math.max(1, limit), 200);
    
    const results = this.dbService.query<Node>(
      `SELECT id, kind, name, type_info, file, line, end_line
       FROM nodes
       WHERE kind = 'function' AND name LIKE ? ESCAPE '\\'
       LIMIT ?`,
      [`%${sanitized}%`, safeLimit]
    );

    return results;
  }

  // Get call graph for a function (BFS traversal)
  getCallGraph(functionId: string, maxDepth: number = 3, maxNodes: number = 60, edgeKinds: string[] = ['call']): GraphData {
    // Validate parameters
    const safeDepth = Math.min(Math.max(1, maxDepth), 5);
    const safeMaxNodes = Math.min(Math.max(10, maxNodes), 200);
    
    // Validate edge kinds (whitelist)
    const allowedKinds = ['call', 'dfg', 'cfg', 'cdg', 'ref', 'dom', 'pdom', 'ast', 'implements', 'embeds', 'scope', 'error_wrap', 'chan_flow', 'spawn'];
    const safeKinds = edgeKinds.filter(k => allowedKinds.includes(k));
    if (safeKinds.length === 0) safeKinds.push('call');
    
    const startNode = this.getFunction(functionId);
    if (!startNode) {
      throw new NotFoundException(`Function with ID ${functionId} not found`);
    }

    const nodes = new Map<string, Node>();
    const edges: Edge[] = [];
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: functionId, depth: 0 }];

    nodes.set(functionId, startNode);
    
    const kindPlaceholders = safeKinds.map(() => '?').join(',');

    while (queue.length > 0 && nodes.size < safeMaxNodes) {
      const { id: currentId, depth } = queue.shift()!;

      if (visited.has(currentId) || depth >= safeDepth) {
        continue;
      }

      visited.add(currentId);

      // Get outgoing edges of specified kinds
      const callEdges = this.dbService.query<{ target: string; kind: string }>(
        `SELECT target, kind
         FROM edges
         WHERE source = ? AND kind IN (${kindPlaceholders})
         LIMIT ?`,
        [currentId, ...safeKinds, safeMaxNodes - nodes.size]
      );

      // Batch fetch target nodes to avoid N+1 queries
      const targetIds = callEdges
        .filter(edge => !nodes.has(edge.target))
        .map(edge => edge.target);

      if (targetIds.length > 0) {
        const placeholders = targetIds.map(() => '?').join(',');
        const targetNodes = this.dbService.query<Node>(
          `SELECT id, kind, name, type_info, file, line, end_line
           FROM nodes
           WHERE id IN (${placeholders})`,
          targetIds
        );

        targetNodes.forEach(targetNode => {
          nodes.set(targetNode.id, targetNode);
          queue.push({ id: targetNode.id, depth: depth + 1 });
        });
      }

      callEdges.forEach(edge => {
        edges.push({
          source: currentId,
          target: edge.target,
          kind: edge.kind,
        });
      });
    }

    // Overlay: find additional edge types between discovered nodes
    if (safeKinds.length > 1 && nodes.size > 1) {
      const nodeIds = Array.from(nodes.keys());
      const nodePlaceholders = nodeIds.map(() => '?').join(',');
      const overlayKinds = safeKinds.filter(k => k !== 'call');
      if (overlayKinds.length > 0) {
        const overlayKindPH = overlayKinds.map(() => '?').join(',');
        const overlayEdges = this.dbService.query<{ source: string; target: string; kind: string }>(
          `SELECT DISTINCT source, target, kind
           FROM edges
           WHERE source IN (${nodePlaceholders})
             AND target IN (${nodePlaceholders})
             AND kind IN (${overlayKindPH})
           LIMIT 200`,
          [...nodeIds, ...nodeIds, ...overlayKinds]
        );
        overlayEdges.forEach(edge => {
          edges.push({ source: edge.source, target: edge.target, kind: edge.kind });
        });
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges,
      metadata: {
        rootNode: functionId,
        maxDepth,
        nodeCount: nodes.size,
        edgeCount: edges.length,
      },
    };
  }

  // Get callers of a function (reverse call graph)
  getCallers(functionId: string, limit: number = 30): GraphData {
    // Validate limit
    const safeLimit = Math.min(Math.max(1, limit), 100);
    
    const centerNode = this.getFunction(functionId);
    if (!centerNode) {
      throw new NotFoundException(`Function with ID ${functionId} not found`);
    }

    const nodes = new Map<string, Node>();
    nodes.set(functionId, centerNode);

    const incomingEdges = this.dbService.query<{ source: string; kind: string }>(
      `SELECT source, kind
       FROM edges
       WHERE target = ? AND kind = 'call'
       LIMIT ?`,
      [functionId, safeLimit]
    );

    const edges: Edge[] = [];

    // Batch fetch source nodes to avoid N+1 queries
    const sourceIds = incomingEdges
      .filter(edge => !nodes.has(edge.source))
      .map(edge => edge.source);

    if (sourceIds.length > 0) {
      const placeholders = sourceIds.map(() => '?').join(',');
      const sourceNodes = this.dbService.query<Node>(
        `SELECT id, kind, name, type_info, file, line, end_line
         FROM nodes
         WHERE id IN (${placeholders})`,
        sourceIds
      );

      sourceNodes.forEach(sourceNode => {
        nodes.set(sourceNode.id, sourceNode);
      });
    }

    incomingEdges.forEach(edge => {
      edges.push({
        source: edge.source,
        target: functionId,
        kind: edge.kind,
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges,
      metadata: {
        centerNode: functionId,
        nodeCount: nodes.size,
        edgeCount: edges.length,
      },
    };
  }

  // Get package graph
  getPackageGraph(): GraphData {
    const packages = this.dbService.query<{ package_name: string; module: string; function_count: number }>(
      `SELECT package AS package_name, COUNT(*) as function_count
       FROM nodes
       WHERE kind = 'function' AND package IS NOT NULL
       GROUP BY package
       ORDER BY function_count DESC
       LIMIT 200`
    );

    // Create nodes from packages
    const nodes = packages.map((pkg, idx) => ({
      id: String(idx),
      kind: 'package',
      name: pkg.package_name,
      function_count: pkg.function_count,
    }));

    // Get package dependencies (simplified - would need proper package dependency table)
    const edges: Edge[] = [];

    return {
      nodes: nodes as any[],
      edges,
      metadata: {
        packageCount: nodes.length,
      },
    };
  }

  // Get function neighborhood (both callers and callees)
  getFunctionNeighborhood(functionId: string, depth: number = 1): GraphData {
    // Validate depth
    const safeDepth = Math.min(Math.max(1, depth), 3);
    
    const centerNode = this.getFunction(functionId);
    if (!centerNode) {
      throw new NotFoundException(`Function with ID ${functionId} not found`);
    }

    const nodes = new Map<string, Node>();
    nodes.set(functionId, centerNode);

    const edges: Edge[] = [];

    // Get outgoing edges (callees)
    const outgoing = this.dbService.query<{ target: string; kind: string }>(
      `SELECT target, kind
       FROM edges
       WHERE source = ? AND kind = 'call'
       LIMIT 30`,
      [functionId]
    );

    // Batch fetch outgoing nodes
    const outgoingIds = outgoing
      .filter(edge => !nodes.has(edge.target))
      .map(edge => edge.target);

    if (outgoingIds.length > 0) {
      const placeholders = outgoingIds.map(() => '?').join(',');
      const outgoingNodes = this.dbService.query<Node>(
        `SELECT id, kind, name, type_info, file, line, end_line 
         FROM nodes 
         WHERE id IN (${placeholders})`,
        outgoingIds
      );
      outgoingNodes.forEach(node => nodes.set(node.id, node));
    }

    outgoing.forEach(edge => {
      edges.push({ source: functionId, target: edge.target, kind: edge.kind });
    });

    // Get incoming edges (callers)
    const incoming = this.dbService.query<{ source: string; kind: string }>(
      `SELECT source, kind
       FROM edges
       WHERE target = ? AND kind = 'call'
       LIMIT 30`,
      [functionId]
    );

    // Batch fetch incoming nodes
    const incomingIds = incoming
      .filter(edge => !nodes.has(edge.source))
      .map(edge => edge.source);

    if (incomingIds.length > 0) {
      const placeholders = incomingIds.map(() => '?').join(',');
      const incomingNodes = this.dbService.query<Node>(
        `SELECT id, kind, name, type_info, file, line, end_line 
         FROM nodes 
         WHERE id IN (${placeholders})`,
        incomingIds
      );
      incomingNodes.forEach(node => nodes.set(node.id, node));
    }

    incoming.forEach(edge => {
      edges.push({ source: edge.source, target: functionId, kind: edge.kind });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges,
      metadata: {
        centerNode: functionId,
        nodeCount: nodes.size,
        edgeCount: edges.length,
      },
    };
  }

  // Get top functions by connectivity
  getTopFunctions(limit: number = 10): Array<{
    node: Node;
    incomingEdges: number;
    outgoingEdges: number;
    totalEdges: number;
  }> {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    
    const results = this.dbService.query<{
      id: string;
      kind: string;
      name: string;
      type_info: string;
      file: string;
      line: number;
      incoming: number;
      outgoing: number;
      total: number;
    }>(
      `SELECT 
        n.id, n.kind, n.name, n.type_info, n.file, n.line,
        COALESCE(incoming.cnt, 0) as incoming,
        COALESCE(outgoing.cnt, 0) as outgoing,
        COALESCE(incoming.cnt, 0) + COALESCE(outgoing.cnt, 0) as total
      FROM nodes n
      LEFT JOIN (
        SELECT target, COUNT(*) as cnt
        FROM edges
        WHERE kind = 'call'
        GROUP BY target
      ) incoming ON n.id = incoming.target
      LEFT JOIN (
        SELECT source, COUNT(*) as cnt
        FROM edges
        WHERE kind = 'call'
        GROUP BY source
      ) outgoing ON n.id = outgoing.source
      WHERE n.kind = 'function'
        AND (COALESCE(incoming.cnt, 0) + COALESCE(outgoing.cnt, 0)) > 0
      ORDER BY total DESC
      LIMIT ?`,
      [safeLimit]
    );

    return results.map(r => ({
      node: {
        id: r.id,
        kind: r.kind,
        name: r.name,
        type_info: r.type_info,
        file: r.file,
        line: r.line,
      },
      incomingEdges: r.incoming,
      outgoingEdges: r.outgoing,
      totalEdges: r.total,
    }));
  }
}
