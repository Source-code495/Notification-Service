export default function Button({ variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-60";
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
    secondary: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return <button {...props} className={`${base} ${styles[variant]} ${className}`} />;
}
