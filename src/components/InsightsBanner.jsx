import { Sparkles, Building2, Zap, Layers } from "lucide-react";

export default function InsightsBanner({ kpis, chartData, totalFiltered, clashes }) {
  if (!clashes || clashes.length === 0) return null;

  // Insight 1: Noise reduction potential
  const noisePercent = kpis.noiseReductionPercent > 0 ? kpis.noiseReductionPercent.toFixed(1) : "0";

  // Insight 2: Worst floor
  let worstFloor = null;
  if (chartData.floorData && chartData.floorData.length > 0) {
    worstFloor = [...chartData.floorData].sort((a, b) => b.Critical - a.Critical)[0];
  }

  // Insight 3: Worst element
  let worstElement = null;
  let elementPercent = "0";
  if (chartData.topElements && chartData.topElements.length > 0) {
    worstElement = chartData.topElements[0];
    elementPercent = ((worstElement.count / clashes.length) * 100).toFixed(1);
  }

  return (
    <div className="rounded-xl p-5 relative overflow-hidden shadow-sm border border-blue-100/50 animate-enter"
         style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)' }}>
      {/* Decorative circles in background */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-blue-200/30 blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-green-200/30 blur-2xl pointer-events-none" />
      
      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
        
        {/* Title / Icon */}
        <div className="flex items-center gap-2 md:mr-4">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 leading-tight whitespace-nowrap">AI Insights</h4>
            <span className="text-[0.65rem] text-slate-500 font-medium whitespace-nowrap">Auto-generated</span>
          </div>
        </div>

        {/* Insight Cards Container */}
        <div className="flex flex-wrap items-center gap-3 w-full">
          
          {/* Noise Reduction Insight */}
          {kpis.noiseReductionPercent > 0 && (
            <div 
              className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-lg px-4 py-3 shadow-sm border border-white/50 w-full sm:w-auto min-w-[220px] transition-transform hover:-translate-y-0.5 cursor-help"
              title="Automatically filters out clashes <5mm (tolerance), same-discipline touches, and architectural finishes vs structure."
            >
              <Zap className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wide">Noise Reduction</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-lg font-black text-blue-700">{noisePercent}%</p>
                  <p className="text-[10px] text-slate-500 leading-tight">of clashes filtered<br/>as irrelevant</p>
                </div>
              </div>
            </div>
          )}

          {/* Worst Floor Insight */}
          {worstFloor && worstFloor.Critical > 0 && (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-lg px-4 py-3 shadow-sm border border-white/50 w-full sm:w-auto min-w-[220px] transition-transform hover:-translate-y-0.5">
              <Building2 className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wide">Critical Hotspot</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-lg font-black text-red-600 truncate max-w-[80px]" title={worstFloor.name}>{worstFloor.name}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">has {worstFloor.Critical} critical<br/>clash points</p>
                </div>
              </div>
            </div>
          )}

          {/* Worst Element Insight */}
          {worstElement && (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-lg px-4 py-3 shadow-sm border border-white/50 w-full sm:w-auto min-w-[220px] transition-transform hover:-translate-y-0.5">
              <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wide">Offending Element</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-lg font-black text-indigo-700">{elementPercent}%</p>
                  <p className="text-[10px] text-slate-500 leading-tight">of issues caused by<br/>a single element</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
