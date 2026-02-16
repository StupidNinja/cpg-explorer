import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { getNodeSource } from '../api/source';

interface CodeViewerProps {
  nodeId: string | null;
}

export default function CodeViewer({ nodeId }: CodeViewerProps) {
  const { data: source, isLoading } = useQuery({
    queryKey: ['source', nodeId],
    queryFn: ({ signal }) => {
      if (!nodeId) return null;
      return getNodeSource(nodeId, signal);
    },
    enabled: nodeId !== null,
    retry: false,
  });

  if (!nodeId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-200">
            No Code to Display
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            Click on a node in the graph to view its source code
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Loading source code...</div>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Source code not available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="text-sm font-mono text-gray-300 truncate">
          {source.file}
        </div>
        {source.line && (
          <div className="text-xs text-gray-500">
            Lines {source.line}
            {source.end_line && source.end_line !== source.line && 
              ` - ${source.end_line}`}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="go"
          value={source.content}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: 'on',
            renderLineHighlight: 'gutter',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
