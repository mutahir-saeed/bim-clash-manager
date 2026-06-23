import { useState } from "react";
import { Layers, X, ChevronRight, ChevronDown, Building2, Box, LayoutGrid, MapPin } from "lucide-react";

const VIEW_MODES = [
  { key: "stacked", label: "Stacked", icon: Layers },
  { key: "exploded", label: "Exploded", icon: Box },
  { key: "solo", label: "Solo", icon: Building2 },
];

export default function SpatialTreePanel({
  isOpen,
  onClose,
  storeyData,
  isolateStorey,
  viewStoreyPlan,
  showAllStoreys,
  explodeStoreys,
  hasModels,
}) {
  const [spatialMode, setSpatialMode] = useState("stacked");
  const [expandedStorey, setExpandedStorey] = useState(null);
  const [activeStoreyId, setActiveStoreyId] = useState(null);

  if (!isOpen) return null;

  const handleModeChange = (mode) => {
    setSpatialMode(mode);
    if (mode === "stacked") {
      showAllStoreys();
      setActiveStoreyId(null);
    } else if (mode === "exploded") {
      explodeStoreys(2.0);
      setActiveStoreyId(null);
    }
  };

  const handleStoreyClick = (storey) => {
    if (activeStoreyId === storey.id) {
      showAllStoreys();
      setActiveStoreyId(null);
      setSpatialMode("stacked");
    } else {
      isolateStorey(storey.id);
      setActiveStoreyId(storey.id);
      if (spatialMode !== "solo") setSpatialMode("solo");
    }
  };

  const handlePlanView = (storey, e) => {
    e.stopPropagation();
    viewStoreyPlan(storey.id);
    setActiveStoreyId(storey.id);
    setSpatialMode("solo");
  };

  const toggleExpand = (storeyId, e) => {
    e.stopPropagation();
    setExpandedStorey(expandedStorey === storeyId ? null : storeyId);
  };

  const formatElevation = (elev) => {
    if (typeof elev !== "number" || isNaN(elev)) return "";
    const sign = elev >= 0 ? "+" : "";
    return `${sign}${elev.toFixed(2)}m`;
  };

  return (
    <div className="viewer-spatial-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Spatial</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* View Mode Toggles */}
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          {VIEW_MODES.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.key}
                onClick={() => handleModeChange(mode.key)}
                disabled={!hasModels || storeyData.length === 0}
                className={`flex-1 flex items-center justify-center gap-1 text-[0.65rem] font-semibold py-1.5 rounded-md transition-all ${
                  spatialMode === mode.key
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                } ${(!hasModels || storeyData.length === 0) ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <Icon className="w-3 h-3" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Storey Section */}
      {storeyData.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              Building Storeys
            </span>
            <span className="text-[0.6rem] font-medium text-slate-400">
              {storeyData.length}
            </span>
          </div>

          <div className="px-2 py-1">
            {storeyData.map((storey) => (
              <div key={storey.id}>
                {/* Storey Row */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer transition-all ${
                    activeStoreyId === storey.id
                      ? "bg-indigo-50 border border-indigo-200"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                  onClick={() => handleStoreyClick(storey)}
                >
                  {/* Expand toggle */}
                  <button
                    onClick={(e) => toggleExpand(storey.id, e)}
                    className="p-0.5 rounded hover:bg-slate-200 transition-colors shrink-0"
                  >
                    {expandedStorey === storey.id ? (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    )}
                  </button>

                  {/* Storey icon */}
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                  {/* Storey name */}
                  <span className={`flex-1 text-xs font-semibold truncate ${
                    activeStoreyId === storey.id ? "text-indigo-700" : "text-slate-700"
                  }`}>
                    {storey.name}
                  </span>

                  {/* 2D Plan View Button */}
                  <button
                    onClick={(e) => handlePlanView(storey, e)}
                    className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                    title="2D Plan View (Top-down)"
                  >
                    <MapPin className="w-3 h-3" />
                  </button>

                  {/* Elevation badge */}
                  {storey.elevation !== 0 && (
                    <span className="text-[0.55rem] font-mono font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-600 shrink-0">
                      {formatElevation(storey.elevation)}
                    </span>
                  )}

                  {/* Element count */}
                  <span className="text-[0.6rem] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                    {storey.count}
                  </span>
                </div>

                {/* Expanded children */}
                {expandedStorey === storey.id && (
                  <div className="ml-8 mb-1 px-2 py-1.5 text-[0.6rem] text-slate-400 bg-slate-50 rounded-md">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Box className="w-3 h-3" />
                      <span className="font-semibold">{storey.count} elements</span>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStoreyClick(storey); }}
                        className="text-[0.55rem] px-2 py-0.5 rounded bg-indigo-50 text-indigo-500 hover:bg-indigo-100 font-semibold transition-colors"
                      >
                        3D Isolate
                      </button>
                      <button
                        onClick={(e) => handlePlanView(storey, e)}
                        className="text-[0.55rem] px-2 py-0.5 rounded bg-green-50 text-green-600 hover:bg-green-100 font-semibold transition-colors"
                      >
                        2D Plan View
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {storeyData.length === 0 && hasModels && (
        <div className="px-3 py-6 flex flex-col items-center text-center">
          <Layers className="w-8 h-8 text-slate-200 mb-2" />
          <p className="text-[0.7rem] font-medium text-slate-400">No storey data found</p>
          <p className="text-[0.6rem] text-slate-300 mt-1">IFC models need IfcBuildingStorey entities</p>
        </div>
      )}

      {!hasModels && (
        <div className="px-3 py-6 flex flex-col items-center text-center">
          <Layers className="w-8 h-8 text-slate-200 mb-2" />
          <p className="text-[0.7rem] font-medium text-slate-400">Load IFC models first</p>
        </div>
      )}
    </div>
  );
}
