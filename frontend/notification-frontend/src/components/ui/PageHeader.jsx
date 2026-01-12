export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}
