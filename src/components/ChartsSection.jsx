import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart2 } from "lucide-react";
import HeatmapChart from "./HeatmapChart";

const STATUS_COLORS = {
  active: "#2563eb",
  reviewed: "#7c3aed",
  approved: "#16a34a",
  resolved: "#6b7280",
};

const STATUS_LABELS = {
  active: "Active",
  reviewed: "Reviewed",
  approved: "Approved",
  resolved: "Resolved",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 bg-white border border-slate-200 shadow-xl tooltip">
      <p className="text-xs font-bold mb-2 text-slate-800">
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color || entry.payload.fill }} />
          <span className="text-slate-500 font-medium">{entry.name}:</span>
          <span className="font-bold text-slate-700">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg p-3 bg-white border border-slate-200 shadow-xl tooltip">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: data.payload.fill }} />
        <span className="text-slate-500 font-medium">
          {STATUS_LABELS[data.name] || data.name}:
        </span>
        <span className="font-bold text-slate-700">
          {data.value}
        </span>
      </div>
    </div>
  );
}

export default function ChartsSection({ chartData, totalClashes, updateFilter }) {
  const { disciplineData, floorData, statusData, heatmapData } = chartData;

  const shortFloor = (name) => {
    return name
      .replace("-01 Foundation", "B1 Found.")
      .replace("00 Ground floor", "GF")
      .replace("01 First floor", "L1")
      .replace("02 Second floor", "L2")
      .replace("03 Roof", "Roof");
  };

  const shortFloorData = floorData.map((d) => ({ ...d, name: shortFloor(d.name) }));

  return (
    <>
      <div className="section-header">
        <BarChart2 className="w-5 h-5 text-blue-600" />
        <h2>Distribution Overview</h2>
        <span className="section-badge">4 views</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Chart A: By Discipline */}
        <div className="card-elevated animate-enter">
          <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide mb-4">
            By Discipline Pair
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={disciplineData} barCategoryGap="20%">
              <defs>
                <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorMajor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorMinor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fde047" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0" /* FIX THE BUG */
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="Critical" stackId="a" fill="url(#colorCritical)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Major" stackId="a" fill="url(#colorMajor)" />
              <Bar dataKey="Minor" stackId="a" fill="url(#colorMinor)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart B: By Floor */}
        <div className="card-elevated animate-enter" style={{ animationDelay: "60ms" }}>
          <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide mb-4">
            By Floor Level
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={shortFloorData} barCategoryGap="15%">
              <defs>
                {/* Reusing definitions from Chart A implicitly, but best to redefine or rely on DOM */}
                <linearGradient id="colorCritical2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorMajor2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorMinor2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fde047" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="Critical" stackId="a" fill="url(#colorCritical2)" />
              <Bar dataKey="Major" stackId="a" fill="url(#colorMajor2)" />
              <Bar dataKey="Minor" stackId="a" fill="url(#colorMinor2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart C: Status Donut */}
        <div className="card-elevated animate-enter flex flex-col" style={{ animationDelay: "120ms" }}>
          <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Status Distribution
          </h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.1" />
                  </filter>
                </defs>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  style={{ filter: "url(#shadow)" }}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.name] || "#6b7280"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                {/* Center Label */}
                <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fill="#0f172a" fontSize="26" fontWeight="800" fontFamily="Inter">
                  {totalClashes.toLocaleString()}
                </text>
                <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="11" fontWeight="500" fontFamily="Inter">
                  total clashes
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-auto pb-1">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[0.65rem] font-bold">
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ background: STATUS_COLORS[entry.name] }}
                />
                <span className="text-slate-500 uppercase tracking-wider">
                  {STATUS_LABELS[entry.name]} <span className="text-slate-400">({entry.value})</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart D: Heatmap */}
        <div className="card-elevated animate-enter" style={{ animationDelay: "180ms" }}>
          <HeatmapChart 
            heatmapData={heatmapData} 
            onCellClick={(floor, gridZone) => {
              updateFilter("floors", [floor]);
              updateFilter("gridZone", gridZone);
            }} 
          />
        </div>
      </div>
    </>
  );
}
