import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getCallGraph, getFunctionNeighborhood } from '../api/graph';

interface GraphViewProps {
  functionId: string | null;
  onSelectNode: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string, nodeName?: string) => void;
}

type ViewMode = 'call-graph' | 'neighborhood';

// Custom rich node component
function FunctionNode({ data, selected }: NodeProps) {
  const isRoot = data.isRoot as boolean;
  const name = data.name as string;
  const pkg = data.pkg as string | undefined;
  const typeInfo = data.typeInfo as string | undefined;
  const file = data.file as string | undefined;

  return (
    <div
      className={`
        rounded-lg border-2 shadow-sm transition-all min-w-[180px] max-w-[260px]
        ${isRoot
          ? 'bg-blue-600 border-blue-700 text-white shadow-blue-200'
          : selected
            ? 'bg-white border-blue-400 shadow-blue-100'
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />
      <div className="px-3 py-2">
        {pkg && (
          <div className={`text-[10px] font-medium mb-1 ${isRoot ? 'text-blue-200' : 'text-gray-400'}`}>
            {pkg}
          </div>
        )}
        <div className={`font-semibold text-xs leading-tight truncate ${isRoot ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </div>
        {typeInfo && (
          <div className={`text-[10px] font-mono mt-1 truncate ${isRoot ? 'text-blue-100' : 'text-gray-500'}`}>
            {typeInfo.length > 50 ? typeInfo.substring(0, 47) + '...' : typeInfo}
          </div>
        )}
        {file && (
          <div className={`text-[10px] mt-1 truncate ${isRoot ? 'text-blue-200' : 'text-gray-400'}`}>
            {file.split('/').pop()}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { functionNode: FunctionNode };

const EDGE_KIND_COLORS: Record<string, string> = {
  call: '#3b82f6',
  dfg: '#10b981',
  cfg: '#f59e0b',
  cdg: '#8b5cf6',
  ref: '#ef4444',
  dom: '#06b6d4',
  pdom: '#84cc16',
  ast: '#6b7280',
  scope: '#ec4899',
  implements: '#14b8a6',
  embeds: '#f97316',
};

const AVAILABLE_EDGE_KINDS = [
  { key: 'call', label: 'Call' },
  { key: 'dfg', label: 'Data Flow' },
  { key: 'cfg', label: 'Control Flow' },
  { key: 'cdg', label: 'Control Dep' },
  { key: 'ref', label: 'Reference' },
];

export default function GraphView({ functionId, onSelectNode, onNodeDoubleClick }: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('call-graph');
  const [depth, setDepth] = useState(3);
  const [selectedEdgeKinds, setSelectedEdgeKinds] = useState<string[]>(['call']);

  const toggleEdgeKind = useCallback((kind: string) => {
    setSelectedEdgeKinds(prev => {
      if (prev.includes(kind)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(k => k !== kind);
      }
      return [...prev, kind];
    });
  }, []);

  const { data: graphData, isLoading } = useQuery({
    queryKey: ['graph', functionId, viewMode, depth, selectedEdgeKinds],
    queryFn: ({ signal }) => {
      if (!functionId) return null;
      return viewMode === 'call-graph'
        ? getCallGraph(functionId, depth, 60, signal, selectedEdgeKinds)
        : getFunctionNeighborhood(functionId, depth, signal);
    },
    enabled: functionId !== null,
    retry: false,
  });

  useEffect(() => {
    if (!graphData) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const flowNodes: Node[] = graphData.nodes.map((node) => {
      const isRoot = node.id === functionId;
      const nameParts = node.name.split('.');
      const pkg = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : undefined;

      return {
        id: String(node.id),
        type: 'functionNode',
        position: { x: 0, y: 0 },
        data: {
          label: node.name,
          name: node.name,
          pkg,
          typeInfo: node.type_info,
          file: node.file,
          isRoot,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });

    const flowEdges: Edge[] = graphData.edges.map((edge, index) => {
      const color = EDGE_KIND_COLORS[edge.kind] || '#9ca3af';
      return {
        id: `${edge.source}-${edge.target}-${index}`,
        source: String(edge.source),
        target: String(edge.target),
        type: 'default',
        animated: edge.kind === 'call',
        label: selectedEdgeKinds.length > 1 ? edge.kind : undefined,
        labelStyle: { fontSize: 9, fill: color },
        labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
        style: {
          stroke: color,
          strokeWidth: edge.kind === 'call' ? 1.5 : 1.2,
          strokeDasharray: edge.kind === 'dfg' ? '5,5' : edge.kind === 'cfg' ? '3,3' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 16,
          height: 16,
        },
      };
    });

    const layout = calculateLayout(flowNodes, flowEdges, functionId);
    setNodes(layout.nodes);
    setEdges(flowEdges);
  }, [graphData, functionId]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeDoubleClick) {
        onNodeDoubleClick(node.id, node.data.name as string);
      }
    },
    [onNodeDoubleClick]
  );

  if (!functionId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No Function Selected
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Search for a function above to visualize its call graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">View Mode</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="call-graph">Call Graph</option>
            <option value="neighborhood">Neighborhood</option>
          </select>
        </div>
        
        {viewMode === 'call-graph' && (
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Depth: {depth}
            </label>
            <input
              type="range"
              min="1" max="5"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500"
            />
          </div>
        )}

        {viewMode === 'call-graph' && (
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Edge Types</label>
            <div className="space-y-1">
              {AVAILABLE_EDGE_KINDS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedEdgeKinds.includes(key)}
                    onChange={() => toggleEdgeKind(key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                  />
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: EDGE_KIND_COLORS[key] }}
                  />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {graphData && (
          <div className="text-xs text-gray-600 pt-2 border-t border-gray-200 space-y-0.5">
            <div className="flex justify-between">
              <span>Nodes:</span>
              <span className="font-medium">{graphData.nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Edges:</span>
              <span className="font-medium">{graphData.edges.length}</span>
            </div>
          </div>
        )}

        <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
          Click: details · Double-click: explore
        </div>
      </div>

      {/* React Flow */}
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading graph...
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          defaultEdgeOptions={{ type: 'default' }}
        >
          <Background color="#f1f5f9" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(node) => (node.data?.isRoot ? '#3b82f6' : '#e2e8f0')}
            maskColor="rgba(0, 0, 0, 0.08)"
            style={{ border: '1px solid #e2e8f0' }}
          />
        </ReactFlow>
      )}
    </div>
  );
}

// Simple hierarchical layout algorithm
function calculateLayout(nodes: Node[], edges: Edge[], rootId: string | null) {
  const levels = new Map<string, number>();
  const childrenMap = new Map<string, string[]>();

  // Build adjacency list
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
  });

  // BFS to assign levels
  const queue: Array<{ id: string; level: number }> = [];
  const visited = new Set<string>();

  if (rootId) {
    queue.push({ id: rootId, level: 0 });
  } else if (nodes.length > 0) {
    queue.push({ id: nodes[0].id, level: 0 });
  }

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    
    visited.add(id);
    levels.set(id, level);

    const children = childrenMap.get(id) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 });
      }
    });
  }

  // Unvisited nodes get level 0
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });

  // Group nodes by level
  const nodesByLevel = new Map<number, string[]>();
  levels.forEach((level, id) => {
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(id);
  });

  // Position nodes
  const LEVEL_WIDTH = 450;
  const NODE_HEIGHT = 120;

  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    const nodesInLevel = nodesByLevel.get(level) || [];
    const indexInLevel = nodesInLevel.indexOf(node.id);
    const totalInLevel = nodesInLevel.length;
    const yOffset = -(totalInLevel * NODE_HEIGHT) / 2;

    node.position = {
      x: level * LEVEL_WIDTH,
      y: yOffset + indexInLevel * NODE_HEIGHT,
    };
  });

  return { nodes, edges };
}
