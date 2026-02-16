import { useQuery } from '@tanstack/react-query';
import { fetchFunctionDetails } from '../api/graph';

interface NodeDetailPanelProps {
  nodeId: string;
  isRootNode: boolean;
  onExploreGraph: (nodeId: string, nodeName?: string) => void;
  onViewSource: () => void;
}

export default function NodeDetailPanel({
  nodeId,
  isRootNode,
  onExploreGraph,
  onViewSource,
}: NodeDetailPanelProps) {
  const { data: details, isLoading, error } = useQuery({
    queryKey: ['functionDetails', nodeId],
    queryFn: ({ signal }) => fetchFunctionDetails(nodeId, signal),
    enabled: !!nodeId,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading details...
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p>Could not load details for this node</p>
          <button
            onClick={onViewSource}
            className="mt-3 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm transition-colors"
          >
            View Source Code
          </button>
        </div>
      </div>
    );
  }

  const { node, callerCount, calleeCount, callers, callees } = details;

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="bg-gray-800 px-5 py-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-[10px] font-medium rounded uppercase">
                {node.kind}
              </span>
              {isRootNode && (
                <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-[10px] font-medium rounded">
                  ROOT
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-100 font-mono truncate" title={node.name}>
              {node.name}
            </h2>
            {node.type_info && (
              <p className="text-xs font-mono text-gray-400 mt-1 truncate" title={node.type_info}>
                {node.type_info}
              </p>
            )}
          </div>
        </div>

        {/* Location */}
        {node.file && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">{node.file}</span>
            {node.line && (
              <span className="text-gray-500">
                :{node.line}
                {node.end_line && node.end_line !== node.line && `-${node.end_line}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-5 py-3 bg-gray-800/50 border-b border-gray-700 flex gap-2">
        {!isRootNode && (
          <button
            onClick={() => onExploreGraph(nodeId, node.name)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Explore Graph
          </button>
        )}
        <button
          onClick={onViewSource}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          View Source
        </button>
      </div>

      {/* Stats */}
      <div className="px-5 py-3 bg-gray-800/30 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-lg px-4 py-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{callerCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">Callers</div>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-3 text-center">
            <div className="text-2xl font-bold text-green-400">{calleeCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">Callees</div>
          </div>
        </div>
      </div>

      {/* Callers List */}
      {callers.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-700">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Called by ({callerCount > 10 ? `showing 10 of ${callerCount}` : callerCount})
          </h3>
          <ul className="space-y-1">
            {callers.map((caller) => (
              <li key={caller.id}>
                <button
                  onClick={() => onExploreGraph(caller.id, caller.name)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="text-sm text-gray-200 font-mono truncate group-hover:text-blue-400">
                    {caller.name}
                  </div>
                  {caller.file && (
                    <div className="text-[10px] text-gray-500 truncate">
                      {caller.file.split('/').pop()}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Callees List */}
      {callees.length > 0 && (
        <div className="px-5 py-3">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Calls ({calleeCount > 10 ? `showing 10 of ${calleeCount}` : calleeCount})
          </h3>
          <ul className="space-y-1">
            {callees.map((callee) => (
              <li key={callee.id}>
                <button
                  onClick={() => onExploreGraph(callee.id, callee.name)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="text-sm text-gray-200 font-mono truncate group-hover:text-green-400">
                    {callee.name}
                  </div>
                  {callee.file && (
                    <div className="text-[10px] text-gray-500 truncate">
                      {callee.file.split('/').pop()}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state for no connections */}
      {callers.length === 0 && callees.length === 0 && (
        <div className="px-5 py-6 text-center text-gray-500 text-sm">
          No call connections found for this node
        </div>
      )}
    </div>
  );
}
