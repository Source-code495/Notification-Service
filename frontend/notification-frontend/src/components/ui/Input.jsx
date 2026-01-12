export default function Input(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-200 " +
        (props.className || "")
      }
    />
  );
}
