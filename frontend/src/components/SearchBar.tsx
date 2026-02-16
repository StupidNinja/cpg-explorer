import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchFunctions, Node } from '../api/graph';

interface SearchBarProps {
  onSelectFunction: (id: string, name?: string) => void;
}

export default function SearchBar({ onSelectFunction }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms delay for faster response

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as HTMLElement)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: ({ signal }) => searchFunctions(debouncedQuery, signal),
    enabled: debouncedQuery.length >= 2,
    retry: false, // Don't retry on abort
  });

  const handleSelect = (node: Node) => {
    onSelectFunction(node.id, node.name);
    setShowResults(false);
    setQuery(node.name);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search functions by name..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
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
      </div>

      {/* Results Dropdown */}
      {showResults && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {query !== debouncedQuery ? (
            <div className="p-4 text-center text-gray-500">Typing...</div>
          ) : isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results && results.length > 0 ? (
            <ul className="py-2">
              {results.map((node) => (
                <li
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{node.name}</div>
                      {node.type_info && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {node.type_info}
                        </div>
                      )}
                      {node.file && (
                        <div className="text-xs text-gray-400 mt-1">
                          {node.file}
                          {node.line && `:${node.line}`}
                        </div>
                      )}
                    </div>
                    <span className="ml-4 text-xs text-gray-400">
                      ID: {node.id}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No functions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
