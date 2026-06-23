import { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Layers,
  Wrench,
  MapPin,
  Calendar,
  Hash,
  Crosshair,
  FileText,
  User,
  MessageSquare,
} from "lucide-react";

const DISCIPLINE_ICON = {
  ARC: Building2,
  STR: Layers,
  MEP: Wrench,
};

const DISCIPLINE_STYLE = {
  ARC: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Architecture" },
  STR: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Structure" },
  MEP: { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0", label: "MEP Systems" },
};

function ObjectSection({ prefix, clash, title }) {
  const discipline = clash[`${prefix}_discipline`];
  const style = DISCIPLINE_STYLE[discipline] || DISCIPLINE_STYLE.ARC;
  const Icon = DISCIPLINE_ICON[discipline] || Building2;

  return (
    <div className="detail-section">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold"
          style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
        >
          <Icon className="w-3 h-3" />
          {discipline}
        </div>
        <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
          {title}
        </span>
      </div>
      <div className="space-y-2">
        <DetailRow label="IFC Type" value={clash[`${prefix}_ifcType`]} mono />
        <DetailRow label="Element Name" value={clash[`${prefix}_elementName`]} />
        <DetailRow label="Element ID" value={clash[`${prefix}_elementId`]} mono small />
        <DetailRow label="Source File" value={clash[`${prefix}_file`]} small />
        <DetailRow label="Floor" value={clash[`${prefix}_floor`]} />
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, small }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[0.7rem] font-medium flex-shrink-0" style={{ color: "var(--color-text-dim)" }}>
        {label}
      </span>
      <span
        className={`text-right ${mono ? "font-mono" : ""} ${small ? "text-[0.7rem]" : "text-xs"}`}
        style={{ color: "var(--color-text-secondary)", wordBreak: "break-all" }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export default function ClashDetailPanel({
  clash,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  updateClash,
}) {
  const [localAssigned, setLocalAssigned] = useState(clash?.assignedTo || "");
  const [localComment, setLocalComment] = useState(clash?.comment || "");

  useEffect(() => {
    setLocalAssigned(clash?.assignedTo || "");
    setLocalComment(clash?.comment || "");
  }, [clash?.id]);

  if (!clash) return null;

  const currentStatus = clash.userStatus || clash.status;
  const distanceMm = Math.round(Math.abs(clash.distance) * 1000);

  const handleStatusChange = (newStatus) => {
    updateClash(clash.guid, { status: newStatus });
  };

  const handleAssignedBlur = () => {
    updateClash(clash.guid, { assignedTo: localAssigned });
  };

  const handleCommentBlur = () => {
    updateClash(clash.guid, { comment: localComment });
  };

  return (
    <>
      {/* Panel */}
      <div className="detail-panel animate-slide-in-left">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="pagination-btn"
              title="Previous clash"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="pagination-btn"
              title="Next clash"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={onClose} className="p-1 rounded transition-colors" style={{ color: "var(--color-text-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clash Info Header */}
        <div className="detail-section">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              {clash.displayId}
            </span>
            <span className={`badge-severity badge-${clash.severity.toLowerCase()}`}>
              {clash.severity}
            </span>
          </div>
          <div className="text-[0.65rem] font-mono break-all mb-3" style={{ color: "var(--color-text-dim)" }}>
            {clash.guid}
          </div>

          {/* Discipline Pair Banner */}
          <div
            className="flex items-center justify-center gap-3 py-2 rounded-md mb-3"
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <span className={`discipline-tag discipline-${clash.obj1_discipline.toLowerCase()}`}>
              {clash.obj1_discipline}
            </span>
            <span className="text-xs font-bold" style={{ color: "var(--color-text-dim)" }}>vs</span>
            <span className={`discipline-tag discipline-${clash.obj2_discipline.toLowerCase()}`}>
              {clash.obj2_discipline}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Status</span>
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
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
                fontSize: "0.8rem",
                padding: "4px 28px 4px 10px",
              }}
            >
              <option value="active">Active</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <DetailRow label="Distance" value={`-${distanceMm.toLocaleString()}mm`} mono />
            <DetailRow label="Test" value={clash.clashTestName} />
            <DetailRow label="Grid Ref" value={clash.gridRef} mono />
            <DetailRow label="Floor" value={clash.floor} />
            <DetailRow label="Created" value={clash.createdDate} />
          </div>

          {/* XYZ Coordinates */}
          <div className="mt-3 flex items-center gap-2">
            <Crosshair className="w-3 h-3" style={{ color: "var(--color-text-dim)" }} />
            <span className="text-[0.7rem] font-mono" style={{ color: "var(--color-text-dim)" }}>
              X: {clash.x.toFixed(3)} &nbsp; Y: {clash.y.toFixed(3)} &nbsp; Z: {clash.z.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Object 1 */}
        <ObjectSection prefix="obj1" clash={clash} title="Object 1" />

        {/* Object 2 */}
        <ObjectSection prefix="obj2" clash={clash} title="Object 2" />

        {/* Assignment & Comments */}
        <div className="detail-section">
          <div className="mb-3">
            <label className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>
              <User className="w-3 h-3" />
              Assigned To
            </label>
            <input
              type="text"
              value={localAssigned}
              onChange={(e) => setLocalAssigned(e.target.value)}
              onBlur={handleAssignedBlur}
              placeholder="Enter team member..."
              className="filter-input"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>
              <MessageSquare className="w-3 h-3" />
              Comments
            </label>
            <textarea
              value={localComment}
              onChange={(e) => setLocalComment(e.target.value)}
              onBlur={handleCommentBlur}
              placeholder="Add resolution notes..."
              rows={3}
              className="filter-input resize-none"
            />
          </div>
        </div>
      </div>
    </>
  );
}
