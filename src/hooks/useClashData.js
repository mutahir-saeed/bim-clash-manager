import { useState, useCallback, useMemo, useEffect } from "react";
import { parseClashXml } from "../utils/parseXml";
import { filterClashes, sortClashes } from "../utils/filterClashes";
import { groupClashes } from "../utils/clashGrouping";
import { applyRelevance } from "../utils/clashRelevance";

const STORAGE_KEY = "clashapp_status_overrides";

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

const DEFAULT_FILTERS = {
  search: "",
  clashTest: "all",
  statuses: [],
  severities: [],
  floors: [],
  discipline: "all",
  ifcType: "all",
  distanceMin: "",
  distanceMax: "",
  gridZone: "all",
};

export function useClashData() {
  const [clashes, setClashes] = useState([]);
  const [projectInfo, setProjectInfo] = useState(null);
  const [testNames, setTestNames] = useState([]);
  const [parseDate, setParseDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const [overrides, setOverrides] = useState(loadOverrides);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState({ column: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [selectedClashId, setSelectedClashId] = useState(null);
  
  const [viewMode, setViewMode] = useState("clashes"); // "clashes" | "groups"
  const [relevanceFilter, setRelevanceFilter] = useState("relevant");
  const [pickedElementId, setPickedElementId] = useState(null); // Clicked 3D element GUID

  const PAGE_SIZE = 25;

  // Apply overrides to clashes
  const clashesWithOverrides = useMemo(() => {
    return clashes.map((c) => {
      const ov = overrides[c.guid];
      if (!ov) return c;
      return {
        ...c,
        userStatus: ov.status || c.status,
        assignedTo: ov.assignedTo || "",
        comment: ov.comment || "",
      };
    });
  }, [clashes, overrides]);

  // Apply relevance classification
  const relevanceResult = useMemo(() => {
    return applyRelevance(clashesWithOverrides);
  }, [clashesWithOverrides]);

  // The base set of clashes for the UI to work with
  const baseClashes = useMemo(() => {
    if (relevanceFilter === "all") return relevanceResult.annotatedClashes;
    if (relevanceFilter === "irrelevant") return relevanceResult.annotatedClashes.filter((c) => c.relevanceStatus === "irrelevant");
    return relevanceResult.annotatedClashes.filter((c) => c.relevanceStatus !== "irrelevant");
  }, [relevanceResult, relevanceFilter]);

  // Compute unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const floors = new Set();
    const ifcTypes = new Set();
    const disciplines = new Set();
    const gridZones = new Set();

    baseClashes.forEach((c) => {
      if (c.floor) floors.add(c.floor);
      if (c.obj1_ifcType) ifcTypes.add(c.obj1_ifcType);
      if (c.obj2_ifcType) ifcTypes.add(c.obj2_ifcType);
      if (c.obj1_discipline) disciplines.add(c.obj1_discipline);
      if (c.obj2_discipline) disciplines.add(c.obj2_discipline);
      if (c.gridRef) gridZones.add(c.gridRef.split("-")[0] || c.gridRef);
    });

    // Sort floors in logical order
    const floorOrder = ["-01 Foundation", "00 Ground floor", "01 First floor", "02 Second floor", "03 Roof"];
    const sortedFloors = [...floors].sort((a, b) => {
      const ai = floorOrder.indexOf(a);
      const bi = floorOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    return {
      floors: sortedFloors,
      ifcTypes: [...ifcTypes].sort(),
      disciplines: [...disciplines].sort(),
      gridZones: [...gridZones].sort(),
    };
  }, [baseClashes]);

  // Apply filters
  const filteredClashes = useMemo(() => {
    let filtered = filterClashes(baseClashes, filters);
    
    // Apply picked element filter (from 3D viewer)
    if (pickedElementId) {
      filtered = filtered.filter(c => 
        c.obj1_elementId === pickedElementId || c.obj2_elementId === pickedElementId
      );
    }
    
    // If we're in 'groups' mode, group them now
    if (viewMode === "groups") {
      filtered = groupClashes(filtered, 0.5); // 500mm radius
    }
    
    return filtered;
  }, [baseClashes, filters, viewMode, pickedElementId]);

  // Apply sorting
  const sortedClashes = useMemo(() => {
    return sortClashes(filteredClashes, sortConfig);
  }, [filteredClashes, sortConfig]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedClashes.length / PAGE_SIZE));
  const paginatedClashes = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedClashes.slice(start, start + PAGE_SIZE);
  }, [sortedClashes, page]);

  // KPI computations
  const kpis = useMemo(() => {
    const total = baseClashes.length;
    const critical = baseClashes.filter((c) => c.severity === "Critical").length;
    const major = baseClashes.filter((c) => c.severity === "Major").length;
    const minor = baseClashes.filter((c) => c.severity === "Minor").length;
    const resolved = baseClashes.filter((c) => (c.userStatus || c.status) === "resolved").length;
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    
    // Calculate total groups
    const allGroups = groupClashes(baseClashes, 0.5);
    const totalGroups = allGroups.filter((g) => g.isGroup).length;

    // Per-test breakdowns
    const byTest = {};
    baseClashes.forEach((c) => {
      if (!byTest[c.clashTestName]) {
        byTest[c.clashTestName] = { total: 0, critical: 0, major: 0, minor: 0, resolved: 0 };
      }
      byTest[c.clashTestName].total++;
      byTest[c.clashTestName][c.severity.toLowerCase()]++;
      if ((c.userStatus || c.status) === "resolved") byTest[c.clashTestName].resolved++;
    });

    return { 
      total, 
      critical, 
      major, 
      minor, 
      resolved, 
      resolutionRate, 
      byTest, 
      totalGroups,
      irrelevantCount: relevanceResult.irrelevantCount,
      noiseReductionPercent: relevanceResult.noiseReductionPercent
    };
  }, [baseClashes, relevanceResult]);

  // Chart data computations
  const chartData = useMemo(() => {
    // By discipline pair
    const byDiscipline = {};
    clashesWithOverrides.forEach((c) => {
      if (!byDiscipline[c.disciplinePair]) {
        byDiscipline[c.disciplinePair] = { name: c.disciplinePair, Critical: 0, Major: 0, Minor: 0 };
      }
      byDiscipline[c.disciplinePair][c.severity]++;
    });

    // By floor
    const floorOrder = ["-01 Foundation", "00 Ground floor", "01 First floor", "02 Second floor", "03 Roof"];
    const byFloor = {};
    clashesWithOverrides.forEach((c) => {
      const f = c.floor || "Unknown";
      if (!byFloor[f]) byFloor[f] = { name: f, Critical: 0, Major: 0, Minor: 0 };
      byFloor[f][c.severity]++;
    });
    const floorData = Object.values(byFloor).sort((a, b) => {
      const ai = floorOrder.indexOf(a.name);
      const bi = floorOrder.indexOf(b.name);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    // By status
    const byStatus = { active: 0, reviewed: 0, approved: 0, resolved: 0 };
    baseClashes.forEach((c) => {
      const s = c.userStatus || c.status;
      if (byStatus[s] !== undefined) byStatus[s]++;
    });
    const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

    // --- New Computations for Phase 2 ---
    
    // 1. Heatmap Data (Floor x GridZone)
    const heatmapMatrix = {};
    baseClashes.forEach(c => {
      const floor = c.floor || "Unknown";
      const gridZone = c.gridRef ? c.gridRef.split("-")[0] : "None";
      if (!heatmapMatrix[floor]) heatmapMatrix[floor] = {};
      if (!heatmapMatrix[floor][gridZone]) heatmapMatrix[floor][gridZone] = 0;
      heatmapMatrix[floor][gridZone]++;
    });
    
    const heatmapData = Object.keys(heatmapMatrix).sort().map(floor => {
      const row = { floor };
      Object.keys(heatmapMatrix[floor]).forEach(gridZone => {
        row[gridZone] = heatmapMatrix[floor][gridZone];
      });
      return row;
    });

    // 2. Top Elements
    const elementsCount = {};
    baseClashes.forEach(c => {
      [
        { name: c.obj1_elementName, id: c.obj1_elementId, severity: c.severity },
        { name: c.obj2_elementName, id: c.obj2_elementId, severity: c.severity }
      ].forEach(el => {
        if (!el.name) return;
        const key = `${el.name} (${el.id})`;
        if (!elementsCount[key]) elementsCount[key] = { count: 0, name: el.name, id: el.id, severities: { Critical: 0, Major: 0, Minor: 0 }};
        elementsCount[key].count++;
        elementsCount[key].severities[el.severity]++;
      });
    });
    const topElements = Object.values(elementsCount)
      .sort((a, b) => b.count - a.count);

    // 3. Priority Matrix (Discipline Pair x Severity)
    const priorityMatrix = {};
    baseClashes.forEach(c => {
      const pair = c.disciplinePair;
      if (!priorityMatrix[pair]) priorityMatrix[pair] = { name: pair, Critical: 0, Major: 0, Minor: 0, total: 0 };
      priorityMatrix[pair][c.severity]++;
      priorityMatrix[pair].total++;
    });
    const priorityMatrixData = Object.values(priorityMatrix).sort((a, b) => b.total - a.total);

    // 4. IFC Type Pairs
    const ifcPairsCount = {};
    baseClashes.forEach(c => {
      // Sort them alphabetically to ensure "IfcBeam vs IfcColumn" is the same as "IfcColumn vs IfcBeam"
      const pair = [c.obj1_ifcType, c.obj2_ifcType].sort().join(" vs ");
      if (!ifcPairsCount[pair]) ifcPairsCount[pair] = { name: pair, Critical: 0, Major: 0, Minor: 0, total: 0 };
      ifcPairsCount[pair][c.severity]++;
      ifcPairsCount[pair].total++;
    });
    const ifcTypePairs = Object.values(ifcPairsCount)
      .sort((a, b) => b.total - a.total);

    // 5. Distance Histogram
    const distanceBuckets = {
      "0-5mm": 0, "5-10mm": 0, "10-20mm": 0, "20-50mm": 0, ">50mm": 0
    };
    baseClashes.forEach(c => {
      const dist = Math.abs(c.distance) * 1000;
      if (dist < 5) distanceBuckets["0-5mm"]++;
      else if (dist < 10) distanceBuckets["5-10mm"]++;
      else if (dist < 20) distanceBuckets["10-20mm"]++;
      else if (dist < 50) distanceBuckets["20-50mm"]++;
      else distanceBuckets[">50mm"]++;
    });
    const distanceDistribution = Object.entries(distanceBuckets).map(([name, value]) => ({ name, value }));

    // 6. Phase Data (mocked based on floors for now)
    const phaseDataMap = {
      "Phase 1 (Substructure)": { name: "Phase 1 (Substructure)", Critical: 0, Major: 0, Minor: 0, total: 0 },
      "Phase 2 (Superstructure)": { name: "Phase 2 (Superstructure)", Critical: 0, Major: 0, Minor: 0, total: 0 },
      "Phase 3 (Enclosure)": { name: "Phase 3 (Enclosure)", Critical: 0, Major: 0, Minor: 0, total: 0 },
      "Phase 4 (Finishes)": { name: "Phase 4 (Finishes)", Critical: 0, Major: 0, Minor: 0, total: 0 },
    };
    baseClashes.forEach(c => {
      let phase = "Phase 2 (Superstructure)";
      if (c.floor === "-01 Foundation") phase = "Phase 1 (Substructure)";
      else if (c.floor === "03 Roof") phase = "Phase 3 (Enclosure)";
      else if (c.obj1_ifcType === "IfcCovering" || c.obj2_ifcType === "IfcCovering") phase = "Phase 4 (Finishes)";
      
      phaseDataMap[phase][c.severity]++;
      phaseDataMap[phase].total++;
    });
    const phaseData = Object.values(phaseDataMap);

    return {
      disciplineData: Object.values(byDiscipline),
      floorData,
      statusData,
      heatmapData,
      topElements,
      priorityMatrix: priorityMatrixData,
      ifcTypePairs,
      distanceDistribution,
      phaseData
    };
  }, [baseClashes]);

  // Selected clash object
  const selectedClash = useMemo(() => {
    if (!selectedClashId) return null;
    return clashesWithOverrides.find((c) => c.id === selectedClashId) || null;
  }, [selectedClashId, clashesWithOverrides]);

  // Find index in sorted/filtered list for prev/next
  const selectedIndexInFiltered = useMemo(() => {
    if (!selectedClashId) return -1;
    return sortedClashes.findIndex((c) => c.id === selectedClashId);
  }, [selectedClashId, sortedClashes]);

  // Parse XML string
  const loadXml = useCallback(async (xmlString) => {
    setLoading(true);
    setError(null);
    try {
      setIsDemo(false);
      // Use setTimeout to allow UI to update with loading state
      await new Promise((r) => setTimeout(r, 50));
      const result = parseClashXml(xmlString);
      setClashes(result.clashes);
      setProjectInfo(result.projectInfo);
      setTestNames(result.testNames);
      setParseDate(result.parseDate);
      setPage(1);
      setSelectedClashId(null);
      setPickedElementId(null);
      setFilters(DEFAULT_FILTERS);
      setSortConfig({ column: null, direction: "asc" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load demo data
  const loadDemoData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/sample-clash.xml");
      if (!response.ok) throw new Error("Failed to load demo data");
      const text = await response.text();
      await loadXml(text);
      setIsDemo(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [loadXml]);

  // Update a clash's override (status, assignedTo, comment)
  const updateClash = useCallback(
    (guid, updates) => {
      setOverrides((prev) => {
        const newOverrides = {
          ...prev,
          [guid]: { ...(prev[guid] || {}), ...updates },
        };
        saveOverrides(newOverrides);
        return newOverrides;
      });
    },
    []
  );

  // Toggle sort column
  const toggleSort = useCallback(
    (column) => {
      setSortConfig((prev) => {
        if (prev.column === column) {
          return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
        }
        return { column, direction: "asc" };
      });
      setPage(1);
    },
    []
  );

  // Update filter and reset page
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // Navigate to previous/next clash in filtered list
  const goToPrevClash = useCallback(() => {
    if (selectedIndexInFiltered > 0) {
      setSelectedClashId(sortedClashes[selectedIndexInFiltered - 1].id);
    }
  }, [selectedIndexInFiltered, sortedClashes]);

  const goToNextClash = useCallback(() => {
    if (selectedIndexInFiltered < sortedClashes.length - 1) {
      setSelectedClashId(sortedClashes[selectedIndexInFiltered + 1].id);
    }
  }, [selectedIndexInFiltered, sortedClashes]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  return {
    // Data
    clashes: clashesWithOverrides,
    projectInfo,
    testNames,
    parseDate,
    loading,
    error,
    isDemo,

    // Filtered / sorted / paginated
    filteredClashes,
    sortedClashes,
    paginatedClashes,
    totalFiltered: sortedClashes.length,
    totalClashes: clashesWithOverrides.length,

    // KPIs and charts
    kpis,
    chartData,
    
    updateClash,
    viewMode,
    setViewMode,
    relevanceFilter,
    setRelevanceFilter,
    pickedElementId,
    setPickedElementId,

    // Pagination
    page,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,

    // Selection
    selectedClash,
    selectedClashId,
    setSelectedClashId,
    selectedIndexInFiltered,
    goToPrevClash,
    goToNextClash,

    // Filters
    filters,
    filterOptions,
    updateFilter,
    clearFilters,

    // Sorting
    sortConfig,
    toggleSort,

    // Actions
    loadXml,
    loadDemoData,
    updateClash,
  };
}
