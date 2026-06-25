// ═══════════════════════════════════════════════════════════
//  IFC 3D Viewer Configuration
// Native Three.js / xeokit settings
// ═══════════════════════════════════════════════════════════

// WASM path — where web-ifc.wasm is served from (copied by postinstall)
export const WASM_PATH = "/wasm/";

// Discipline color mapping
export const DISCIPLINE_COLORS = {
  ARC: { hex: "#3b82f6", name: "Architecture", label: "ARC" },
  STR: { hex: "#f59e0b", name: "Structure", label: "STR" },
  MEP: { hex: "#10b981", name: "MEP Systems", label: "MEP" },
};

// Status color mapping
export const STATUS_COLORS = {
  active: { hex: "#4f9ef8", bg: "bg-blue-500/20", text: "text-blue-400", label: "Active" },
  reviewed: { hex: "#a855f7", bg: "bg-purple-500/20", text: "text-purple-400", label: "Reviewed" },
  approved: { hex: "#22c55e", bg: "bg-green-500/20", text: "text-green-400", label: "Approved" },
  resolved: { hex: "#6b7280", bg: "bg-gray-500/20", text: "text-gray-400", label: "Resolved" },
};

// Severity color mapping
export const SEVERITY_COLORS = {
  Critical: { hex: "#ef4444", bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50" },
  Major: { hex: "#f97316", bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/50" },
  Minor: { hex: "#eab308", bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/50" },
};

// 3D Viewer defaults
export const VIEWER_DEFAULTS = {
  // Default camera position for full-model overview
  cameraPosition: { x: 25, y: 25, z: 25 },
  cameraTarget: { x: 0, y: 0, z: 0 },

  // Highlight colors (Three.js Color hex)
  highlightColor: 0x4f9ef8,       // Blue — selected element
  clashHighlightA: 0x3b82f6,      // Blue — first clash object
  clashHighlightB: 0xf59e0b,      // Amber — second clash object
  ghostOpacity: 0.08,             // Opacity for non-isolated elements

  // Clash zoom offset — how far the camera sits from the clash point
  clashZoomOffset: 6,

  // Section plane
  clipPlaneColor: 0x4f9ef8,
};

// ═══════════════════════════════════════════════════════════
//  IFC CLASS COLOR PALETTE
//  Curated colors for colorizing by IFC type
// ═══════════════════════════════════════════════════════════
export const IFC_CLASS_COLORS = {
  // Structural
  IfcBeam:             [0.96, 0.26, 0.21],  // Red
  IfcColumn:           [0.91, 0.12, 0.39],  // Pink
  IfcSlab:             [0.61, 0.15, 0.69],  // Purple
  IfcFooting:          [0.40, 0.23, 0.72],  // Deep Purple
  IfcPile:             [0.35, 0.20, 0.60],  // Violet
  IfcPlate:            [0.80, 0.25, 0.33],  // Crimson
  IfcMember:           [0.55, 0.17, 0.52],  // Magenta

  // Walls & Envelope
  IfcWall:             [0.13, 0.59, 0.95],  // Blue
  IfcWallStandardCase: [0.13, 0.59, 0.95],  // Blue
  IfcCurtainWall:      [0.00, 0.74, 0.83],  // Cyan
  IfcCovering:         [0.00, 0.59, 0.53],  // Teal
  IfcRoof:             [0.18, 0.49, 0.20],  // Green

  // Openings & Circulation
  IfcWindow:           [0.25, 0.32, 0.71],  // Indigo
  IfcDoor:             [0.47, 0.33, 0.28],  // Brown
  IfcStairFlight:      [1.00, 0.60, 0.00],  // Orange
  IfcStair:            [1.00, 0.60, 0.00],  // Orange
  IfcRailing:          [0.62, 0.62, 0.62],  // Grey
  IfcRamp:             [0.85, 0.53, 0.10],  // Amber

  // MEP
  IfcFlowSegment:      [0.30, 0.69, 0.31],  // Green
  IfcFlowTerminal:     [0.55, 0.76, 0.29],  // Light Green
  IfcFlowFitting:      [0.80, 0.86, 0.22],  // Lime
  IfcPipeSegment:      [0.00, 0.74, 0.83],  // Cyan
  IfcDuctSegment:      [0.00, 0.59, 0.53],  // Teal
  IfcDistributionElement: [0.40, 0.73, 0.42], // Med Green

  // Spaces & Other
  IfcSpace:            [0.74, 0.76, 0.78],  // Light Grey
  IfcBuildingElementProxy: [0.62, 0.62, 0.62], // Grey
  IfcFurnishingElement: [0.55, 0.43, 0.33], // Warm Brown
  IfcOpeningElement:    [0.88, 0.88, 0.88],  // Very Light Grey
};

// ═══════════════════════════════════════════════════════════
//  CATEGORY GROUPS
//  Predefined groupings of IFC types for "By Category" mode
// ═══════════════════════════════════════════════════════════
export const CATEGORY_GROUPS = {
  "Structural": {
    color: [0.96, 0.26, 0.21],
    types: ["IfcBeam", "IfcColumn", "IfcSlab", "IfcFooting", "IfcPile", "IfcPlate", "IfcMember", "IfcReinforcingBar", "IfcReinforcingMesh", "IfcTendon"],
  },
  "Building Envelope": {
    color: [0.13, 0.59, 0.95],
    types: ["IfcWall", "IfcWallStandardCase", "IfcCurtainWall", "IfcCovering", "IfcRoof"],
  },
  "Openings & Circulation": {
    color: [1.00, 0.60, 0.00],
    types: ["IfcWindow", "IfcDoor", "IfcStairFlight", "IfcStair", "IfcRailing", "IfcRamp", "IfcOpeningElement"],
  },
  "MEP Systems": {
    color: [0.30, 0.69, 0.31],
    types: ["IfcFlowSegment", "IfcFlowTerminal", "IfcFlowFitting", "IfcPipeSegment", "IfcDuctSegment", "IfcDistributionElement", "IfcFlowController", "IfcFlowMovingDevice", "IfcFlowStorageDevice", "IfcFlowTreatmentDevice", "IfcEnergyConversionDevice"],
  },
  "Furnishing": {
    color: [0.55, 0.43, 0.33],
    types: ["IfcFurnishingElement", "IfcFurniture"],
  },
  "Spaces": {
    color: [0.74, 0.76, 0.78],
    types: ["IfcSpace", "IfcZone"],
  },
};

// Auto-color palette for unknown IFC types (cycles through these)
export const AUTO_COLOR_PALETTE = [
  [0.96, 0.26, 0.21],  // Red
  [0.13, 0.59, 0.95],  // Blue
  [0.30, 0.69, 0.31],  // Green
  [1.00, 0.60, 0.00],  // Orange
  [0.61, 0.15, 0.69],  // Purple
  [0.00, 0.74, 0.83],  // Cyan
  [0.91, 0.12, 0.39],  // Pink
  [0.55, 0.76, 0.29],  // Light Green
  [0.47, 0.33, 0.28],  // Brown
  [0.40, 0.23, 0.72],  // Deep Purple
  [0.00, 0.59, 0.53],  // Teal
  [0.80, 0.86, 0.22],  // Lime
  [0.85, 0.53, 0.10],  // Amber
  [0.25, 0.32, 0.71],  // Indigo
  [0.62, 0.62, 0.62],  // Grey
];
