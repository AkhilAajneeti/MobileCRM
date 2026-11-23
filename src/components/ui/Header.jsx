import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import GradientBell from "./GradientBell";
import InitialsAvatar from "./InitialsAvatar";
import ThemeToggle from "./ThemeToggle";

import { fetchNotifications } from "services/notification.service";
import NotificationDropdown from "components/NotificationDropdown";
import { useNotification } from "NotificationContext";
import { useNotificationCount } from "hooks/useNotificationCount";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Fixed top bar (spec 3.1). 64px tall, sits above the notch via
 * env(safe-area-inset-top), z-30.
 */
const Header = ({ onMenuToggle, isSidebarOpen = false }) => {
  const LogInuserstr = localStorage.getItem("login_object");
  const LogInuser = LogInuserstr ? JSON.parse(LogInuserstr) : null;
  const username = LogInuser?.username || "";

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleUserDropdownToggle = () => setIsUserDropdownOpen((v) => !v);
  const handleDropdownClose = () => setIsUserDropdownOpen(false);

  const handleLogout = () => {
    queryClient.clear();
    localStorage.clear();
    handleDropdownClose();
    navigate("/login", { replace: true });
  };

  const handleProfileClick = () => {
    navigate("/profile");
    handleDropdownClose();
  };

  const { open, setOpen, setNotifications } = useNotification();

  const { data } = useNotificationCount(!open);
  const count = data || 0;

  // One-shot bell swing + ping halo when a new notification lands.
  const [isSwinging, setIsSwinging] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const previousCount = useRef(count);

  useEffect(() => {
    if (count > previousCount.current) {
      setIsSwinging(true);
      const timer = setTimeout(() => setIsSwinging(false), 900);
      previousCount.current = count;
      return () => clearTimeout(timer);
    }
    previousCount.current = count;
  }, [count]);

  const handleBellClick = async () => {
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 450);

    const next = !open;
    setOpen(next);

    // fetch only when opening
    if (next) {
      const notifications = await fetchNotifications();
      setNotifications(notifications.list || []);
    }
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-border bg-background pt-safe">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          {/* Left -- menu toggle + wordmark */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMenuToggle}
              className="grid h-10 w-10 place-items-center rounded-lg text-foreground transition-all duration-150 active:scale-95 active:bg-accent lg:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={isSidebarOpen}
            >
              <Icon name={isSidebarOpen ? "X" : "Menu"} size={20} />
            </button>

            {/* Desktop wordmark */}
            <div className="ml-64 hidden items-center gap-3 lg:flex">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-mahroon-200">
                <img src="assets/images/aajneeti-favicon.png" alt="" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground">CRM</span>
                <span className="rounded-full bg-mahroon px-2 py-0.5 text-xs font-medium text-white">
                  By Aajneeti Connect ltd.
                </span>
              </div>
            </div>

            {/* Mobile wordmark */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 lg:hidden"
            >
              <span className="text-lg font-semibold text-foreground">CRM</span>
              <span className="rounded-full bg-mahroon px-2 py-0.5 text-xs font-medium text-white">
                ACL
              </span>
            </button>
          </div>

          {/* Right -- theme, notifications, avatar */}
          <div className="flex items-center gap-2">
            {/* Sits immediately left of the bell and matches its 40px round
                shape, so the two read as one pair of controls. */}
            <ThemeToggle />

            <div className="relative">
              {/* The button clips its children, so the count badge is a
                  sibling rather than a child (spec 3.1). */}
              <button
                type="button"
                onClick={handleBellClick}
                aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
                /* The pale-blue tile is a hardcoded gradient, so it needs its
                   own night value -- left alone it is a glowing white disc on
                   a dark bar. Same hue, dropped into the shadows. */
                className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle,#FAFCFE_0%,#F2F7FD_46%,#D0E7FE_100%)] transition-all duration-150 active:scale-95 active:shadow-[0_0_14px_4px_rgba(96,165,250,0.40)] dark:bg-[radial-gradient(circle,#23314A_0%,#1B2537_46%,#141C2B_100%)]"
              >
                <GradientBell
                  size={19}
                  className={
                    isSwinging
                      ? "motion-safe:animate-bell-swing"
                      : isVibrating
                        ? "motion-safe:animate-bell-vibrate"
                        : ""
                  }
                />
              </button>

              {count > 0 && (
                <>
                  {isSwinging && (
                    <span className="pointer-events-none absolute -right-1.5 -top-1.5 h-[18px] min-w-[18px] rounded-full bg-red-500 motion-safe:animate-ping" />
                  )}
                  <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white ring-2 ring-background tabular-nums">
                    {count > 99 ? "99+" : count}
                  </span>
                </>
              )}

              {open && <NotificationDropdown />}
            </div>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={handleUserDropdownToggle}
                className="flex items-center gap-3 rounded-lg bg-muted p-2 transition-all duration-150 active:scale-95"
                aria-label="User account menu"
              >
                <InitialsAvatar name={username} size={32} />
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-medium text-foreground">{username}</div>
                </div>
                <Icon
                  name="ChevronDown"
                  size={16}
                  className={`hidden transition-transform sm:block ${isUserDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isUserDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[10] bg-black/10 backdrop-blur-[2px]"
                    onClick={handleDropdownClose}
                  />

                  <div className="absolute right-0 top-full z-[60] mt-3 w-72 animate-in overflow-hidden rounded-2xl border border-white/20 bg-white/75 fade-in zoom-in-95 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl duration-200 dark:border-white/10 dark:bg-popover/90 dark:shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <InitialsAvatar name={username} size={46} />
                          <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-popover" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-foreground">
                            {username}
                          </h3>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-muted-foreground">
                            Aajneeti Connect ltd
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/70 dark:bg-border" />

                    <div className="p-2">
                      <button
                        onClick={handleProfileClick}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 transition-all active:bg-white/70 dark:text-foreground dark:active:bg-white/10"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-muted">
                          <Icon name="User" size={17} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium">Profile Settings</div>
                          <div className="text-xs text-slate-500 dark:text-muted-foreground">Manage account</div>
                        </div>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-500 transition-all active:bg-red-50/80"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                          <Icon name="LogOut" size={17} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium">Sign Out</div>
                          <div className="text-xs text-red-400">Logout from account</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
