import { useState } from "react";
import { Palette, X, ChevronDown, ChevronRight, Focus, RotateCcw } from "lucide-react";

const COLOR_MODES = [
  { key: "ifcClass", label: "By IFC Class", desc: "Color elements by their IFC type" },
  { key: "category", label: "By Category", desc: "Group by Structural, Envelope, MEP, etc." },
  { key: "material", label: "By Material", desc: "Color by physical material or type" },
  { key: "discipline", label: "By Discipline", desc: "Color by ARC / STR / MEP model" },
];

function rgbToHex(rgb) {
  const r = Math.round(rgb[0] * 255);
  const g = Math.round(rgb[1] * 255);
  const b = Math.round(rgb[2] * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function ViewerLensPanel({
  isOpen,
  onClose,
  colorizeByRule,
  clearColorization,
  isolateByGroup,
  unisolateAll,
  metaGroups,
  activeColorMode,
  hasModels,
}) {
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [isolatedGroup, setIsolatedGroup] = useState(null);

  if (!isOpen) return null;

  const handleApply = (mode) => {
    setExpandedGroup(null);
    setIsolatedGroup(null);
    colorizeByRule(mode);
  };

  const handleClear = () => {
    setExpandedGroup(null);
    setIsolatedGroup(null);
    clearColorization();
  };

  const handleIsolate = (group) => {
    if (isolatedGroup === group.name) {
      // Un-isolate
      unisolateAll();
      setIsolatedGroup(null);
    } else {
      isolateByGroup(group.objectIds);
      setIsolatedGroup(group.name);
    }
  };

  const handleIsolateSubItem = (subItem) => {
    if (isolatedGroup === subItem.name) {
      unisolateAll();
      setIsolatedGroup(null);
    } else {
      isolateByGroup(subItem.objectIds);
      setIsolatedGroup(subItem.name);
    }
  };

  const totalElements = metaGroups ? metaGroups.reduce((s, g) => s + g.count, 0) : 0;
  const activeCount = metaGroups ? metaGroups.filter(g => g.count > 0).length : 0;

  return (
    <div className="viewer-lens-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lens</span>
        </div>
        <div className="flex items-center gap-1">
          {isolatedGroup && (
            <button
              onClick={() => { unisolateAll(); setIsolatedGroup(null); }}
              className="text-[0.6rem] px-2 py-0.5 rounded bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors font-medium"
              title="Show all elements"
            >
              <RotateCcw className="w-2.5 h-2.5 inline mr-0.5" />
              Reset
            </button>
          )}
          {metaGroups && (
            <button
              onClick={handleClear}
              className="text-[0.6rem] px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors font-medium"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="flex gap-1">
          {COLOR_MODES.map(mode => (
            <button
              key={mode.key}
              onClick={() => handleApply(mode.key)}
              disabled={!hasModels}
              className={`flex-1 text-[0.6rem] px-1.5 py-1.5 rounded-md font-semibold transition-all ${
                activeColorMode === mode.key
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              } ${!hasModels ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      {metaGroups && metaGroups.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {/* Stats bar */}
          <div className="px-3 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[0.6rem] font-medium text-slate-400">
              {activeCount} VALUES
            </span>
            <span className="text-[0.6rem] font-medium text-slate-400">
              COUNT
            </span>
          </div>

          {/* Items */}
          <div className="px-1.5 py-1">
            {metaGroups.map((group, i) => (
              <div key={i}>
                {/* Group Row */}
                <div
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-colors ${
                    isolatedGroup === group.name
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  {/* Expand arrow (only for categories with subItems) */}
                  {group.subItems && group.subItems.length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedGroup(expandedGroup === group.name ? null : group.name);
                      }}
                      className="p-0 shrink-0"
                    >
                      {expandedGroup === group.name ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}

                  {/* Color swatch */}
                  <span
                    className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                    style={{ backgroundColor: rgbToHex(group.color) }}
                  />
                  {/* Name */}
                  <span
                    className="flex-1 text-[0.65rem] font-medium text-slate-700 truncate"
                    onClick={() => handleIsolate(group)}
                    title={`Click to isolate ${group.name}`}
                  >
                    {group.name}
                  </span>
                  {/* Focus button */}
                  <button
                    onClick={() => handleIsolate(group)}
                    className={`p-0.5 rounded shrink-0 transition-colors ${
                      isolatedGroup === group.name
                        ? "text-blue-500"
                        : "text-slate-300 hover:text-blue-400"
                    }`}
                    title="Isolate in 3D"
                  >
                    <Focus className="w-3 h-3" />
                  </button>
                  {/* Count */}
                  <span className="text-[0.6rem] font-mono text-slate-400 tabular-nums shrink-0">
                    {group.count.toLocaleString()}
                  </span>
                </div>

                {/* Sub-items (for category mode) */}
                {expandedGroup === group.name && group.subItems && (
                  <div className="ml-5 mb-1">
                    {group.subItems.map((sub, j) => (
                      <div
                        key={j}
                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          isolatedGroup === sub.name
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                        onClick={() => handleIsolateSubItem(sub)}
                        title={`Click to isolate ${sub.name}`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0 bg-slate-300" />
                        <span className="flex-1 text-[0.6rem] text-slate-500 truncate">
                          {sub.name}
                        </span>
                        <span className="text-[0.55rem] font-mono text-slate-300 tabular-nums">
                          {sub.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer stats */}
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-[0.6rem] text-slate-400">
              <span>ACTIVE · <strong className="text-blue-500">{totalElements.toLocaleString()}</strong> COLORED</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!metaGroups && hasModels && (
        <div className="px-3 py-6 flex flex-col items-center text-center">
          <Palette className="w-8 h-8 text-slate-200 mb-2" />
          <p className="text-[0.7rem] font-medium text-slate-400">Select a color mode above</p>
          <p className="text-[0.6rem] text-slate-300 mt-1">Click any element to isolate it in 3D</p>
        </div>
      )}

      {!hasModels && (
        <div className="px-3 py-6 flex flex-col items-center text-center">
          <Palette className="w-8 h-8 text-slate-200 mb-2" />
          <p className="text-[0.7rem] font-medium text-slate-400">Load IFC models first</p>
        </div>
      )}
    </div>
  );
}
