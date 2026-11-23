import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import { isAdminOrOwner } from "../../utils/permission";

/**
 * Per-route hues (spec 3.2). Every variant is a full literal class string
 * so the Tailwind JIT can see it.
 */
const ROUTE_HUES = {
  "/dashboard": {
    icon: "text-indigo-500",
    row: "active:bg-indigo-50",
    tile: "group-active:bg-indigo-100",
    bar: "bg-indigo-500",
  },
  "/leads": {
    icon: "text-rose-500",
    row: "active:bg-rose-50",
    tile: "group-active:bg-rose-100",
    bar: "bg-rose-500",
  },
  "/inactive-leads": {
    icon: "text-slate-400",
    row: "active:bg-slate-100",
    tile: "group-active:bg-slate-200",
    bar: "bg-slate-400",
  },
  "/campaigns": {
    icon: "text-amber-500",
    row: "active:bg-amber-50",
    tile: "group-active:bg-amber-100",
    bar: "bg-amber-500",
  },
  "/pipeline": {
    icon: "text-violet-500",
    row: "active:bg-violet-50",
    tile: "group-active:bg-violet-100",
    bar: "bg-violet-500",
  },
  "/sitevisits": {
    icon: "text-emerald-500",
    row: "active:bg-emerald-50",
    tile: "group-active:bg-emerald-100",
    bar: "bg-emerald-500",
  },
  "/meeting": {
    icon: "text-emerald-500",
    row: "active:bg-emerald-50",
    tile: "group-active:bg-emerald-100",
    bar: "bg-emerald-500",
  },
  "/tasks": {
    icon: "text-blue-500",
    row: "active:bg-blue-50",
    tile: "group-active:bg-blue-100",
    bar: "bg-blue-500",
  },
  "/activities": {
    icon: "text-fuchsia-500",
    row: "active:bg-fuchsia-50",
    tile: "group-active:bg-fuchsia-100",
    bar: "bg-fuchsia-500",
  },
  "/reports": {
    icon: "text-cyan-600",
    row: "active:bg-cyan-50",
    tile: "group-active:bg-cyan-100",
    bar: "bg-cyan-600",
  },
  "/sales-team": {
    icon: "text-teal-600",
    row: "active:bg-teal-50",
    tile: "group-active:bg-teal-100",
    bar: "bg-teal-600",
  },
  "/team-performance": {
    icon: "text-violet-600",
    row: "active:bg-violet-50",
    tile: "group-active:bg-violet-100",
    bar: "bg-violet-600",
  },
  "/accounts": {
    icon: "text-sky-500",
    row: "active:bg-sky-50",
    tile: "group-active:bg-sky-100",
    bar: "bg-sky-500",
  },
  "/integrations": {
    icon: "text-orange-500",
    row: "active:bg-orange-50",
    tile: "group-active:bg-orange-100",
    bar: "bg-orange-500",
  },
  "/settings": {
    icon: "text-zinc-500",
    row: "active:bg-zinc-100",
    tile: "group-active:bg-zinc-200",
    bar: "bg-zinc-500",
  },
  "/help": {
    icon: "text-teal-500",
    row: "active:bg-teal-50",
    tile: "group-active:bg-teal-100",
    bar: "bg-teal-500",
  },
};

const DEFAULT_HUE = {
  icon: "text-slate-500",
  row: "active:bg-slate-100",
  tile: "group-active:bg-slate-200",
  bar: "bg-slate-400",
};

const Sidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Items marked `adminOnly` are filtered out at render time. Admins by user
  // type and Owners by role both qualify — "Owner" is a role name, so a type
  // check alone never matched it.
  const canSeeAdminNav = isAdminOrOwner();

  const navigationItems = [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard", badge: null },
    { label: "Leads", path: "/leads", icon: "Target" },
    { label: "My Campaigns", path: "/campaigns", icon: "Megaphone", adminOnly: true },
    { label: "Pipeline", path: "/pipeline", icon: "Filter", badge: null },
    { label: "Site Visits", path: "/sitevisits", icon: "CalendarCheck" },
    { label: "Meeting", path: "/meeting", icon: "Projector" },
    { label: "Task", path: "/tasks", icon: "ListChecks" },
    { label: "Activities", path: "/activities", icon: "Calendar", badge: null },
    { label: "Reports", path: "/reports", icon: "BarChart3", badge: null },
    {
      label: "Team Performance",
      path: "/team-performance",
      icon: "Trophy",
      // Same predicate as the route guard in Routes.jsx -- this is who may
      // read how the team's leads were worked.
      adminOnly: true,
    },
    { label: "Integrations", path: "/integrations", icon: "Plug", badge: null },
    { label: "Settings", path: "/settings", icon: "Settings", badge: null },
    { label: "Help Center", path: "/help", icon: "NotebookText", badge: null },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  // Close the drawer on hardware back / Escape.
  React.useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 animate-fade-in lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-64 border-r border-border
          bg-gradient-to-b from-[#FFFDF8] via-[#FFF8EE] to-[#FFEFDC]
          dark:from-[#151A22] dark:via-[#12161D] dark:to-[#0F1319]
          transform transition-all duration-300 ease-out lg:z-30
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col pt-safe">
          {/* Header block */}
          <div className="flex items-center justify-between border-b border-border p-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mahroon-200">
                <img
                  src="assets/images/aajneeti-favicon.png"
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-foreground">CRM</span>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
                  Aajneeti Connect
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-all duration-150 active:scale-95 active:bg-black/5 lg:hidden"
              aria-label="Close navigation menu"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overscroll-touch py-4">
            <div className="space-y-1 px-3">
              {navigationItems
                ?.filter((item) => !item.adminOnly || canSeeAdminNav)
                .map((item) => {
                  const isActive = location?.pathname === item?.path;
                  const hue = ROUTE_HUES[item?.path] || DEFAULT_HUE;

                  return (
                    <button
                      key={item?.path}
                      onClick={() => handleNavigation(item?.path)}
                      aria-current={isActive ? "page" : undefined}
                      className={`
                        group relative flex w-full items-center justify-between gap-2
                        rounded-xl px-3 py-2.5 text-sm font-medium
                        transition-all duration-200 ease-out
                        ${isActive
                          ? "linearbg-1 text-white shadow-nav-active"
                          : `text-slate-600 dark:text-muted-foreground ${hue.row} motion-safe:active:translate-x-0.5`
                        }
                      `}
                    >
                      {/* Accent bar -- idle rows only */}
                      {!isActive && (
                        <span
                          className={`
                            absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 origin-center
                            scale-y-0 rounded-r-full transition-transform duration-200
                            group-active:scale-y-100 ${hue.bar}
                          `}
                        />
                      )}

                      <span className="flex min-w-0 items-center gap-2">
                        {/* Icon tile */}
                        <span
                          className={`
                            grid h-8 w-8 shrink-0 place-items-center rounded-lg
                            transition-colors duration-200
                            ${isActive
                              ? "bg-white/15"
                              : `bg-white/70 shadow-nav-tile ring-1 ring-slate-900/[0.04] backdrop-blur-sm dark:bg-white/[0.06] dark:ring-white/10 ${hue.tile}`
                            }
                          `}
                        >
                          <Icon
                            name={item?.icon}
                            size={18}
                            className={`transition-transform duration-200 motion-safe:group-active:scale-110 ${
                              isActive ? "text-white" : hue.icon
                            }`}
                          />
                        </span>
                        <span className="truncate">{item?.label}</span>
                      </span>

                      {item?.badge > 0 && (
                        <span
                          className={`
                            rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums
                            ${isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}
                          `}
                        >
                          {item?.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4 pb-safe">
            <div className="text-center text-xs text-muted-foreground">
              Developed by Aajneeti connect ltd.
              <br />© 2026 All rights reserved.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
