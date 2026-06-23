import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  Critical: "#ef4444",
  Major: "#f97316",
  Minor: "#eab308",
};

export default function AnalyticsDashboard({ chartData, kpis }) {
  if (!chartData) return null;

  const { disciplineData, statusData, priorityMatrix, distanceDistribution } = chartData;

  // Transform KPI for Pie Chart
  const severityData = [
    { name: "Critical", value: kpis.critical },
    { name: "Major", value: kpis.major },
    { name: "Minor", value: kpis.minor },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Project Analytics</h2>
        <div className="text-sm text-slate-500">
          Showing data for <strong>{kpis.total}</strong> total clashes
        </div>
      </div>

      {/* Top Row: Severity & Distance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Severity Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
            Clashes by Severity
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distance Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
            Clash Distance Distribution
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Number of Clashes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Discipline Matrix */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
          Discipline Matrix (Severity vs Pair)
        </h3>
        <div className="flex-1 min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityMatrix.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#334155" }}
              />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Critical" stackId="a" fill={COLORS.Critical} />
              <Bar dataKey="Major" stackId="a" fill={COLORS.Major} />
              <Bar dataKey="Minor" stackId="a" fill={COLORS.Minor} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
