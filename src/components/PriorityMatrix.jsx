export default function PriorityMatrix({ priorityMatrixData }) {
  if (!priorityMatrixData || priorityMatrixData.length === 0) return null;

  // Calculate totals
  let totalCritical = 0;
  let totalMajor = 0;
  let totalMinor = 0;
  priorityMatrixData.forEach(row => {
    totalCritical += row.Critical;
    totalMajor += row.Major;
    totalMinor += row.Minor;
  });

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide mb-4">
        Priority Matrix (Discipline)
      </h3>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th className="py-2.5 px-3 font-semibold uppercase text-slate-400 border-b border-slate-200">Pair</th>
              <th className="py-2.5 px-3 font-semibold uppercase text-center text-red-500 border-b border-slate-200">Crit</th>
              <th className="py-2.5 px-3 font-semibold uppercase text-center text-orange-500 border-b border-slate-200">Maj</th>
              <th className="py-2.5 px-3 font-semibold uppercase text-center text-yellow-500 border-b border-slate-200">Min</th>
              <th className="py-2.5 px-3 font-semibold uppercase text-right text-slate-400 border-b border-slate-200">Total</th>
            </tr>
          </thead>
          <tbody>
            {priorityMatrixData.map((row, idx) => (
              <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-100 group-hover:text-blue-700 transition-colors">{row.name}</td>
                <td className="py-2.5 px-3 text-center border-b border-slate-100">
                  <span className={`inline-block min-w-[28px] px-1.5 py-0.5 rounded font-mono font-bold transition-transform group-hover:scale-105 ${row.Critical > 0 ? "bg-red-50 text-red-600" : "text-slate-300"}`}>
                    {row.Critical}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center border-b border-slate-100">
                  <span className={`inline-block min-w-[28px] px-1.5 py-0.5 rounded font-mono font-bold transition-transform group-hover:scale-105 ${row.Major > 0 ? "bg-orange-50 text-orange-600" : "text-slate-300"}`}>
                    {row.Major}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center border-b border-slate-100">
                  <span className={`inline-block min-w-[28px] px-1.5 py-0.5 rounded font-mono font-bold transition-transform group-hover:scale-105 ${row.Minor > 0 ? "bg-yellow-50 text-yellow-600" : "text-slate-300"}`}>
                    {row.Minor}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600 border-b border-slate-100">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50/80">
              <td className="py-3 px-3 font-bold text-slate-600 rounded-bl-lg">Total</td>
              <td className="py-3 px-3 text-center font-mono font-bold text-red-600">{totalCritical}</td>
              <td className="py-3 px-3 text-center font-mono font-bold text-orange-600">{totalMajor}</td>
              <td className="py-3 px-3 text-center font-mono font-bold text-yellow-600">{totalMinor}</td>
              <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 rounded-br-lg">{totalCritical + totalMajor + totalMinor}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
