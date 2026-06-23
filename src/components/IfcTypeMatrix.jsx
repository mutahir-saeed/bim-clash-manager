import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function IfcTypeMatrix({ ifcTypePairs }) {
  const [page, setPage] = useState(1);
  const pageSize = 8;

  if (!ifcTypePairs || ifcTypePairs.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(ifcTypePairs.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginatedPairs = ifcTypePairs.slice(start, start + pageSize);

  // Use the global max total to ensure progress bars are scaled correctly across pages
  const maxTotal = ifcTypePairs[0].total;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide">
          Top IFC Type Pairs
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {start + 1}-{Math.min(start + pageSize, ifcTypePairs.length)} of {ifcTypePairs.length}
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

      <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {paginatedPairs.map((pair, idx) => {
          const percent = ((pair.total / maxTotal) * 100).toFixed(1);
          
          return (
            <div key={idx} className="text-xs group">
              <div className="flex justify-between items-end mb-1.5">
                <span className="font-bold text-slate-700 truncate pr-2 group-hover:text-blue-600 transition-colors" title={pair.name}>
                  {pair.name}
                </span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                  {pair.total}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  className="transition-all duration-500 ease-out hover:opacity-80"
                  style={{ width: `${(pair.Critical / pair.total) * percent}%`, background: "linear-gradient(90deg, #ef4444, #dc2626)" }} 
                  title={`${pair.Critical} Critical`}
                />
                <div 
                  className="transition-all duration-500 ease-out hover:opacity-80"
                  style={{ width: `${(pair.Major / pair.total) * percent}%`, background: "linear-gradient(90deg, #f97316, #ea580c)" }} 
                  title={`${pair.Major} Major`}
                />
                <div 
                  className="transition-all duration-500 ease-out hover:opacity-80"
                  style={{ width: `${(pair.Minor / pair.total) * percent}%`, background: "linear-gradient(90deg, #fde047, #eab308)" }} 
                  title={`${pair.Minor} Minor`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
