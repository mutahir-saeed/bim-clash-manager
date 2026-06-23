import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DistanceHistogram({ distanceDistribution }) {
  if (!distanceDistribution || distanceDistribution.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg p-3 bg-white border border-slate-200 shadow-xl tooltip">
        <p className="text-xs font-bold mb-1 text-slate-800">
          Range: {label}
        </p>
        <p className="text-xs text-slate-500">
          Count: <span className="font-bold font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{payload[0].value}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide mb-4">
        Distance Distribution
      </h3>
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distanceDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={1}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }} 
              axisLine={{ stroke: "#e2e8f0" }} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fill: "#64748b", fontSize: 10 }} 
              axisLine={false} 
              tickLine={false} 
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <Bar 
              dataKey="value" 
              fill="url(#colorIndigo)" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
