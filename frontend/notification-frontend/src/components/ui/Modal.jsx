import { useEffect } from "react";

export default function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</div>
          <button
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto p-4">{children}</div>

        {footer ? (
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
