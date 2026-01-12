import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  BellRing,
  ChevronsLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

function NavItem({ to, label, Icon, collapsed, onNavigate }) {
  void Icon;
  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex h-10 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
          "text-slate-300 hover:bg-slate-800/60 hover:text-white",
          isActive && "bg-blue-900/30 text-blue-300",
          collapsed && "justify-center px-0"
        )
      }
    >
      <Icon className="h-5 w-5" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );
}

export default function Sidebar({ onLogout }) {
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const menuItems = useMemo(() => {
    if (role === "admin") {
      return [
        { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
        { label: "Users", path: "/admin/users", icon: Users },
        { label: "Campaigns", path: "/admin/campaigns", icon: BellRing },
        { label: "Logs", path: "/admin/logs", icon: ClipboardList },
        { label: "Create Staff", path: "/admin/create-staff", icon: Shield },
        { label: "Account Settings", path: "/account", icon: Settings },
      ];
    }
    if (role === "creator") {
      return [
        { label: "Dashboard", path: "/creator", icon: LayoutDashboard },
        { label: "Users", path: "/creator/users", icon: Users },
        { label: "Campaigns", path: "/creator/campaigns", icon: BellRing },
        { label: "Logs", path: "/creator/logs", icon: ClipboardList },
        { label: "Account Settings", path: "/account", icon: Settings },
      ];
    }
    if (role === "viewer") {
      return [
        { label: "Dashboard", path: "/viewer", icon: LayoutDashboard },
        { label: "Campaigns", path: "/viewer/campaigns", icon: BellRing },
        { label: "Logs", path: "/viewer/logs", icon: ClipboardList },
        { label: "Account Settings", path: "/account", icon: Settings },
      ];
    }
    return [
      { label: "Dashboard", path: "/app", icon: LayoutDashboard },
      { label: "Preferences", path: "/app/preferences", icon: BarChart3 },
      { label: "Account Settings", path: "/account", icon: Settings },
    ];
  }, [role]);

  const toggleSidebar = () => {
    if (isMobile) setIsOpen((p) => !p);
    else setCollapsed((p) => !p);
  };

  const closeMobile = () => {
    if (isMobile) setIsOpen(false);
  };

  const effectiveCollapsed = !isMobile && collapsed;

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/80 text-slate-100 shadow-lg backdrop-blur md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      {isMobile && isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "z-50 flex h-full flex-col border-r border-slate-800/70",
          "bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900",
          "transition-all duration-300",
          isMobile ? "fixed left-0 top-0 bottom-0 p-4 shadow-2xl" : "relative p-3",
          effectiveCollapsed ? "w-[76px]" : "w-[260px]",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="relative flex items-center justify-between px-2 py-2">
          {!effectiveCollapsed ? (
            <NavLink to={role === "admin" ? "/admin" : role === "creator" ? "/creator" : role === "viewer" ? "/viewer" : "/app"} className="text-xl font-bold tracking-tight text-white">
              USER
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent font-extrabold">
                NOTIFY
              </span>
            </NavLink>
          ) : (
            <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-500/30 ring-1 ring-slate-800" />
          )}

          {!isMobile ? (
            <button
              type="button"
              onClick={toggleSidebar}
              className={cn(
                "absolute -right-4 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full",
                "border border-slate-800 bg-slate-950 text-slate-200 shadow",
                effectiveCollapsed && "rotate-180"
              )}
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-200"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {menuItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              label={item.label}
              Icon={item.icon}
              collapsed={effectiveCollapsed}
              onNavigate={closeMobile}
            />
          ))}
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => {
              closeMobile();
              onLogout?.();
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm transition-colors",
              "text-slate-300 hover:bg-slate-800/60 hover:text-white",
              effectiveCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!effectiveCollapsed ? <span>Logout</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}
