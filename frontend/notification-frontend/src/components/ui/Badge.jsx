export default function Badge({ children, color = "slate" }) {
  const styles = {
    slate: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
    green: "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100",
    yellow: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100",
    red: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100",
    blue: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}
