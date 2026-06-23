import { Building2 } from "lucide-react";

export default function Footer({ totalClashes }) {
  return (
    <footer className="dashboard-section border-t border-slate-200 bg-slate-50 py-4 mt-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">
            BIM Clash Manager v2.0
          </span>
          <span className="text-2xs text-slate-400">|</span>
          <span className="text-xs font-medium text-slate-500">
            {totalClashes.toLocaleString()} total clashes
          </span>
          <span className="text-2xs text-slate-400">|</span>
          <span className="text-xs text-slate-400">
            © {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{background: 'var(--color-arc)'}} /> ARC
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{background: 'var(--color-str)'}} /> STR
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{background: 'var(--color-mep)'}} /> MEP
          </span>
        </div>
      </div>
    </footer>
  );
}
