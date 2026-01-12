export default function Table({ columns, rows, keyField = "id", onRowClick }) {
  return (
    <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 font-semibold">
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r[keyField] ?? JSON.stringify(r)}
              className={
                "border-t border-slate-200 dark:border-slate-800 " +
                (onRowClick
                  ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  : "")
              }
              onClick={onRowClick ? () => onRowClick(r) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-slate-800 dark:text-slate-100">
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-slate-500 dark:text-slate-400"
              >
                No data
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
