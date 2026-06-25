import { useEffect, useRef, useState, useCallback } from "react";
import {
  Building2,
  Layers,
  Wrench,
  RotateCcw,
  Maximize2,
  Loader2,
  AlertCircle,
  Box,
  Upload,
  Scissors,
  CheckCircle2,
  Eye,
  Grid,
  Palette,
  LayoutGrid,
  FlipHorizontal,
  Trash2,
  ArrowDownFromLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  Map,
} from "lucide-react";
import { useIfcScene } from "../hooks/useIfcScene";
import { DISCIPLINE_COLORS } from "../config/viewer";
import ViewerLensPanel from "./ViewerLensPanel";
import SpatialTreePanel from "./SpatialTreePanel";

const DISCIPLINE_CONFIG = {
  ARC: { icon: Building2, color: "#3b82f6", label: "ARC" },
  STR: { icon: Layers, color: "#f59e0b", label: "STR" },
  MEP: { icon: Wrench, color: "#10b981", label: "MEP" },
};

export default function IfcViewer({ selectedClash, filteredClashIds, onPickedElementChange, isDemo }) {
  const containerRef = useRef(null); // canvas
  const wrapperRef = useRef(null); // outer div
  const fileInputRef = useRef(null);

  const {
    init,
    loadMultipleIfc,
    resetView,
    isolateElements,
    setDisciplineVisible,
    zoomToClash,
    highlightClash,
    clearHighlights,
    setViewMode,
    isInitialized,
    isLoading,
    progress,
    loadingFile,
    error,
    loadedModels,
    
    // Lens / Colorize
    colorizeByRule,
    clearColorization,
    isolateByGroup,
    unisolateAll,
    metaGroups,
    activeColorMode,
    
    // Storey / Spatial
    storeyData,
    isolateStorey,
    viewStoreyPlan,
    showAllStoreys,
    explodeStoreys,

    // Section Planes
    clippingActive,
    activeSectionPlanes,
    addSectionPlane,
    flipSectionPlane,
    removeSectionPlane,
    clearSectionPlanes,
  } = useIfcScene(containerRef, { onElementPicked: onPickedElementChange });

  const [disciplineVisibility, setDisciplineVisibility] = useState({
    ARC: true,
    STR: true,
    MEP: true,
  });

  const [activeViewMode, setActiveViewMode] = useState("normal");
  const [showLensPanel, setShowLensPanel] = useState(false);
  const [showSpatialPanel, setShowSpatialPanel] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  // Auto-hide success badge after 3s
  useEffect(() => {
    if (loadedModels.length > 0) {
      setShowSuccessBadge(true);
      const timer = setTimeout(() => setShowSuccessBadge(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [loadedModels.length]);

  // Initialize the scene on mount
  useEffect(() => {
    init();
  }, [init]);

  // Auto-load demo models
  useEffect(() => {
    if (isDemo && isInitialized && loadedModels.length === 0 && !isLoading) {
      const loadDemoIFCs = async () => {
        try {
          const fetchAsFile = async (url, filename) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${filename}`);
            const blob = await res.blob();
            return new File([blob], filename, { type: "application/octet-stream" });
          };

          const files = await Promise.all([
            fetchAsFile("/01_BIMcollab_Example_ARC.ifc", "01_BIMcollab_Example_ARC.ifc"),
            fetchAsFile("/02_BIMcollab_Example_STR_optimized.ifc", "02_BIMcollab_Example_STR_optimized.ifc"),
            fetchAsFile("/03_BIMcollab_Example_MEP_optimized.ifc", "03_BIMcollab_Example_MEP_optimized.ifc"),
          ]);
          
          loadMultipleIfc(files);
        } catch (err) {
          console.error("Failed to load demo IFCs:", err);
        }
      };
      loadDemoIFCs();
    }
  }, [isDemo, isInitialized, loadedModels.length, isLoading, loadMultipleIfc]);

  // Handle filtering
  useEffect(() => {
    if (!isInitialized || selectedClash) return;
    isolateElements(filteredClashIds);
  }, [isInitialized, filteredClashIds, selectedClash, isolateElements]);

  // Handle clash selection — zoom and highlight
  useEffect(() => {
    if (!isInitialized) return;

    if (selectedClash) {
      zoomToClash(selectedClash);
      highlightClash(selectedClash);
    } else {
      clearHighlights();
      isolateElements(filteredClashIds);
    }
  }, [selectedClash, isInitialized, zoomToClash, highlightClash, clearHighlights, isolateElements, filteredClashIds]);

  // Toggle discipline visibility
  const toggleDiscipline = useCallback(
    (disc) => {
      setDisciplineVisibility((prev) => {
        const next = { ...prev, [disc]: !prev[disc] };
        setDisciplineVisible(disc, next[disc]);
        return next;
      });
    },
    [setDisciplineVisible]
  );

  // Fullscreen
  const handleFullscreen = useCallback(() => {
    if (wrapperRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        wrapperRef.current.requestFullscreen();
      }
    }
  }, []);

  // File picker
  const handleFileSelect = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      const ifcFiles = files.filter((f) =>
        f.name.toLowerCase().endsWith(".ifc")
      );
      if (ifcFiles.length > 0) {
        await loadMultipleIfc(ifcFiles);
      }
    },
    [loadMultipleIfc]
  );

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files || []);
      const ifcFiles = files.filter((f) =>
        f.name.toLowerCase().endsWith(".ifc")
      );
      if (ifcFiles.length > 0) {
        await loadMultipleIfc(ifcFiles);
      }
    },
    [loadMultipleIfc]
  );

  const hasModels = loadedModels.length > 0;

  return (
    <div
      ref={wrapperRef}
      className={`viewer-container flex-1 ${showGrid ? "blueprint-grid" : ""}`}
      style={{ border: "1px solid var(--color-border)" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ifc"
        multiple
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Toolbar */}
      <div className="viewer-toolbar">
        {/* Load IFC button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="viewer-toolbar-btn"
          title="Load IFC Files"
          style={
            !hasModels
              ? {
                  borderColor: "var(--color-accent)",
                  color: "var(--color-accent)",
                  background: "rgba(79,158,248,0.15)",
                }
              : {}
          }
        >
          <Upload className="w-3 h-3" />
          {hasModels ? "Load" : "Load IFC"}
        </button>

        <button
          onClick={resetView}
          className="viewer-toolbar-btn"
          title="Reset View"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        <div className="w-px h-6 bg-[var(--color-border)] opacity-50 mx-1 self-center" />

        {/* View Modes */}
        <button
          onClick={() => { setViewMode("normal"); setActiveViewMode("normal"); }}
          className={`viewer-toolbar-btn ${activeViewMode === "normal" ? "active" : ""}`}
          title="Normal Mode"
        >
          <Box className="w-3 h-3" />
          Solid
        </button>
        <button
          onClick={() => { setViewMode("xray"); setActiveViewMode("xray"); }}
          className={`viewer-toolbar-btn ${activeViewMode === "xray" ? "active" : ""}`}
          title="X-Ray Mode"
        >
          <Eye className="w-3 h-3" />
          X-Ray
        </button>
        <button
          onClick={() => { setViewMode("wireframe"); setActiveViewMode("wireframe"); }}
          className={`viewer-toolbar-btn ${activeViewMode === "wireframe" ? "active" : ""}`}
          title="Wireframe Mode"
        >
          <Grid className="w-3 h-3" />
          Wire
        </button>

        <div className="w-px h-6 bg-[var(--color-border)] opacity-50 mx-1 self-center" />

        {/* Discipline Toggles */}
        {Object.entries(DISCIPLINE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = disciplineVisibility[key];
          const hasModel = loadedModels.some((m) => m.discipline === key);
          return (
            <button
              key={key}
              onClick={() => toggleDiscipline(key)}
              className={`viewer-toolbar-btn ${isActive && hasModel ? "active" : ""}`}
              style={
                isActive && hasModel
                  ? {
                      borderColor: config.color,
                      color: config.color,
                      background: `${config.color}15`,
                    }
                  : hasModel
                    ? {}
                    : { opacity: 0.3 }
              }
              title={`Toggle ${config.label}`}
              disabled={!hasModel}
            >
              <Icon className="w-3 h-3" />
              {config.label}
            </button>
          );
        })}

        {/* Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`viewer-toolbar-btn ${showGrid ? "active" : ""}`}
          title="Toggle Background Grid"
        >
          <Map className="w-3 h-3" />
          Grid
        </button>

        <div className="w-px h-6 bg-[var(--color-border)] opacity-50 mx-1 self-center" />

        {/* Lens (Colorize) */}
        <button
          onClick={() => { setShowLensPanel(!showLensPanel); setShowSpatialPanel(false); }}
          className={`viewer-toolbar-btn ${showLensPanel || activeColorMode ? "active" : ""}`}
          title="Colorize by Rule"
          style={
            showLensPanel || activeColorMode
              ? { borderColor: "#7c3aed", color: "#7c3aed", background: "#f5f3ff" }
              : {}
          }
        >
          <Palette className="w-3 h-3" />
          Lens
        </button>

        {/* Spatial Tree */}
        <button
          onClick={() => { setShowSpatialPanel(!showSpatialPanel); setShowLensPanel(false); }}
          className={`viewer-toolbar-btn ${showSpatialPanel ? "active" : ""}`}
          title="Spatial / Storey Tree"
          style={
            showSpatialPanel
              ? { borderColor: "#6366f1", color: "#6366f1", background: "#eef2ff" }
              : {}
          }
        >
          <LayoutGrid className="w-3 h-3" />
          Floors
        </button>

        {/* Section Plane Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSectionMenu(!showSectionMenu)}
            className={`viewer-toolbar-btn ${clippingActive ? "active" : ""}`}
            title="Section Planes"
            style={
              clippingActive
                ? { borderColor: "#7c3aed", color: "#7c3aed", background: "#f5f3ff" }
                : {}
            }
          >
            <Scissors className="w-3 h-3" />
            Section
          </button>

          {/* Section plane dropdown menu */}
          {showSectionMenu && (
            <div className="viewer-section-dropdown">
              <button
                onClick={() => { addSectionPlane("x"); setShowSectionMenu(false); }}
                className="viewer-section-item"
              >
                <ArrowRightFromLine className="w-3 h-3" />
                Section X
              </button>
              <button
                onClick={() => { addSectionPlane("y"); setShowSectionMenu(false); }}
                className="viewer-section-item"
              >
                <ArrowDownFromLine className="w-3 h-3" />
                Section Y (Floor Cut)
              </button>
              <button
                onClick={() => { addSectionPlane("z"); setShowSectionMenu(false); }}
                className="viewer-section-item"
              >
                <ArrowUpFromLine className="w-3 h-3" />
                Section Z
              </button>
              {activeSectionPlanes.length > 0 && (
                <>
                  <div className="w-full h-px bg-slate-200 my-1" />
                  {activeSectionPlanes.map(plane => (
                    <div key={plane.id} className="flex items-center gap-1 px-2 py-1">
                      <span className="text-[0.6rem] text-slate-500 flex-1 font-mono">
                        {plane.axis.toUpperCase()} plane
                      </span>
                      <button
                        onClick={() => flipSectionPlane(plane.id)}
                        className="p-0.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-500"
                        title="Flip direction"
                      >
                        <FlipHorizontal className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeSectionPlane(plane.id)}
                        className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="w-full h-px bg-slate-200 my-1" />
                  <button
                    onClick={() => { clearSectionPlanes(); setShowSectionMenu(false); }}
                    className="viewer-section-item text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="viewer-toolbar-btn"
          title="Fullscreen"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* ═══ OVERLAY PANELS ═══ */}

      {/* Lens Panel (right side) */}
      <ViewerLensPanel
        isOpen={showLensPanel}
        onClose={() => setShowLensPanel(false)}
        colorizeByRule={colorizeByRule}
        clearColorization={clearColorization}
        isolateByGroup={isolateByGroup}
        unisolateAll={unisolateAll}
        metaGroups={metaGroups}
        activeColorMode={activeColorMode}
        hasModels={hasModels}
      />

      {/* Spatial Tree Panel (left side) */}
      <SpatialTreePanel
        isOpen={showSpatialPanel}
        onClose={() => setShowSpatialPanel(false)}
        storeyData={storeyData}
        isolateStorey={isolateStorey}
        viewStoreyPlan={viewStoreyPlan}
        showAllStoreys={showAllStoreys}
        explodeStoreys={explodeStoreys}
        hasModels={hasModels}
      />

      {/* Status indicators */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5" style={{ pointerEvents: "none" }}>
        {/* Loading bar */}
        {isLoading && (
          <div
            className="flex flex-col gap-1 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid var(--color-border)",
              minWidth: 180,
              pointerEvents: "auto",
            }}
          >
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-[var(--color-accent)]" />
              <span
                className="text-[0.65rem] font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                {loadingFile
                  ? `Parsing ${loadingFile}…`
                  : "Loading model…"}
              </span>
            </div>
            <div className="viewer-progress-bar">
              <div
                className="viewer-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Model count */}
        {hasModels && !isLoading && showSuccessBadge && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[0.65rem] animate-in fade-in slide-in-from-top-2"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid #bbf7d0",
              pointerEvents: "auto",
            }}
          >
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <span style={{ color: "#16a34a" }}>
              {loadedModels.length} model{loadedModels.length !== 1 ? "s" : ""}{" "}
              loaded
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[0.65rem] max-w-[220px]"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid #fecaca",
              pointerEvents: "auto",
            }}
          >
            <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
            <span className="truncate" style={{ color: "#dc2626" }}>
              {error}
            </span>
          </div>
        )}
      </div>

      {/* Clash overlay label */}
      {selectedClash && (
        <div
          className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid #bfdbfe",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <span
            className="font-mono text-xs font-bold"
            style={{ color: "var(--color-accent)" }}
          >
            {selectedClash.displayId}
          </span>
          <span
            className="text-[0.65rem]"
            style={{ color: "var(--color-text-dim)" }}
          >
            ·
          </span>
          <span
            className="text-[0.65rem] font-mono"
            style={{ color: "var(--color-text-secondary)" }}
          >
            -{Math.round(Math.abs(selectedClash.distance) * 1000)}mm
          </span>
          <span
            className="text-[0.65rem]"
            style={{ color: "var(--color-text-dim)" }}
          >
            ·
          </span>
          <span
            className="text-[0.65rem]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {selectedClash.floor}
          </span>
        </div>
      )}

      {/* Clipping indicator */}
      {clippingActive && (
        <div
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded text-[0.65rem]"
          style={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid #ddd6fe",
          }}
        >
          <Scissors className="w-3 h-3" style={{ color: "#7c3aed" }} />
          <span style={{ color: "#7c3aed" }}>
            {activeSectionPlanes.length} section plane{activeSectionPlanes.length !== 1 ? "s" : ""} active
          </span>
        </div>
      )}

      {/* Empty state — no models loaded yet */}
      {!hasModels && !isLoading && isInitialized && (
        <div className="absolute inset-0 z-5 flex flex-col items-center justify-center pointer-events-none">
          <div
            className="flex flex-col items-center pointer-events-auto cursor-pointer p-8 rounded-2xl transition-all"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: isDragging
                ? "#eff6ff"
                : "rgba(255,255,255,0.8)",
              border: isDragging
                ? "2px dashed #2563eb"
                : "2px dashed #cbd5e1",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <Box className="w-8 h-8 text-[var(--color-accent)]" />
            </div>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              Load IFC Models
            </p>
            <p
              className="text-xs text-center max-w-xs mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              Drop your IFC files here or click to browse.
              <br />
              Supports multiple files (ARC, STR, MEP).
            </p>
            <div className="flex items-center gap-3">
              {Object.entries(DISCIPLINE_COLORS).map(([key, config]) => (
                <span
                  key={key}
                  className="text-[0.65rem] font-bold uppercase"
                  style={{ color: config.hex }}
                >
                  {config.label}
                </span>
              ))}
            </div>

            {/* Show clash info if a clash is selected but no model loaded */}
            {selectedClash && (
              <div
                className="mt-6 w-full max-w-sm p-4 rounded-lg"
                style={{
                  background: "rgba(79,158,248,0.08)",
                  border: "1px solid rgba(79,158,248,0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {selectedClash.displayId}
                  </span>
                  <span
                    className={`badge-severity badge-${selectedClash.severity.toLowerCase()}`}
                  >
                    {selectedClash.severity}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span style={{ color: "var(--color-text-dim)" }}>
                      Distance:{" "}
                    </span>
                    <span
                      className="font-mono"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      -{Math.round(Math.abs(selectedClash.distance) * 1000)}mm
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-dim)" }}>
                      Floor:{" "}
                    </span>
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {selectedClash.floor}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-dim)" }}>
                      Grid:{" "}
                    </span>
                    <span
                      className="font-mono"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {selectedClash.gridRef}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-dim)" }}>
                      Pair:{" "}
                    </span>
                    <span className="pair-badge text-[0.6rem]">
                      {selectedClash.disciplinePair}
                    </span>
                  </div>
                </div>
                <div
                  className="mt-2 text-[0.65rem] font-mono"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  XYZ: ({selectedClash.x.toFixed(2)},{" "}
                  {selectedClash.y.toFixed(2)}, {selectedClash.z.toFixed(2)})
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && hasModels && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{
            background: "rgba(15,17,23,0.7)",
            border: "3px dashed rgba(79,158,248,0.5)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div className="flex flex-col items-center">
            <Upload
              className="w-10 h-10 mb-2"
              style={{ color: "var(--color-accent)" }}
            />
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Drop IFC files to load
            </p>
          </div>
        </div>
      )}

      {/* Xeokit render container */}
      <canvas
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
    </div>
  );
}
