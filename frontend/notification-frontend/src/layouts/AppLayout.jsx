import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import Sidebar from "../components/layout/Sidebar";
import { CalendarDays, Moon, SunMedium } from "lucide-react";
import { cn } from "../lib/utils";

function TopBar() {
  const { toggle, theme } = useTheme();
  const { logout } = useAuth();

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <div className="flex items-center justify-end gap-3">
      <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/50 px-4 py-2 text-slate-900 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
        <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-300" />
        <div className="leading-tight">
          <div className="text-xs text-slate-500 dark:text-slate-400">Today</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{dateLabel}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/50 px-4 py-2 text-slate-900 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
        <div className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <div className="leading-tight">
          <div className="text-xs text-slate-500 dark:text-slate-400">System</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Active</div>
        </div>
      </div>

      <button
        onClick={toggle}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/50 text-slate-900 shadow-sm backdrop-blur transition hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-900/50"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <button
        onClick={logout}
        className="hidden sm:inline-flex rounded-2xl border border-slate-200 bg-white/50 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm backdrop-blur hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/50"
      >
        Logout
      </button>
    </div>
  );
}

function LayoutInner() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.20),_transparent_50%),radial-gradient(ellipse_at_bottom,_rgba(139,92,246,0.18),_transparent_45%)]" />

      <Sidebar onLogout={logout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-7xl h-full flex flex-col">
            <div
              className={cn(
                "flex-1 flex flex-col rounded-3xl border border-slate-200 bg-white/70 shadow-xl backdrop-blur overflow-hidden",
                "dark:border-slate-800/70 dark:bg-slate-950/40"
              )}
            >
              <div className="flex-shrink-0 flex items-start justify-between gap-4 px-6 py-5">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Dashboard
                  </div>
                </div>
                <TopBar />
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AppLayout() {
  return (
    <ThemeProvider>
      <LayoutInner />
    </ThemeProvider>
  );
}
