import { useState, useMemo } from "react";
import { useClashData } from "./hooks/useClashData";
import Header from "./components/Header";
import KpiCards from "./components/KpiCards";
import ChartsSection from "./components/ChartsSection";
import FilterPanel from "./components/FilterPanel";
import ClashTable from "./components/ClashTable";
import ClashDetailPanel from "./components/ClashDetailPanel";
import IfcViewer from "./components/IfcViewer";
import UploadZone from "./components/UploadZone";
import InsightsBanner from "./components/InsightsBanner";
import DeepDiveAnalytics from "./components/DeepDiveAnalytics";
import Footer from "./components/Footer";
import { exportBcf } from "./utils/exportBcf";
import { exportPdf } from "./utils/exportPdf";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

export default function App() {
  const {
    clashes,
    projectInfo,
    testNames,
    parseDate,
    loading,
    error,
    isDemo,
    filteredClashes,
    sortedClashes,
    paginatedClashes,
    totalFiltered,
    totalClashes,
    kpis,
    chartData,
    page,
    setPage,
    totalPages,
    pageSize,
    selectedClash,
    selectedClashId,
    setSelectedClashId,
    selectedIndexInFiltered,
    goToPrevClash,
    goToNextClash,
    filters,
    filterOptions,
    updateFilter,
    clearFilters,
    sortConfig,
    toggleSort,
    loadXml,
    loadDemoData,
    updateClash,
    viewMode,
    setViewMode,
    relevanceFilter,
    setRelevanceFilter,
    pickedElementId,
    setPickedElementId,
  } = useClashData();

  const [activeTab, setActiveTab] = useState("review"); // "review" | "analytics"

  // Compute filtered element IDs for viewer
  const filteredClashIds = useMemo(() => {
    // If no filters are active (showing all clashes), return null to show the FULL 3D model context
    if (filteredClashes.length === clashes.length) {
      return null;
    }
    return filteredClashes.map((c) => [c.obj1_elementId, c.obj2_elementId]).flat();
  }, [filteredClashes, clashes.length]);

  const hasData = clashes.length > 0;

  // Error toast
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <UploadZone onFileLoad={loadXml} onLoadDemo={loadDemoData} loading={loading} />
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg z-50 animate-fade-in"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            maxWidth: 500,
          }}
        >
          <p className="text-sm font-semibold">Parse Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state — show upload zone
  if (!hasData && !loading) {
    return <UploadZone onFileLoad={loadXml} onLoadDemo={loadDemoData} loading={loading} />;
  }

  // Loading state
  if (loading && !hasData) {
    return <UploadZone onFileLoad={loadXml} onLoadDemo={loadDemoData} loading={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
      {/* Header */}
      <Header
        projectInfo={projectInfo}
        parseDate={parseDate}
        testNames={testNames}
        totalClashes={totalClashes}
        filteredClashes={sortedClashes}
        onFileLoad={loadXml}
        loading={loading}
        onExportBcf={() => exportBcf(sortedClashes, projectInfo)}
        onExportPdf={() => exportPdf(sortedClashes, projectInfo, kpis)}
        kpis={kpis}
        chartData={chartData}
        clashes={clashes}
      />

      {/* Breadcrumb / Context Bar */}
      {hasData && (
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs font-medium shadow-sm z-30 relative">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-slate-700">{projectInfo?.projectName || "Project"}</span>
            <span className="text-slate-300">/</span>
            <span>{testNames.length > 0 ? "Multiple Tests" : "All Clashes"}</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {totalFiltered.toLocaleString()} active items
            </span>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab("review")}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeTab === "review" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Clash Review
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeTab === "analytics" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Analytics Dashboard
            </button>
          </div>
        </div>
      )}

      {activeTab === "review" ? (
        <>
          {/* KPI Cards */}
      <section className="dashboard-section pb-4">
        <KpiCards kpis={kpis} />
      </section>

      {/* Insights Banner */}
      <section className="dashboard-section py-2 border-t-0">
        <InsightsBanner kpis={kpis} chartData={chartData} totalFiltered={totalFiltered} clashes={filteredClashes} />
      </section>

      {/* Charts (Collapsible or scrollable row) */}
      <section className="dashboard-section py-4">
        <ChartsSection chartData={chartData} totalClashes={totalClashes} updateFilter={updateFilter} />
      </section>

      {/* Main Content Area */}
      <section className="dashboard-section pt-2 flex-1 flex flex-col lg:flex-row gap-5" style={{ minHeight: 0 }}>
        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          filterOptions={filterOptions}
          testNames={testNames}
          totalFiltered={totalFiltered}
          totalClashes={totalClashes}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          relevanceFilter={relevanceFilter}
          setRelevanceFilter={setRelevanceFilter}
        />

        {/* Table + Viewer Split */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 min-w-0">
          {/* Table */}
          <div className="flex-1 lg:w-[55%] flex flex-col min-w-0">
            {pickedElementId && (
              <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-t-lg flex items-center justify-between shadow-sm -mb-2 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-medium text-blue-800">
                    Showing clashes for 3D element: <code className="bg-blue-100 px-1 rounded text-blue-900">{pickedElementId}</code>
                  </span>
                </div>
                <button
                  onClick={() => setPickedElementId(null)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            )}
            <ClashTable
              paginatedClashes={paginatedClashes}
              sortConfig={sortConfig}
              toggleSort={toggleSort}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              totalFiltered={totalFiltered}
              pageSize={pageSize}
              selectedClashId={selectedClashId}
              setSelectedClashId={setSelectedClashId}
              updateClash={updateClash}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </div>

          {/* 3D Viewer */}
          <div className="lg:w-[45%] flex flex-col min-w-0" style={{ minHeight: 400 }}>
            <IfcViewer
              selectedClash={selectedClash}
              filteredClashIds={filteredClashIds}
              onPickedElementChange={setPickedElementId}
              isDemo={isDemo}
            />
          </div>
        </div>
      </section>

      {/* Deep Dive Analytics (Collapsible Row) */}
      {hasData && (
        <DeepDiveAnalytics chartData={chartData} totalClashes={totalClashes} />
      )}

      {/* Detail Panel */}
      {selectedClash && (
        <ClashDetailPanel
          clash={selectedClash}
          onClose={() => setSelectedClashId(null)}
          onPrev={goToPrevClash}
          onNext={goToNextClash}
          hasPrev={selectedIndexInFiltered > 0}
          hasNext={selectedIndexInFiltered < sortedClashes.length - 1}
          updateClash={updateClash}
        />
      )}
        </>
      ) : (
        <div className="flex-1 overflow-auto bg-slate-50">
          <AnalyticsDashboard chartData={chartData} kpis={kpis} />
        </div>
      )}

      {/* Footer */}
      {hasData && <Footer totalClashes={totalClashes} />}
    </div>
  );
}
