import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TopElementsChart({ topElements, totalClashes }) {
  const [page, setPage] = useState(1);
  const pageSize = 8;

  if (!topElements || topElements.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(topElements.length / pageSize));
  
  // Pareto calculation based on all elements (not just visible ones)
  const topCount = topElements.reduce((sum, el) => sum + el.count, 0);
  const paretoPercent = totalClashes > 0 ? ((topCount / totalClashes) * 100).toFixed(1) : 0;

  // Pagination slice
  const start = (page - 1) * pageSize;
  const paginatedData = topElements.slice(start, start + pageSize);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg p-3 bg-white border border-slate-200 shadow-xl tooltip min-w-[200px]">
        <p className="text-xs font-bold mb-2 text-slate-800">
          {label}
        </p>
        <div className="flex flex-col gap-1.5 text-xs">
          <span className="text-slate-500 font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded w-fit">ID: {payload[0].payload.id}</span>
          <span className="text-slate-600 mt-1">
            Total Clashes: <span className="font-bold text-blue-600">{payload[0].value}</span>
          </span>
          <div className="flex gap-3 mt-1 pt-2 border-t border-slate-100 font-semibold">
            <span className="text-red-500">Crit: {payload[0].payload.severities.Critical}</span>
            <span className="text-orange-500">Maj: {payload[0].payload.severities.Major}</span>
            <span className="text-yellow-500">Min: {payload[0].payload.severities.Minor}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide">
          Top Clashing Elements
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {start + 1}-{Math.min(start + pageSize, topElements.length)} of {topElements.length}
            </span>
            <div className="flex gap-1">
              <button 
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={paginatedData} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBlue" x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: "#334155", fontSize: 10, fontWeight: 600 }} 
              width={130} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + "..." : val}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="count" fill="url(#colorBlue)" radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-center text-[0.7rem] text-slate-500 font-medium">
        These <span className="font-bold text-slate-700">{topElements.length}</span> elements account for <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{paretoPercent}%</span> of all filtered clashes.
      </div>
    </div>
  );
}
