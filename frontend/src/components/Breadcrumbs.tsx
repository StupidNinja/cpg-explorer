interface BreadcrumbsProps {
  history: Array<{ functionId: string; label: string }>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onHome: () => void;
}

export default function Breadcrumbs({ history, currentIndex, onNavigate, onHome }: BreadcrumbsProps) {
  const maxVisible = 5;
  const start = Math.max(0, history.length - maxVisible);
  const visibleHistory = history.slice(start);
  const offset = start;

  return (
    <div className="mt-2 flex items-center gap-1 text-xs overflow-x-auto pb-1">
      {/* Home */}
      <button
        onClick={onHome}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors flex-shrink-0"
        title="Home"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      </button>

      {start > 0 && (
        <>
          <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <button
            onClick={() => onNavigate(0)}
            className="text-gray-400 hover:text-blue-600 px-1 truncate max-w-[100px]"
            title={history[0].label}
          >
            {history[0].label}
          </button>
          <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-400 px-0.5">...</span>
        </>
      )}

      {visibleHistory.map((entry, i) => {
        const realIndex = i + offset;
        const isCurrent = realIndex === currentIndex;
        return (
          <span key={realIndex} className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <button
              onClick={() => onNavigate(realIndex)}
              className={`px-1.5 py-0.5 rounded truncate max-w-[160px] transition-colors font-mono ${
                isCurrent
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
              }`}
              title={entry.label}
            >
              {entry.label}
            </button>
          </span>
        );
      })}
    </div>
  );
}
