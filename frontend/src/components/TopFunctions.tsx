import { useQuery } from '@tanstack/react-query';
import { fetchTopFunctions } from '../api/graph';

interface TopFunctionsProps {
  onSelectFunction: (functionId: string, name?: string) => void;
}

export default function TopFunctions({ onSelectFunction }: TopFunctionsProps) {
  const { data: topFunctions, isLoading, error } = useQuery({
    queryKey: ['topFunctions'],
    queryFn: () => fetchTopFunctions(12),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Connected Functions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail, not critical
  }

  if (!topFunctions || topFunctions.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-4 bg-gray-50">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Most Connected Functions
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Start exploring from these highly connected functions in the codebase
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {topFunctions.map((item) => (
          <button
            key={item.node.id}
            onClick={() => onSelectFunction(item.node.id, item.node.name)}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-mono text-sm font-semibold text-gray-900 truncate flex-1 group-hover:text-blue-600">
                {item.node.name}
              </h3>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                {item.totalEdges}
              </span>
            </div>
            
            {item.node.file && (
              <p className="text-xs text-gray-500 truncate mb-3" title={item.node.file}>
                {item.node.file.split('/').pop()}
                {item.node.line ? `:${item.node.line}` : ''}
              </p>
            )}
            
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">←</span>
                <span className="text-gray-900 font-medium">{item.incomingEdges}</span>
                <span className="text-gray-500">callers</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">→</span>
                <span className="text-gray-900 font-medium">{item.outgoingEdges}</span>
                <span className="text-gray-500">calls</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
