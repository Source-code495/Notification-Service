export default function Alert({ type = "info", children }) {
  const styles = {
    info: "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100",
    success: "border-green-200 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-900/30 dark:text-green-100",
    error: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-100",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-900/30 dark:text-yellow-100",
  };

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${styles[type]}`}>{children}</div>
  );
}
