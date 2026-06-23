import { Clock } from "lucide-react";

export default function ConstructionPhaseView({ phaseData }) {
  if (!phaseData || phaseData.length === 0) return null;

  let maxCritical = -1;
  let maxTotal = -1;
  let bottleneckIndex = 0;

  phaseData.forEach((phase, idx) => {
    if (phase.Critical > maxCritical || (phase.Critical === maxCritical && phase.total > maxTotal)) {
      maxCritical = phase.Critical;
      maxTotal = phase.total;
      bottleneckIndex = idx;
    }
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide">
          Construction Phases
        </h3>
        <div className="flex items-center gap-1.5 text-[0.65rem] text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full font-bold shadow-sm border border-rose-100">
          <Clock className="w-3.5 h-3.5" />
          Bottleneck Identified
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {phaseData.map((phase, idx) => {
          const isBottleneck = idx === bottleneckIndex;
          return (
            <div 
              key={idx}
              className={`relative rounded-lg border p-3.5 transition-all duration-300 group hover:-translate-y-0.5 ${
                isBottleneck 
                  ? "bg-rose-50/80 border-rose-200 shadow-sm hover:shadow-md" 
                  : "bg-slate-50/50 border-slate-200 hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              {isBottleneck && (
                <div className="absolute -left-[1px] top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-400 to-rose-600 rounded-l-lg shadow-[0_0_8px_rgba(225,29,72,0.4)]"></div>
              )}
              
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <h4 className={`text-xs font-bold ${isBottleneck ? "text-rose-900" : "text-slate-700 group-hover:text-blue-900 transition-colors"}`}>
                    {phase.name}
                  </h4>
                  {isBottleneck && (
                    <span className="text-[0.65rem] text-rose-600 font-semibold tracking-wide uppercase mt-0.5 inline-block">Critical Path Risk</span>
                  )}
                </div>
                <div className={`text-sm font-mono font-black ${isBottleneck ? "text-rose-700" : "text-slate-800"}`}>
                  {phase.total}
                </div>
              </div>

              <div className="flex items-center gap-3 text-[0.65rem] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-red-500 shadow-inner"></span>
                  <span className="text-slate-600 font-mono">{phase.Critical}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-orange-500 shadow-inner"></span>
                  <span className="text-slate-600 font-mono">{phase.Major}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-yellow-400 shadow-inner"></span>
                  <span className="text-slate-600 font-mono">{phase.Minor}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
