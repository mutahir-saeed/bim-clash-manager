import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function exportPdf(clashes, projectInfo, kpis) {
  try {
    const doc = new jsPDF("landscape");

    // Title
    doc.setFontSize(20);
    doc.text("BIM Clash Report", 14, 22);

    // Project Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Project: ${projectInfo?.name || "Unknown"}`, 14, 30);
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Total Clashes: ${clashes.length}`, 14, 40);

    // KPIs
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("KPI Summary", 14, 50);
    
    autoTable(doc, {
      startY: 55,
      head: [["Metric", "Value"]],
      body: [
        ["Total Filtered Clashes", String(kpis?.total || 0)],
        ["Critical", String(kpis?.critical || 0)],
        ["Major", String(kpis?.major || 0)],
        ["Minor", String(kpis?.minor || 0)],
        ["Resolved", String(kpis?.resolved || 0)],
        ["Resolution Rate", `${(kpis?.resolutionRate || 0).toFixed(1)}%`],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] }, // Tailwind blue-500
      margin: { left: 14, right: 200 },
    });

    // Table
    const finalY = doc.lastAutoTable.finalY || 55;
    doc.text("Clash List", 14, finalY + 15);

    const tableData = clashes.map((c) => [
      String(c.displayId || "-"),
      String(c.severity || "-"),
      String(c.disciplinePair || "-"),
      String(c.floor || "-"),
      String(c.gridRef || "-"),
      String(c.userStatus || c.status || "active"),
      `${Math.round(Math.abs(c.distance || 0) * 1000)}mm`,
      String(c.obj1_elementName || c.obj1_ifcType || "-"),
      String(c.obj2_elementName || c.obj2_ifcType || "-"),
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [
        [
          "ID",
          "Severity",
          "Pair",
          "Floor",
          "Grid",
          "Status",
          "Distance",
          "Element 1",
          "Element 2",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [51, 65, 85] }, // Tailwind slate-700
      styles: { fontSize: 8 },
    });

    doc.save(`Clash_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("PDF Export failed:", error);
    alert("Failed to export PDF. Check console for details.");
  }
}
