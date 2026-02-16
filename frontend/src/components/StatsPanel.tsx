import { Stats } from '../api/schema';

interface StatsPanelProps {
  stats: Stats;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="flex gap-6 text-sm">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">
          {formatNumber(stats.nodes)}
        </div>
        <div className="text-gray-500">Nodes</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">
          {formatNumber(stats.edges)}
        </div>
        <div className="text-gray-500">Edges</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">
          {formatNumber(stats.functions)}
        </div>
        <div className="text-gray-500">Functions</div>
      </div>
    </div>
  );
}
