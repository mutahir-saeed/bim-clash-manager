/**
 * Filter clashes based on the current filter state.
 * All filters use AND logic — a clash must match ALL active filters.
 */
export function filterClashes(clashes, filters) {
  return clashes.filter((clash) => {
    // Text search — match against element names, IDs, grid location
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchFields = [
        clash.displayId,
        clash.obj1_elementName,
        clash.obj2_elementName,
        clash.obj1_elementId,
        clash.obj2_elementId,
        clash.gridRef,
        clash.floor,
        clash.obj1_ifcType,
        clash.obj2_ifcType,
        clash.guid,
      ].map((f) => (f || "").toLowerCase());

      if (!searchFields.some((f) => f.includes(q))) return false;
    }

    // Clash test filter
    if (filters.clashTest && filters.clashTest !== "all") {
      if (String(clash.clashTestIndex) !== String(filters.clashTest)) return false;
    }

    // Status multi-select
    if (filters.statuses && filters.statuses.length > 0) {
      if (!filters.statuses.includes(clash.userStatus || clash.status)) return false;
    }

    // Severity multi-select
    if (filters.severities && filters.severities.length > 0) {
      if (!filters.severities.includes(clash.severity)) return false;
    }

    // Floor multi-select
    if (filters.floors && filters.floors.length > 0) {
      if (!filters.floors.includes(clash.floor)) return false;
    }

    // Discipline filter
    if (filters.discipline && filters.discipline !== "all") {
      if (
        clash.obj1_discipline !== filters.discipline &&
        clash.obj2_discipline !== filters.discipline
      )
        return false;
    }

    // IFC Element Type
    if (filters.ifcType && filters.ifcType !== "all") {
      if (clash.obj1_ifcType !== filters.ifcType && clash.obj2_ifcType !== filters.ifcType)
        return false;
    }

    // Distance Min/Max
    const distMm = Math.abs(clash.distance) * 1000;
    if (filters.distanceMin && distMm < Number(filters.distanceMin)) return false;
    if (filters.distanceMax && distMm > Number(filters.distanceMax)) return false;

    // Grid Zone
    if (filters.gridZone && filters.gridZone !== "all") {
      const zone = clash.gridRef ? clash.gridRef.split("-")[0] : "None";
      if (zone !== filters.gridZone) return false;
    }

    return true;
  });
}

/**
 * Sort clashes by the given column and direction
 */
export function sortClashes(clashes, sortConfig) {
  if (!sortConfig || !sortConfig.column) return clashes;

  const { column, direction } = sortConfig;
  const multiplier = direction === "asc" ? 1 : -1;

  return [...clashes].sort((a, b) => {
    let aVal, bVal;

    switch (column) {
      case "id":
        // Extract numeric part for natural sorting
        aVal = parseInt(a.displayId.replace(/\D/g, "")) || 0;
        bVal = parseInt(b.displayId.replace(/\D/g, "")) || 0;
        break;
      case "distance":
        aVal = Math.abs(a.distance);
        bVal = Math.abs(b.distance);
        break;
      case "floor":
        aVal = a.floor || "";
        bVal = b.floor || "";
        return multiplier * aVal.localeCompare(bVal);
      case "status":
        aVal = a.userStatus || a.status;
        bVal = b.userStatus || b.status;
        return multiplier * aVal.localeCompare(bVal);
      case "severity": {
        const order = { Critical: 3, Major: 2, Minor: 1 };
        aVal = order[a.severity] || 0;
        bVal = order[b.severity] || 0;
        break;
      }
      default:
        return 0;
    }

    if (aVal < bVal) return -1 * multiplier;
    if (aVal > bVal) return 1 * multiplier;
    return 0;
  });
}

/**
 * Count active filters for badge display
 */
export function countActiveFilters(filters) {
  let count = 0;
  if (filters.search) count++;
  if (filters.clashTest && filters.clashTest !== "all") count++;
  if (filters.statuses?.length > 0) count++;
  if (filters.severities?.length > 0) count++;
  if (filters.floors?.length > 0) count++;
  if (filters.discipline && filters.discipline !== "all") count++;
  if (filters.ifcType && filters.ifcType !== "all") count++;
  if (filters.distanceMin) count++;
  if (filters.distanceMax) count++;
  if (filters.gridZone && filters.gridZone !== "all") count++;
  return count;
}
