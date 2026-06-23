import { useState } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import TopElementsChart from "./TopElementsChart";
import PriorityMatrix from "./PriorityMatrix";
import IfcTypeMatrix from "./IfcTypeMatrix";
import DistanceHistogram from "./DistanceHistogram";
import ConstructionPhaseView from "./ConstructionPhaseView";

export default function DeepDiveAnalytics({ chartData, totalClashes }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="dashboard-section py-2 border-t-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-slate-800">Deep Dive Analytics</h2>
            <p className="text-[0.65rem] text-slate-500 font-medium">Advanced clustering, pareto, and phase analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="section-badge hidden sm:flex">5 Views</span>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4 animate-fade-in">
          <div className="card-elevated h-full">
            <TopElementsChart topElements={chartData.topElements} totalClashes={totalClashes} />
          </div>
          <div className="card-elevated h-full">
            <PriorityMatrix priorityMatrixData={chartData.priorityMatrix} />
          </div>
          <div className="card-elevated h-full">
            <IfcTypeMatrix ifcTypePairs={chartData.ifcTypePairs} />
          </div>
          <div className="card-elevated h-full">
            <DistanceHistogram distanceDistribution={chartData.distanceDistribution} />
          </div>
          <div className="card-elevated h-full">
            <ConstructionPhaseView phaseData={chartData.phaseData} />
          </div>
        </div>
      )}
    </section>
  );
}
