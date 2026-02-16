import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, fetchFindings } from '../api/schema';

interface InsightsDashboardProps {
  onSelectFunction: (functionId: string, name?: string) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  error: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
};

const EDGE_KIND_COLORS: Record<string, string> = {
  ast: '#6366f1',
  ref: '#8b5cf6',
  dfg: '#ec4899',
  cfg: '#f59e0b',
  call: '#3b82f6',
  cdg: '#ef4444',
  dom: '#10b981',
  pdom: '#14b8a6',
  scope: '#6b7280',
};

function BarChart({ items, colorFn }: {
  items: Array<{ label: string; value: number; percentage: number }>;
  colorFn?: (label: string) => string;
}) {
  const maxVal = Math.max(...items.map(i => i.value));
  return (
    <div className="space-y-1.5">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2 text-xs">
          <span className="w-24 text-gray-600 truncate font-mono" title={item.label}>{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max((item.value / maxVal) * 100, 2)}%`,
                backgroundColor: colorFn ? colorFn(item.label) : '#3b82f6',
              }}
            />
          </div>
          <span className="w-16 text-right text-gray-500 tabular-nums">
            {item.value.toLocaleString()}
          </span>
          <span className="w-12 text-right text-gray-400 tabular-nums">
            {item.percentage.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function InsightsDashboard({ onSelectFunction }: InsightsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: ({ signal }) => fetchDashboard(signal),
    staleTime: 10 * 60 * 1000,
  });

  const { data: findings } = useQuery({
    queryKey: ['findings', selectedCategory],
    queryFn: ({ signal }) => fetchFindings(selectedCategory || undefined, 30, signal),
    enabled: selectedCategory !== null,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading insights...
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { overview, nodeDistribution, edgeDistribution, findingsSummary, hotspots, complexityDistribution, packages, errorChains } = dashboard;

  const totalFindings = findingsSummary.reduce((s, f) => s + f.count, 0);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="w-full px-6 py-6 space-y-6">

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Packages', value: overview.total_packages || '0', icon: '📦' },
            { label: 'Files', value: overview.total_files || '0', icon: '📄' },
            { label: 'Functions', value: overview.total_functions || '0', icon: '⚡' },
            { label: 'Findings', value: totalFindings.toLocaleString(), icon: '🔍' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Edge Type Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Edge Type Distribution</h3>
            <p className="text-xs text-gray-500 mb-4">Relationship types in the Code Property Graph</p>
            <BarChart
              items={edgeDistribution.slice(0, 12).map(e => ({
                label: e.edge_kind,
                value: e.count,
                percentage: e.percentage,
              }))}
              colorFn={(label) => EDGE_KIND_COLORS[label] || '#94a3b8'}
            />
          </div>

          {/* Node Type Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Node Type Distribution</h3>
            <p className="text-xs text-gray-500 mb-4">AST and semantic node kinds</p>
            <BarChart
              items={nodeDistribution.slice(0, 12).map(n => ({
                label: n.node_kind,
                value: n.count,
                percentage: n.percentage,
              }))}
            />
          </div>

          {/* Complexity Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Complexity Distribution</h3>
            <p className="text-xs text-gray-500 mb-4">Cyclomatic complexity buckets across all functions</p>
            <div className="space-y-2">
              {complexityDistribution.map(bucket => {
                const maxCount = Math.max(...complexityDistribution.map(b => b.function_count));
                const width = Math.max((bucket.function_count / maxCount) * 100, 3);
                const colorMap: Record<string, string> = {
                  '1 (trivial)': '#10b981',
                  '2-5 (simple)': '#22c55e',
                  '6-10 (moderate)': '#f59e0b',
                  '11-20 (complex)': '#f97316',
                  '21-50 (very complex)': '#ef4444',
                  '51+ (extreme)': '#dc2626',
                };
                return (
                  <div key={bucket.bucket} className="flex items-center gap-2 text-xs">
                    <span className="w-32 text-gray-600 truncate">{bucket.bucket}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${width}%`,
                          backgroundColor: colorMap[bucket.bucket] || '#94a3b8',
                        }}
                      >
                        <span className="text-white text-[10px] font-medium">
                          {bucket.function_count > 50 ? bucket.function_count.toLocaleString() : ''}
                        </span>
                      </div>
                    </div>
                    <span className="w-12 text-right text-gray-500 tabular-nums font-medium">
                      {bucket.function_count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Static Analysis Findings */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Static Analysis Findings</h3>
            <p className="text-xs text-gray-500 mb-4">Issues detected by the CPG analyzer</p>
            <div className="space-y-1.5">
              {findingsSummary.map(f => (
                <button
                  key={`${f.category}-${f.severity}`}
                  onClick={() => setSelectedCategory(selectedCategory === f.category ? null : f.category)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedCategory === f.category ? 'bg-blue-50 ring-1 ring-blue-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SEVERITY_COLORS[f.severity] || 'bg-gray-100 text-gray-600'}`}>
                    {f.severity}
                  </span>
                  <span className="flex-1 text-left font-mono text-gray-700">{f.category}</span>
                  <span className="text-gray-500 tabular-nums font-medium">{f.count.toLocaleString()}</span>
                </button>
              ))}
            </div>
            {selectedCategory && findings && findings.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 max-h-48 overflow-auto">
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  {selectedCategory} findings (showing {findings.length})
                </h4>
                <div className="space-y-1">
                  {findings.map(f => (
                    <button
                      key={f.id}
                      onClick={() => f.node_id && onSelectFunction(f.node_id, f.message.split(' has ')[0] || f.node_id)}
                      className="w-full text-left px-2 py-1.5 rounded text-[11px] hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-gray-700 truncate">{f.message}</div>
                      <div className="text-gray-400 truncate">{f.file}:{f.line}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hotspots */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Code Hotspots</h3>
          <p className="text-xs text-gray-500 mb-4">Functions with highest combination of complexity, size, connectivity, and findings</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-2 pr-4 font-medium">Function</th>
                  <th className="pb-2 pr-4 font-medium">Package</th>
                  <th className="pb-2 pr-2 font-medium text-right">Score</th>
                  <th className="pb-2 pr-2 font-medium text-right">Complexity</th>
                  <th className="pb-2 pr-2 font-medium text-right">LOC</th>
                  <th className="pb-2 pr-2 font-medium text-right">Fan In</th>
                  <th className="pb-2 pr-2 font-medium text-right">Fan Out</th>
                  <th className="pb-2 font-medium text-right">Findings</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.slice(0, 15).map((h) => (
                  <tr
                    key={h.function_id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onSelectFunction(h.function_id, h.name)}
                  >
                    <td className="py-2 pr-4">
                      <span className="font-mono text-gray-900 font-medium">{h.name}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500 truncate max-w-[150px]">{h.package}</td>
                    <td className="py-2 pr-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded font-medium ${
                        h.hotspot_score > 30 ? 'bg-red-100 text-red-700'
                        : h.hotspot_score > 15 ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                      }`}>
                        {h.hotspot_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums text-gray-700">{h.complexity}</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-gray-700">{h.loc.toLocaleString()}</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-gray-700">{h.fan_in}</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-gray-700">{h.fan_out}</td>
                    <td className="py-2 text-right tabular-nums text-gray-700">{h.finding_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Packages */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Packages by LOC</h3>
            <p className="text-xs text-gray-500 mb-4">Largest packages in the codebase</p>
            <div className="space-y-1.5">
              {packages.slice(0, 15).map(pkg => {
                const maxLoc = packages[0]?.loc || 1;
                return (
                  <div key={pkg.package} className="flex items-center gap-2 text-xs">
                    <span className="w-40 font-mono text-gray-700 truncate" title={pkg.package}>{pkg.package}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.max((pkg.loc / maxLoc) * 100, 2)}%` }}
                      />
                    </div>
                    <div className="flex gap-3 text-gray-500 tabular-nums">
                      <span title="Lines of code">{pkg.loc.toLocaleString()} loc</span>
                      <span title="Functions">{pkg.functions} fn</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Chains */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Error Handling Chains</h3>
            <p className="text-xs text-gray-500 mb-4">Functions that wrap and propagate errors</p>
            <div className="space-y-1">
              {errorChains.slice(0, 15).map(ec => (
                <button
                  key={ec.function_id}
                  onClick={() => onSelectFunction(ec.function_id, ec.name)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  <span className="flex-1 text-left font-mono text-gray-700 truncate">{ec.name}</span>
                  <span className="text-gray-400 truncate max-w-[100px]">{ec.package}</span>
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-medium" title="Error wraps">
                    {ec.error_wraps} wraps
                  </span>
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium" title="Error returns">
                    {ec.error_returns} returns
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
