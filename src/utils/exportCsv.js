/**
 * Export clash data to CSV file and trigger download.
 */

function escapeCsvField(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportClashesToCsv(clashes, filename = "clash-report.csv") {
  const headers = [
    "Clash ID",
    "Clash Test",
    "Discipline Pair",
    "Severity",
    "Distance (mm)",
    "Floor",
    "Grid Ref",
    "Obj1 Discipline",
    "Obj1 IFC Type",
    "Obj1 Element Name",
    "Obj1 Element ID",
    "Obj1 File",
    "Obj2 Discipline",
    "Obj2 IFC Type",
    "Obj2 Element Name",
    "Obj2 Element ID",
    "Obj2 File",
    "Status",
    "Assigned To",
    "Comment",
    "Created Date",
    "X",
    "Y",
    "Z",
  ];

  const rows = clashes.map((c) => [
    c.displayId,
    c.clashTestName,
    c.disciplinePair,
    c.severity,
    Math.round(Math.abs(c.distance) * 1000),
    c.floor,
    c.gridRef,
    c.obj1_discipline,
    c.obj1_ifcType,
    c.obj1_elementName,
    c.obj1_elementId,
    c.obj1_file,
    c.obj2_discipline,
    c.obj2_ifcType,
    c.obj2_elementName,
    c.obj2_elementId,
    c.obj2_file,
    c.userStatus || c.status,
    c.assignedTo,
    c.comment,
    c.createdDate,
    c.x,
    c.y,
    c.z,
  ]);

  const csvContent = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
