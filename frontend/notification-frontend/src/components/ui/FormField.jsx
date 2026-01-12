export function FormField({ label, children, hint }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </div>
      {children}
      {hint ? (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div>
      ) : null}
    </label>
  );
}
