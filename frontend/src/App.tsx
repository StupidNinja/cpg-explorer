import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchBar from './components/SearchBar';
import GraphView from './components/GraphView';
import CodeViewer from './components/CodeViewer';
import StatsPanel from './components/StatsPanel';
import TopFunctions from './components/TopFunctions';
import NodeDetailPanel from './components/NodeDetailPanel';
import Breadcrumbs from './components/Breadcrumbs';
import InsightsDashboard from './components/InsightsDashboard';
import { fetchStats } from './api/schema';

type AppView = 'explorer' | 'insights';

interface HistoryEntry {
  functionId: string;
  label: string;
}

function App() {
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSource, setShowSource] = useState(false);
  const [appView, setAppView] = useState<AppView>('explorer');

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const navigateTo = useCallback((functionId: string, label?: string) => {
    setSelectedFunction(functionId);
    setSelectedNode(functionId);
    setShowSource(false);

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      const entry: HistoryEntry = {
        functionId,
        label: label || (functionId.includes('::') ? functionId.split('::')[1]?.split('@')[0] : functionId.split('/').pop() || functionId),
      };
      newHistory.push(entry);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setSelectedFunction(prev.functionId);
      setSelectedNode(prev.functionId);
      setShowSource(false);
    }
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setSelectedFunction(next.functionId);
      setSelectedNode(next.functionId);
      setShowSource(false);
    }
  }, [history, historyIndex]);

  const goToHistoryEntry = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      const entry = history[index];
      setHistoryIndex(index);
      setSelectedFunction(entry.functionId);
      setSelectedNode(entry.functionId);
      setShowSource(false);
    }
  }, [history]);

  const handleSelectFunction = useCallback((id: string, name?: string) => {
    navigateTo(id, name);
  }, [navigateTo]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    setShowSource(false);
  }, []);

  const handleNodeDoubleClick = useCallback((nodeId: string, nodeName?: string) => {
    navigateTo(nodeId, nodeName);
  }, [navigateTo]);

  const handleExploreGraph = useCallback((nodeId: string, nodeName?: string) => {
    navigateTo(nodeId, nodeName);
  }, [navigateTo]);

  const handleViewSource = useCallback(() => {
    setShowSource(true);
  }, []);

  const handleGoHome = useCallback(() => {
    setSelectedFunction(null);
    setSelectedNode(null);
    setShowSource(false);
    setHistory([]);
    setHistoryIndex(-1);
    setAppView('explorer');
  }, []);

  const handleSelectFromInsights = useCallback((id: string, name?: string) => {
    setAppView('explorer');
    navigateTo(id, name);
  }, [navigateTo]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoHome}
                className="flex items-center gap-2 group"
                title="Go to home"
              >
                <svg className="w-7 h-7 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CPG Explorer</h1>
                <p className="text-xs text-gray-500">
                  Code Property Graph Browser for Go Projects
                </p>
              </div>
              {/* Navigation buttons */}
              {history.length > 0 && (
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={goBack}
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Go back"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goForward}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Go forward"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {stats && <StatsPanel stats={stats} />}
          </div>
          <div className="mt-3">
            <SearchBar onSelectFunction={handleSelectFunction} />
          </div>
          {/* Breadcrumbs */}
          {history.length > 0 && (
            <Breadcrumbs
              history={history}
              currentIndex={historyIndex}
              onNavigate={goToHistoryEntry}
              onHome={handleGoHome}
            />
          )}
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-0 -mb-px">
          <button
            onClick={() => setAppView('explorer')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              appView === 'explorer'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              Explorer
            </span>
          </button>
          <button
            onClick={() => setAppView('insights')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              appView === 'insights'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Insights
            </span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {appView === 'insights' ? (
          <div className="flex-1 overflow-auto">
            <InsightsDashboard onSelectFunction={handleSelectFromInsights} />
          </div>
        ) : (
          <>
        {/* Graph View - Takes up 60% */}
        <div className="flex-1 bg-white border-r border-gray-200 overflow-auto">
          {selectedFunction ? (
            <GraphView
              functionId={selectedFunction}
              onSelectNode={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
            />
          ) : (
            <div className="h-full">
              <TopFunctions onSelectFunction={handleSelectFunction} />
              <div className="px-6 py-8 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No function selected
                </h3>
                <p className="text-sm">
                  Search for a function or click on a card above to explore its call graph
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - 40% */}
        <div className="w-2/5 flex flex-col bg-gray-900">
          {showSource ? (
            <div className="flex flex-col h-full">
              <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
                <button
                  onClick={() => setShowSource(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-200 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Details
                </button>
                <span className="text-xs text-gray-500 truncate">Source Code</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeViewer nodeId={selectedNode} />
              </div>
            </div>
          ) : selectedNode ? (
            <NodeDetailPanel
              nodeId={selectedNode}
              isRootNode={selectedNode === selectedFunction}
              onExploreGraph={handleExploreGraph}
              onViewSource={handleViewSource}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-300">Function Details</h3>
                <p className="mt-2 text-sm text-gray-500">Click a node to view details, double-click to explore</p>
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
