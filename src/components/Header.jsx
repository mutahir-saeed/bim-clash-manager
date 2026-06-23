import { useRef, useCallback, useState } from "react";
import {
  Building2,
  Upload,
  Download,
  Info,
  MapPin,
  Calendar,
  FileText,
  X,
  FileDown,
  FileBarChart,
} from "lucide-react";
import { exportClashesToCsv } from "../utils/exportCsv";

export default function Header({
  projectInfo,
  parseDate,
  testNames,
  totalClashes,
  filteredClashes,
  onFileLoad,
  loading,
  onExportBcf,
  onExportPdf,
  kpis,
  chartData,
  clashes,
}) {
  const fileInputRef = useRef(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleFile = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => onFileLoad(ev.target.result);
      reader.readAsText(file);
    },
    [onFileLoad]
  );

  const formattedDate = parseDate
    ? new Date(parseDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <header
      className="px-6 py-3 flex items-center justify-between"
      style={{
        background: "rgba(30, 58, 95, 0.9)",
        backgroundImage: "linear-gradient(135deg, rgba(30,58,95,0.95), rgba(37,99,235,0.9))",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: Logo + Project Info */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Building2 className="w-5 h-5" style={{ color: "white" }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight" style={{ color: "white" }}>
              BIM Clash Manager
            </h1>
            <span className="px-1.5 py-0.5 rounded-md text-[0.6rem] font-bold tracking-wider" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
              v2.0
            </span>
          </div>
          {projectInfo && (
            <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
              <span className="font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                {projectInfo.projectName}
              </span>

              {formattedDate && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </span>
                </>
              )}
              <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {testNames.length} tests · {totalClashes.toLocaleString()} clashes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* How to Use */}
        <div className="relative">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="speckle-toolbar-btn"
            title="How to use"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">How to use</span>
          </button>
          {showHelp && (
            <div
              className="absolute right-0 top-full mt-2 w-72 p-4 rounded-lg z-50 animate-fade-in"
              style={{
                background: "#ffffff",
                border: "1px solid var(--color-border)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                  Workflow
                </span>
                <button onClick={() => setShowHelp(false)}>
                  <X className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                </button>
              </div>
              <ol className="space-y-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                <li className="flex gap-2">
                  <span className="font-bold text-[var(--color-accent)]">1.</span>
                  <span><strong>Upload</strong> your Navisworks XML clash report</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[var(--color-accent)]">2.</span>
                  <span><strong>Filter</strong> by discipline, floor, severity, or status</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[var(--color-accent)]">3.</span>
                  <span><strong>Triage</strong> clashes — update status, assign team members</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[var(--color-accent)]">4.</span>
                  <span><strong>Export</strong> results as CSV, BCF, or PDF for reporting</span>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Export CSV */}
        {filteredClashes && filteredClashes.length > 0 && (
          <button
            onClick={() => exportClashesToCsv(filteredClashes)}
            className="speckle-toolbar-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        )}

        {/* Export BCF */}
        {filteredClashes && filteredClashes.length > 0 && onExportBcf && (
          <button
            onClick={onExportBcf}
            className="speckle-toolbar-btn"
            title="Export BCF for BIM tools"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BCF</span>
          </button>
        )}

        {/* Export PDF */}
        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="speckle-toolbar-btn"
            title="Generate PDF Report"
          >
            <FileBarChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        )}

        {/* Upload New */}
        <input ref={fileInputRef} type="file" accept=".xml" onChange={handleFile} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${!filteredClashes || filteredClashes.length === 0 ? "animate-pulse shadow-lg shadow-blue-500/30" : ""}`}
          style={{
            background: "white",
            color: "#1e3a5f",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.85)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "white")}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload XML
        </button>
      </div>
    </header>
  );
}
