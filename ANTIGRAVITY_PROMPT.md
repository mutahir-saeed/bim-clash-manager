# BIM Clash Manager — Feature Expansion & Theme Overhaul

## Project Context

This is a React 19 + Vite 8 BIM clash detection dashboard that parses Navisworks XML clash reports, displays clashes in a filterable/sortable table, shows KPI cards + Recharts charts, and renders IFC models in a 3D viewer (xeokit + web-ifc). It uses Tailwind CSS v4 with CSS custom properties defined in `src/index.css`.

**Tech stack:** React 19, Vite 8, Recharts 3, Tailwind CSS 4, lucide-react, fast-xml-parser, xeokit-sdk, web-ifc, Radix UI primitives.

**Current file structure:**
```
src/
├── App.jsx                    # Main layout: Header → KpiCards → ChartsSection → FilterPanel + ClashTable + IfcViewer → ClashDetailPanel → Footer
├── main.jsx
├── index.css                  # Full design system (CSS vars, all component styles)
├── components/
│   ├── Header.jsx             # Logo, project info, Upload XML, Export CSV, How to Use
│   ├── KpiCards.jsx            # 5 cards: Total, Critical, Major, Minor, Resolution Rate
│   ├── ChartsSection.jsx       # 3 charts: Discipline Pair bar, Floor Level bar, Status donut
│   ├── FilterPanel.jsx         # Search, Clash Test, Status, Severity, Floor, Discipline, IFC Type
│   ├── ClashTable.jsx          # Sortable/paginated table (25 per page) with status dropdown
│   ├── ClashDetailPanel.jsx    # Slide-in panel: clash info, object sections, assigned to, comments
│   ├── IfcViewer.jsx           # 3D viewer: toolbar (Solid/X-Ray/Wireframe, ARC/STR/MEP toggle, section plane, fullscreen)
│   └── UploadZone.jsx          # Drag-and-drop XML upload + demo data loader
├── hooks/
│   ├── useClashData.js         # Central state: parsing, filtering, sorting, pagination, KPIs, chart data, overrides (localStorage)
│   └── useIfcScene.js          # xeokit/web-ifc 3D scene management
├── config/
│   └── viewer.js               # Discipline colors for 3D viewer
├── utils/
│   ├── parseXml.js             # Navisworks XML → structured clash objects (getSeverity by distance, getDiscipline from filename)
│   ├── filterClashes.js        # Filter + sort logic
│   ├── exportCsv.js            # CSV export
│   ├── fragmentCache.js        # IFC fragment caching
│   └── ifcElementMap.js        # IFC element ID mapping
└── lib/
    └── utils.js                # cn() utility
```

**Current data shape per clash (from `parseXml.js`):**
```js
{
  id, displayId, guid, status, distance, severity, // severity = "Critical" (>50mm) | "Major" (10-50mm) | "Minor" (<10mm)
  clashTestName, clashTestIndex, disciplinePair, floor, gridRef,
  x, y, z, createdDate,
  obj1_elementId, obj1_file, obj1_discipline, obj1_ifcType, obj1_elementName, obj1_floor,
  obj2_elementId, obj2_file, obj2_discipline, obj2_ifcType, obj2_elementName, obj2_floor,
  assignedTo, comment, userStatus
}
```

---

## TASK 1: Light Theme Overhaul

**Goal:** Switch from the current dark theme to a bright, professional BIM-industry theme.

**Changes in `src/index.css`** — update all CSS custom properties in the `@theme` block:

```
Background:        #0f1117 → #f0f4f8 (light gray-blue)
Card background:   #1a1d27 → #ffffff
Elevated bg:       #22253a → #ffffff
Border:            #2a2d3a → #e2e8f0
Border hover:      #3a3d4a → #cbd5e1
Accent:            #4f9ef8 → #2563eb (stronger blue)
Accent hover:      #6bb0ff → #1d4ed8

Text primary:      #f1f5f9 → #0f172a (near-black)
Text secondary:    #cbd5e1 → #334155
Text muted:        #94a3b8 → #64748b
Text dim:          #64748b → #94a3b8

Keep discipline colors: ARC #3b82f6, STR #f59e0b, MEP #10b981
Keep severity colors: Critical #dc2626 (was #ef4444, make slightly deeper), Major #f97316, Minor #eab308
Resolved:          #22c55e → #16a34a
```

**Header:** Change from dark gradient to `linear-gradient(135deg, #1e3a5f, #2563eb)` with white text.

**Glass card:** Remove backdrop-filter/blur. Use `background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.06);` instead.

**KPI cards:** Add `border-left: 3px solid [severity-color]` instead of the top `::before` stripe. White background.

**Chart containers:** White background, subtle shadow, no gradient.

**Table:** White background, `#e2e8f0` borders, hover row `#eff6ff`.

**Severity badges:** Use softer light backgrounds: Critical `bg: #fef2f2, color: #dc2626, border: #fecaca`. Major `bg: #fff7ed, color: #ea580c, border: #fed7aa`. Minor `bg: #fefce8, color: #ca8a04, border: #fef08a`.

**Status badges:** Active `bg: #eff6ff, color: #2563eb, border: #bfdbfe`. Reviewed `bg: #f5f3ff, color: #7c3aed`. Approved `bg: #f0fdf4, color: #16a34a`. Resolved `bg: #f9fafb, color: #6b7280`.

**Scrollbar:** Light track `#f0f4f8`, thumb `#cbd5e1`.

**Footer:** `background: white; border-top: 1px solid #e2e8f0;`

**Detail panel:** White background, light border.

**3D Viewer container:** `background: #e8ecf1` (slightly darker than page). Toolbar buttons: white bg, `#e2e8f0` border, `#475569` text.

**Filter panel:** White bg, light borders, inputs with `#f1f5f9` background.

Make sure ALL hardcoded rgba colors throughout components are updated to match the light theme. Search for `rgba(` in all JSX files and update accordingly.

---

## TASK 2: Smart Clash Grouping

**Goal:** Group related clashes into clusters by proximity + shared elements + same floor/grid zone, and provide a toggle to switch between "All Clashes" view and "Groups" view.

**Implementation:**

1. **New utility: `src/utils/clashGrouping.js`**
   - Function `groupClashes(clashes, options = { proximityThreshold: 0.5 })`:
     - Group clashes that share the same `floor` + `gridRef` AND have at least one common element (`obj1_elementId` or `obj2_elementId` match between clashes)
     - Secondary grouping: clashes on the same floor within `proximityThreshold` meters (use Euclidean distance from x,y,z)
     - Each group gets: `groupId`, `clashes[]`, `memberCount`, `worstSeverity`, `dominantDisciplinePair`, `floor`, `gridRef`, `primaryElements[]` (most frequently appearing elements), `centroid` (avg x,y,z)
   - Function `getGroupSummary(group)` → returns a human-readable summary string like "STR-MEP: Column 300×300 vs Foundation beam, L2 Grid D-8 (12 clashes)"

2. **Integrate into `useClashData.js`:**
   - Add state: `const [viewMode, setViewMode] = useState("clashes")` // "clashes" | "groups"
   - Compute `clashGroups` with useMemo from `clashesWithOverrides`
   - Expose `clashGroups`, `viewMode`, `setViewMode`, `totalGroups` in the return

3. **UI: Add toggle in the area between KpiCards and ChartsSection (or in the Header actions area):**
   - Two-button segmented control: "All Clashes (1,467)" | "Groups (~103)"
   - When "Groups" is active, the ClashTable should show group rows instead of individual clashes
   - Each group row is expandable (click to show member clashes)

4. **New KPI card (6th card):** "Clash Clusters" showing `totalGroups` count, with detail text "Grouped by proximity + shared elements". Use purple accent color `#7c3aed`.

---

## TASK 3: False Positive / Irrelevant Clash Filtering

**Goal:** Auto-flag clashes that are likely irrelevant based on configurable rules, and show a "noise reduction" metric.

**Implementation:**

1. **New utility: `src/utils/clashRelevance.js`**
   - Function `classifyRelevance(clash, rules)` → returns `"relevant"` | `"irrelevant"` | `"review"`
   - Default rules:
     - Distance < 5mm (configurable threshold) → `"irrelevant"` (tolerance clash)
     - Both elements are non-structural finishing (IfcCovering, IfcFurnishingElement) → `"irrelevant"`
     - Same discipline pair (ARC-ARC) and < 10mm → `"irrelevant"`
     - IfcCovering vs IfcWall → `"irrelevant"` (insulation touching wall)
   - Function `applyRelevanceFilter(clashes, rules)` → returns `{ relevant[], irrelevant[], reviewNeeded[] }`

2. **Integrate into `useClashData.js`:**
   - Add state: `const [showIrrelevant, setShowIrrelevant] = useState(false)`
   - Compute relevance classification on all clashes
   - Add to KPIs: `irrelevantCount`, `noiseReductionPercent`
   - When `showIrrelevant` is false, exclude irrelevant clashes from `filteredClashes`

3. **UI in FilterPanel:** Add a "Relevance" section at the top with:
   - Toggle: "Hide irrelevant clashes" (on by default)
   - Info text: "Filtered 312 irrelevant clashes (21%) — 1,155 actionable remain"
   - Link/button: "Configure rules..." (opens a small config modal)

4. **In ClashTable:** If `showIrrelevant` is on, irrelevant clashes get a muted/grayed-out row style and a small "Irrelevant" tag.

---

## TASK 4: Smart Insights Banner

**Goal:** Auto-generated actionable insight panel below the KPI cards.

**Implementation:**

1. **New component: `src/components/InsightsBanner.jsx`**
   - Takes `clashes`, `kpis`, `chartData` as props
   - Computes insights using these rules (pick the top 1-2 most impactful):
     - **Floor concentration:** Which floor has the highest % of critical clashes? → "Focus Area: 02 Second Floor has 42% of critical clashes (194 items)"
     - **Worst element:** Which `obj1_elementName` or `obj2_elementName` appears most frequently? → "Column profile 300×300 is involved in 89 clashes"
     - **Reduction potential:** "Resolving the top 3 elements would eliminate ~210 clashes (14%)"
     - **Grid hotspot:** Which `gridRef` has the most clashes? → "Grid D-8 is a hotspot with 67 clashes"
     - **Discipline imbalance:** "ARC-MEP clashes outnumber all others by 2.4x — consider MEP routing review"
   - Renders as a horizontal banner with a lightbulb icon, insight text, and a subtle gradient background (`linear-gradient(90deg, #eff6ff, #fef3c7)`)

2. **Add to `App.jsx`** between `<KpiCards>` and `<ChartsSection>`.

---

## TASK 5: Floor × Grid Heatmap Chart

**Goal:** Replace one of the existing bar charts (or add as 4th chart) with an interactive heatmap showing clash density by floor (Y-axis) vs grid zone (X-axis).

**Implementation:**

1. **Compute heatmap data in `useClashData.js`:**
   - Extract unique grid zones (take first character(s) of `gridRef`, e.g., "D-8" → zone "D")
   - Build a 2D matrix: `floors × gridZones → count` with severity breakdown
   - Add `heatmapData` to `chartData`

2. **New component or addition to `ChartsSection.jsx`:**
   - Render as a CSS grid (not Recharts — Recharts doesn't do heatmaps well)
   - Each cell shows the clash count, colored by intensity:
     - 0-5: `#f0fdf4` (light green)
     - 6-15: `#fefce8` / `#fff7ed` (yellow/orange tint)
     - 16-30: `#fef2f2` (light red)
     - 30+: `#dc2626` with white text (deep red)
   - Floors on Y-axis (Foundation at bottom, Roof at top)
   - Grid zones on X-axis
   - **Interactive:** Clicking a cell filters the ClashTable to that floor + grid zone combination. This requires lifting a callback to `App.jsx` that calls `updateFilter`.

3. **Update charts grid** from `grid-cols-3` to `grid-cols-4` to fit 4 charts.

---

## TASK 6: Top Clashing Elements / Worst Offenders

**Goal:** A ranked horizontal bar chart showing which specific elements generate the most clashes.

**Implementation:**

1. **Compute in `useClashData.js`:**
   - Count occurrences of each `obj1_elementName` and `obj2_elementName` across all clashes
   - Merge counts (same element appearing as obj1 or obj2)
   - Sort descending, take top 8
   - For each: calculate what % of total clashes it's involved in
   - Add Pareto analysis: "Fixing top 5 elements resolves X% of clashes"
   - Add to `chartData` as `topElements`

2. **Render in ChartsSection** as a horizontal bar chart:
   - Element name on the left, bar extending right, count on the right
   - Bar color based on the dominant severity of clashes involving that element
   - Below the chart: Pareto insight text, e.g., "Top 5 elements account for 34% of all clashes"

---

## TASK 7: Priority Matrix (Severity × Discipline Pair)

**Goal:** A grid showing clash counts at the intersection of severity levels and discipline pairs.

**Implementation:**

1. **Compute in `useClashData.js`:**
   - Cross-tabulate: `disciplinePair` (rows) × `severity` (columns) → count
   - Add to `chartData` as `priorityMatrix`

2. **New section in the dashboard** — add a bottom analytics row below the main content area (table + viewer) in `App.jsx`:
   - Render as a styled HTML table/grid (not Recharts)
   - Rows: ARC-STR, ARC-MEP, STR-MEP
   - Columns: Critical, Major, Minor
   - Cell background color intensity based on count (same color scale as heatmap)
   - Cell shows the number in bold

---

## TASK 8: IFC Type Clash Matrix

**Goal:** Show which IFC types clash with which most frequently.

**Implementation:**

1. **Compute in `useClashData.js`:**
   - For each clash, create a pair key: `[obj1_ifcType, obj2_ifcType].sort().join(" vs ")`
   - Count occurrences, sort descending, take top 8
   - Add to `chartData` as `ifcTypePairs`

2. **Render in the bottom analytics row** next to the Priority Matrix:
   - Simple ranked list: "IfcBeam vs IfcColumn — 234" with count colored by severity threshold
   - Each row has: pair name (left), count (right, colored)

---

## TASK 9: Distance Distribution Histogram

**Goal:** Show the distribution of penetration distances across all clashes.

**Implementation:**

1. **Compute in `useClashData.js`:**
   - Bucket clashes by distance ranges: 0-5mm, 5-10mm, 10-25mm, 25-50mm, 50-100mm, 100-200mm, 200mm+
   - Count per bucket
   - Add to `chartData` as `distanceDistribution`

2. **Render as a Recharts `BarChart`** — either add as a 5th chart in the charts row, or place it in the bottom analytics row:
   - X-axis: distance ranges
   - Y-axis: count
   - Bar color: green for low ranges, yellow for medium, red for high
   - Add vertical reference lines at 10mm (Minor threshold) and 50mm (Critical threshold) with labels

---

## TASK 10: Construction Phase / Sequence View

**Goal:** Map clashes to construction phases and show which must be resolved before each phase.

**Implementation:**

1. **New utility or logic in `useClashData.js`:**
   - Map floors to phases:
     - Foundation floor → "Phase 1: Foundation"
     - Ground floor → "Phase 2: Substructure"
     - First/Second floor → "Phase 3: Superstructure"
     - Roof → "Phase 4: Envelope"
   - Map element types to phases:
     - IfcFooting, IfcPile → Foundation
     - IfcColumn, IfcBeam, IfcSlab → Structure
     - IfcWall, IfcRoof, IfcWindow → Envelope
     - IfcFlowSegment, IfcFlowTerminal → MEP/Finishing
   - Count clashes per phase, with severity breakdown
   - Add to `chartData` as `phaseData`

2. **Render in the bottom analytics row** as a horizontal timeline / progress bar:
   - 4-5 phase blocks left to right
   - Each block shows: phase name, clash count, severity breakdown (small stacked bar or color dots)
   - Highlight the phase with the most critical clashes
   - Label: "Resolve before construction begins"

---

## TASK 11: Distance Range Filter + Grid Zone Filter

**Goal:** Add two new filters to `FilterPanel.jsx`.

**Implementation:**

1. **Distance Range Filter:**
   - Add to `DEFAULT_FILTERS` in `useClashData.js`: `distanceMin: 0, distanceMax: Infinity`
   - Two number inputs (min/max in mm) or a dual-range slider
   - Update `filterClashes` in `filterClashes.js` to filter by `Math.abs(clash.distance) * 1000` within range
   - Label: "Distance Range (mm)"

2. **Grid Zone Filter:**
   - Add to `DEFAULT_FILTERS`: `gridZone: "all"`
   - Compute unique grid zones from `filterOptions` (extract from `gridRef`)
   - Add a `<select>` dropdown in FilterPanel
   - Update `filterClashes` to match `clash.gridRef.startsWith(selectedZone)`

---

## TASK 12: BCF Export

**Goal:** Export clashes as a `.bcfzip` file (BIM Collaboration Format) that can be imported into Revit, Navisworks, Solibri, BIMcollab.

**Implementation:**

1. **New utility: `src/utils/exportBcf.js`**
   - BCF is a ZIP file containing XML files. Use JSZip (add as dependency: `npm install jszip`).
   - Structure per BCF 2.1 spec:
     ```
     bcf.version          → XML declaring BCF version 2.1
     {topic-guid}/
       markup.bcf         → XML with topic title, description, status, priority, assigned_to, creation_date
       viewpoint.bcfv     → XML with camera position (use clash x,y,z as target, offset camera)
       snapshot.png        → Optional (can skip or generate a placeholder)
     ```
   - For each clash (or clash group):
     - Topic GUID = `clash.guid`
     - Title = `clash.displayId + ": " + clash.obj1_discipline + " vs " + clash.obj2_discipline`
     - Description = element names, distance, floor, grid ref
     - Status = clash.userStatus (map to BCF statuses: "Active", "Resolved", etc.)
     - Priority = clash.severity
     - AssignedTo = clash.assignedTo
     - Viewpoint: camera position derived from clash x,y,z
     - Referenced components: `clash.obj1_elementId`, `clash.obj2_elementId` as IFC GUIDs

2. **Add BCF export button** in `Header.jsx` next to the CSV export button.

3. **Trigger download** of the generated `.bcfzip` file.

---

## TASK 13: PDF Report Generation

**Goal:** Generate a professional clash report PDF with charts and summary.

**Implementation:**

1. **Use jsPDF + html2canvas** (add dependencies: `npm install jspdf html2canvas`).

2. **New utility: `src/utils/exportPdf.js`**
   - Function `generateClashReport(kpis, chartData, clashes, projectInfo)`
   - Pages:
     - **Page 1: Cover** — "BIM Clash Detection Report", project name, site address, date, total clashes
     - **Page 2: Executive Summary** — KPI numbers, resolution rate, key insights (reuse InsightsBanner logic)
     - **Page 3: Charts** — capture the ChartsSection DOM element with html2canvas, embed as image
     - **Page 4+: Clash Table** — top 50 clashes (or filtered set) as a formatted table
   - Header on each page: project name + date
   - Footer: page numbers

3. **Add "PDF Report" button** in `Header.jsx`.

---

## TASK 14: Bottom Analytics Row Layout

**Goal:** Add a new row below the main content area (filter + table + viewer) to hold the Priority Matrix, IFC Type Matrix, Distance Histogram, and Construction Phase View.

**Implementation in `App.jsx`:**
- Add a new `<div>` section between the main content area and the footer
- Grid layout: `grid-cols-2 lg:grid-cols-4` with gap
- Contains: Priority Matrix, IFC Type Clash Matrix, Distance Distribution, Construction Phase
- Each in a white card with the same styling as chart containers
- Title label with "chart-title" class

---

## General Guidelines

- **Keep existing functionality working.** All current features (XML upload, demo data, 3D viewer, filtering, sorting, pagination, CSV export, detail panel, status management, localStorage overrides) must continue to work.
- **All new computed data** should be added to `useClashData.js` as `useMemo` computations and exposed in the return object.
- **All new chart data** should be added to the `chartData` useMemo block.
- **Maintain component separation.** Each new visual section should be its own component file.
- **Use existing patterns.** Follow the same CSS class naming, Recharts usage patterns, and lucide-react icon usage.
- **Performance:** Use `useMemo` for all derived data. The dataset can have 20,000+ clashes.
- **Responsive:** Ensure the bottom analytics row stacks properly on smaller screens.

## Implementation Order (suggested)

1. Theme overhaul (index.css + update all hardcoded colors in JSX files)
2. New computations in useClashData.js (grouping, relevance, heatmap, top elements, priority matrix, IFC pairs, distance distribution, phase data, new filters)
3. New utility files (clashGrouping.js, clashRelevance.js, exportBcf.js, exportPdf.js)
4. New components (InsightsBanner.jsx)
5. Update existing components (KpiCards → 6 cards, ChartsSection → 4 charts, FilterPanel → new filters, Header → new export buttons)
6. Add bottom analytics row to App.jsx
7. Implement BCF + PDF export
8. Test everything with the existing demo XML data
