import React from "react";

export default function HeatmapChart({ heatmapData, onCellClick }) {
  if (!heatmapData || heatmapData.length === 0) return null;

  // Extract all unique grid zones across all floors
  const gridZonesSet = new Set();
  heatmapData.forEach(row => {
    Object.keys(row).forEach(key => {
      if (key !== "floor") gridZonesSet.add(key);
    });
  });
  
  // Sort grid zones alphabetically
  const gridZones = Array.from(gridZonesSet).sort();

  // Find max value for color scaling
  let maxVal = 0;
  heatmapData.forEach(row => {
    gridZones.forEach(zone => {
      const val = row[zone] || 0;
      if (val > maxVal) maxVal = val;
    });
  });

  const getColor = (val) => {
    if (val === 0) return "#f8fafc"; // empty
    if (val <= 5) return "#dcfce7"; // light green
    if (val <= 15) return "#fef08a"; // yellow
    if (val <= 30) return "#fca5a5"; // light red
    return "#dc2626"; // deep red
  };
  
  const getTextColor = (val) => {
    if (val > 30) return "#ffffff";
    if (val === 0) return "#cbd5e1";
    return "#0f172a";
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide mb-4">
        Clash Heatmap (Floor × Grid)
      </h3>
      
      <div className="overflow-x-auto">
        <div style={{ display: "grid", gridTemplateColumns: `auto repeat(${gridZones.length}, minmax(40px, 1fr))` }}>
          
          {/* Header Row */}
          <div className="p-2"></div>
          {gridZones.map(zone => (
            <div key={zone} className="p-2 text-center text-[0.65rem] font-bold" style={{ color: "var(--color-text-muted)" }}>
              {zone}
            </div>
          ))}

          {/* Data Rows */}
          {heatmapData.map((row) => (
            <React.Fragment key={row.floor}>
              <div className="p-2 text-right text-[0.65rem] font-bold self-center pr-4 truncate" style={{ color: "var(--color-text-secondary)" }}>
                {row.floor.replace("-01 Foundation", "B1").replace("00 Ground floor", "GF").replace("01 First floor", "L1").replace("02 Second floor", "L2").replace("03 Roof", "Roof")}
              </div>
              {gridZones.map(zone => {
                const val = row[zone] || 0;
                return (
                  <div key={`${row.floor}-${zone}`} className="p-0.5">
                    <div 
                      className="heatmap-cell"
                      style={{ 
                        background: getColor(val),
                        color: getTextColor(val),
                      }}
                      title={`${val} clashes at ${row.floor}, Grid ${zone}`}
                      onClick={() => val > 0 && onCellClick(row.floor, zone)}
                    >
                      {val > 0 ? val : ""}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-4 text-[0.65rem] font-medium" style={{ color: "var(--color-text-muted)" }}>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: "#dcfce7" }}></div> 1-5</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: "#fef08a" }}></div> 6-15</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: "#fca5a5" }}></div> 16-30</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: "#dc2626" }}></div> 30+</div>
      </div>
    </div>
  );
}
