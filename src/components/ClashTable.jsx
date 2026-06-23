import {
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Layers,
  Wrench,
  Users
} from "lucide-react";
import { getGroupSummary } from "../utils/clashGrouping";

const DISCIPLINE_ICON = {
  ARC: Building2,
  STR: Layers,
  MEP: Wrench,
};

const DISCIPLINE_CLASS = {
  ARC: "discipline-arc",
  STR: "discipline-str",
  MEP: "discipline-mep",
};

const PAIR_COLORS = {
  "ARC-STR": { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  "ARC-MEP": { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  "STR-MEP": { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
};

function SortIcon({ column, sortConfig }) {
  if (sortConfig.column !== column)
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  if (sortConfig.direction === "asc")
    return <ArrowUp className="w-3 h-3 ml-1 text-[var(--color-accent)]" />;
  return <ArrowDown className="w-3 h-3 ml-1 text-[var(--color-accent)]" />;
}

export default function ClashTable({
  paginatedClashes,
  sortConfig,
  toggleSort,
  page,
  setPage,
  totalPages,
  totalFiltered,
  pageSize,
  selectedClashId,
  setSelectedClashId,
  updateClash,
  viewMode,
  setViewMode
}) {
  const startRow = (page - 1) * pageSize;

  const formatDistance = (d) => {
    const mm = Math.round(Math.abs(d) * 1000);
    return `-${mm.toLocaleString()}mm`;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ maxHeight: "calc(100vh - 100px)" }}>
      {/* Table Container */}
      <div
        className="flex-1 overflow-auto rounded-lg"
        style={{
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-card)",
        }}
      >
        <table className="clash-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th onClick={() => toggleSort("id")} style={{ width: 90 }}>
                <span className="inline-flex items-center">
                  Clash ID <SortIcon column="id" sortConfig={sortConfig} />
                </span>
              </th>
              <th style={{ width: 90 }}>Test</th>
              <th onClick={() => toggleSort("severity")} style={{ width: 85 }}>
                <span className="inline-flex items-center">
                  Severity <SortIcon column="severity" sortConfig={sortConfig} />
                </span>
              </th>
              <th onClick={() => toggleSort("distance")} style={{ width: 90 }}>
                <span className="inline-flex items-center">
                  Distance <SortIcon column="distance" sortConfig={sortConfig} />
                </span>
              </th>
              <th onClick={() => toggleSort("floor")} style={{ width: 120 }}>
                <span className="inline-flex items-center">
                  Floor <SortIcon column="floor" sortConfig={sortConfig} />
                </span>
              </th>
              <th style={{ width: 60 }}>Grid</th>
              <th style={{ minWidth: 150 }}>Element 1</th>
              <th style={{ minWidth: 150 }}>Element 2</th>
              <th onClick={() => toggleSort("status")} style={{ width: 110 }}>
                <span className="inline-flex items-center">
                  Status <SortIcon column="status" sortConfig={sortConfig} />
                </span>
              </th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginatedClashes.map((clash, i) => {
              const isSelected = selectedClashId === clash.id;
              const Icon1 = DISCIPLINE_ICON[clash.obj1_discipline] || Building2;
              const Icon2 = DISCIPLINE_ICON[clash.obj2_discipline] || Building2;
              const pairColor = PAIR_COLORS[clash.disciplinePair] || PAIR_COLORS["ARC-STR"];
              const currentStatus = clash.userStatus || clash.status;

              return (
                <tr
                  key={clash.id}
                  className={`clash-row ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedClashId(clash.id)}
                >
                  <td>
                    <span className="text-xs font-mono" style={{ color: "var(--color-text-dim)" }}>
                      {startRow + i + 1}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {clash.isGroup ? <span className="text-blue-600">GROUP {clash.displayId}</span> : clash.displayId}
                      </span>
                      {clash.relevanceStatus === "irrelevant" && (
                        <span className="text-[0.6rem] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-medium max-w-fit" title={clash.relevanceReason}>
                          Irrelevant
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className="pair-badge"
                      style={{ background: pairColor.bg, borderColor: pairColor.border }}
                    >
                      {clash.disciplinePair}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge badge-${clash.severity.toLowerCase()}`}>
                      {clash.severity}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {formatDistance(clash.distance)}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs truncate block" style={{ color: "var(--color-text-secondary)", maxWidth: 110 }}>
                      {clash.floor}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs" style={{ color: "var(--color-text-dim)" }}>
                      {clash.gridRef}
                    </span>
                  </td>
                  <td>
                    {clash.isGroup ? (
                      <div className="text-xs py-2">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          {getGroupSummary(clash)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Icon1 className={`w-4 h-4 ${DISCIPLINE_CLASS[clash.obj1_discipline] || ""}`} />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate text-[var(--color-text-primary)]">
                              {clash.obj1_elementName}
                            </div>
                            <div className="text-[10px] text-[var(--color-text-dim)] truncate">
                              {clash.obj1_ifcType} · ID: {clash.obj1_elementId}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon2 className={`w-4 h-4 ${DISCIPLINE_CLASS[clash.obj2_discipline] || ""}`} />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate text-[var(--color-text-primary)]">
                              {clash.obj2_elementName}
                            </div>
                            <div className="text-[10px] text-[var(--color-text-dim)] truncate">
                              {clash.obj2_ifcType} · ID: {clash.obj2_elementId}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      value={currentStatus}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateClash(clash.guid, { status: e.target.value });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`status-select badge-${currentStatus}`}
                      style={{
                        color:
                          currentStatus === "active"
                            ? "#2563eb"
                            : currentStatus === "reviewed"
                            ? "#7c3aed"
                            : currentStatus === "approved"
                            ? "#16a34a"
                            : "#6b7280",
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="approved">Approved</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClashId(clash.id);
                      }}
                      className="p-1 rounded transition-colors"
                      style={{ color: "var(--color-text-dim)" }}
                      onMouseOver={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
                      onMouseOut={(e) => (e.currentTarget.style.color = "var(--color-text-dim)")}
                      title="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginatedClashes.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-12">
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    No clashes match your current filters
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
          {startRow + 1}–{Math.min(startRow + pageSize, totalFiltered)} of {totalFiltered.toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {/* Page numbers */}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (page <= 4) {
              pageNum = i + 1;
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = page - 3 + i;
            }
            return (
              <button
                key={pageNum}
                className={`pagination-btn ${page === pageNum ? "active" : ""}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            className="pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
