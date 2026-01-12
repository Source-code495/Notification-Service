export function Card({ title, children, right }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      {title ? (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
          {right || null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function CardGrid({ children }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}
