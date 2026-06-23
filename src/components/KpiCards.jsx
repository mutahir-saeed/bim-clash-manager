import {
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  Network,
} from "lucide-react";

const VARIANT_COLORS = {
  total: "var(--color-accent)",
  critical: "var(--color-critical)",
  major: "var(--color-major)",
  minor: "var(--color-minor)",
  resolved: "var(--color-resolved)",
  clusters: "#7c3aed"
};

function KpiCard({ title, value, icon: Icon, variant, contextLine }) {
  const variantColor = VARIANT_COLORS[variant] || "var(--color-accent)";

  return (
    <div className="card-elevated animate-enter relative overflow-hidden flex flex-col justify-center min-h-[120px]">
      {/* Colored accent strip on left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" 
        style={{ background: variantColor }} 
      />
      
      {/* Content */}
      <div className="pl-3 relative z-10">
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400 mb-1">
          {title}
        </p>
        <p className="kpi-value mb-1" style={{ color: variantColor }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs text-slate-500 font-medium">
          {contextLine}
        </p>
      </div>
      
      {/* Subtle background icon watermark */}
      <Icon 
        className="absolute right-[-10px] bottom-[-10px] w-20 h-20 opacity-[0.03] rotate-[-10deg]" 
        style={{ color: variantColor }}
      />
    </div>
  );
}

export default function KpiCards({ kpis }) {
  const { total, critical, major, minor, resolved, resolutionRate, totalGroups, irrelevantCount } = kpis;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      <KpiCard 
        title="Total Clashes" 
        value={total} 
        icon={AlertTriangle} 
        variant="total"
        contextLine={`${Object.keys(kpis.byTest).length} active tests`}
      />

      <KpiCard 
        title="Critical" 
        value={critical} 
        icon={AlertTriangle} 
        variant="critical"
        contextLine="> 50mm penetration"
      />

      <KpiCard 
        title="Major" 
        value={major} 
        icon={AlertCircle} 
        variant="major"
        contextLine="10–50mm overlap"
      />

      <KpiCard 
        title="Minor" 
        value={minor} 
        icon={Info} 
        variant="minor"
        contextLine="< 10mm intersection"
      />

      <KpiCard
        title="Resolution Rate"
        value={`${resolutionRate.toFixed(1)}%`}
        icon={TrendingUp}
        variant="resolved"
        contextLine={`${resolved} clashes resolved`}
      />

      <KpiCard
        title="Clash Clusters"
        value={totalGroups || 0}
        icon={Network}
        variant="clusters"
        contextLine={`${irrelevantCount || 0} filtered as noise`}
      />
    </div>
  );
}
