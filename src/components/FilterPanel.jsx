import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import { countActiveFilters } from "../utils/filterClashes";

export default function FilterPanel({
  filters,
  filterOptions,
  testNames,
  totalFiltered,
  totalClashes,
  updateFilter,
  clearFilters,
  relevanceFilter,
  setRelevanceFilter,
}) {
  const activeCount = countActiveFilters(filters);

  const statusOptions = ["active", "reviewed", "approved", "resolved"];
  const severityOptions = ["Critical", "Major", "Minor"];

  const toggleArrayFilter = (key, value) => {
    const current = filters[key] || [];
    if (current.includes(value)) {
      updateFilter(key, current.filter((v) => v !== value));
    } else {
      updateFilter(key, [...current, value]);
    }
  };

  return (
    <div className="w-full lg:w-56 xl:w-64 flex-shrink-0 filter-panel animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: "var(--color-accent)" }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            Filters
          </span>
          {activeCount > 0 && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[0.6rem] font-bold"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button 
            onClick={clearFilters}
            className="text-[0.65rem] font-medium flex items-center gap-1 transition-colors hover:text-slate-700"
            style={{ color: "var(--color-text-dim)" }}
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Result Count */}
      <div
        className="text-xs font-medium mb-4 px-2 py-1.5 rounded"
        style={{
          color: "var(--color-text-secondary)",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
        }}
      >
        Showing <span className="font-bold text-[var(--color-accent)]">{totalFiltered.toLocaleString()}</span> of{" "}
        {totalClashes.toLocaleString()} clashes
      </div>

      {/* Search */}
      <div className="filter-section">
        <label className="filter-label">Search</label>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "var(--color-text-dim)" }}
          />
          <input
            type="text"
            placeholder="Element, ID, grid..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="filter-input pl-8"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter("search", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3 h-3" style={{ color: "var(--color-text-dim)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Relevance Toggle */}


      <div className="filter-section">
        <label className="filter-label">Relevance (Noise Reduction)</label>
        <select
          value={relevanceFilter}
          onChange={(e) => setRelevanceFilter(e.target.value)}
          className="filter-select"
        >
          <option value="relevant">Relevant Clashes Only</option>
          <option value="irrelevant">Filtered (Noise) Only</option>
          <option value="all">Show All Clashes</option>
        </select>
        <p className="text-[0.65rem] text-slate-400 mt-1.5 leading-tight">
          Hides overlaps &lt;5mm, same-discipline touches, and finish vs host elements.
        </p>
      </div>

      {/* Clash Test */}
      <div className="filter-section">
        <label className="filter-label">Clash Test</label>
        <select
          value={filters.clashTest}
          onChange={(e) => updateFilter("clashTest", e.target.value)}
          className="filter-select"
        >
          <option value="all">All Tests</option>
          {testNames.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="filter-section">
        <label className="filter-label">Status</label>
        {statusOptions.map((s) => (
          <label key={s} className="filter-checkbox">
            <input
              type="checkbox"
              checked={(filters.statuses || []).includes(s)}
              onChange={() => toggleArrayFilter("statuses", s)}
            />
            <span className={`badge-status badge-${s}`} style={{ fontSize: "0.65rem" }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          </label>
        ))}
      </div>

      {/* Severity */}
      <div className="filter-section">
        <label className="filter-label">Severity</label>
        {severityOptions.map((s) => (
          <label key={s} className="filter-checkbox">
            <input
              type="checkbox"
              checked={(filters.severities || []).includes(s)}
              onChange={() => toggleArrayFilter("severities", s)}
            />
            <span className={`badge-severity badge-${s.toLowerCase()}`} style={{ fontSize: "0.65rem" }}>
              {s}
            </span>
          </label>
        ))}
      </div>

      {/* Floor */}
      <div className="filter-section">
        <label className="filter-label">Floor</label>
        {filterOptions.floors.map((f) => (
          <label key={f} className="filter-checkbox">
            <input
              type="checkbox"
              checked={(filters.floors || []).includes(f)}
              onChange={() => toggleArrayFilter("floors", f)}
            />
            <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>{f}</span>
          </label>
        ))}
      </div>

      {/* Discipline */}
      <div className="filter-section">
        <label className="filter-label">Discipline</label>
        <select
          value={filters.discipline}
          onChange={(e) => updateFilter("discipline", e.target.value)}
          className="filter-select"
        >
          <option value="all">All Disciplines</option>
          {filterOptions.disciplines.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* IFC Element Type */}
      <div className="filter-section">
        <label className="filter-label">IFC Element Type</label>
        <select
          value={filters.ifcType}
          onChange={(e) => updateFilter("ifcType", e.target.value)}
          className="filter-select"
        >
          <option value="all">All Types</option>
          {filterOptions.ifcTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Grid Zone */}
      {filterOptions.gridZones && filterOptions.gridZones.length > 0 && (
        <div className="filter-section">
          <label className="filter-label">Grid Zone</label>
          <select
            value={filters.gridZone}
            onChange={(e) => updateFilter("gridZone", e.target.value)}
            className="filter-select"
          >
            <option value="all">All Zones</option>
            {filterOptions.gridZones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
      )}

      {/* Distance Range */}
      <div className="filter-section">
        <label className="filter-label">Distance (mm)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.distanceMin || ""}
            onChange={(e) => updateFilter("distanceMin", e.target.value)}
            className="filter-input w-full"
          />
          <span style={{ color: "var(--color-text-dim)" }}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.distanceMax || ""}
            onChange={(e) => updateFilter("distanceMax", e.target.value)}
            className="filter-input w-full"
          />
        </div>
      </div>
    </div>
  );
}
