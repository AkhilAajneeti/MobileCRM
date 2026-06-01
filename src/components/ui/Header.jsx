import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import Button from "./Button";

import { fetchNotifications } from "services/notification.service";
import NotificationDropdown from "components/NotificationDropdown";
import { useNotification } from "NotificationContext";
import { useNotificationCount } from "hooks/useNotificationCount";
import Avatar from "react-avatar";
import { useQueryClient } from "@tanstack/react-query";
const Header = ({ onMenuToggle, isSidebarOpen = false }) => {
  const LogInuserstr = localStorage.getItem("login_object");
  const LogInuser = LogInuserstr ? JSON.parse(LogInuserstr) : null;

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsHelpDropdownOpen(false);
  };

  const handleHelpDropdownToggle = () => {
    setIsHelpDropdownOpen(!isHelpDropdownOpen);
    setIsUserDropdownOpen(false);
  };

  const handleDropdownClose = () => {
    setIsUserDropdownOpen(false);
    setIsHelpDropdownOpen(false);
  };

  const handleLogout = () => {

    // ✅ Clear react-query cache
    queryClient.clear();

    // ✅ Clear all local storage
    localStorage.clear();

    // ✅ Close dropdown
    handleDropdownClose();

    // ✅ Redirect
    navigate("/login", { replace: true });
  };

  const handleProfileClick = () => {
    // Navigate to profile
    console.log("Profile clicked");
    navigate("/profile");
    handleDropdownClose();
  };

  const handleSettingsClick = () => {
    // Navigate to settings
    console.log("Settings clicked");
    handleDropdownClose();
  };
  const { open, setOpen, setNotifications } = useNotification();

  const handleClick = async () => {
    setOpen(!open);

    // fetch only when opening
    if (!open) {
      const data = await fetchNotifications();
      setNotifications(data.list || []);
    }
  };
  const { data } = useNotificationCount(!open);
  const count = data || 0;
  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left Section - Mobile Menu & Logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <Icon name={isSidebarOpen ? "X" : "Menu"} size={20} />
            </Button>

            {/* Desktop Logo - Always visible on desktop */}
            <div className="hidden lg:flex items-center space-x-3 ml-64">
              <div className="w-8 h-8 bg-mahroon-200 rounded-lg flex items-center justify-center">
                {/* <Icon name="Building2" size={20} color="white" /> */}
                <img src="assets/images/aajneeti-favicon.png" alt="" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-foreground">
                  CRM
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-mahroon text-white rounded-full">
                  By Aajneeti Connect ltd.
                </span>
              </div>
            </div>

            {/* Mobile Logo - Only visible on mobile */}
            <div className="flex items-center space-x-3 lg:hidden">
              <div className="flex items-center space-x-2" onClick={()=>navigate('/')}>
                <span className="text-lg font-semibold text-foreground">
                  CRM
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-mahroon-200 text-accent-foreground rounded-full">
                  ACL
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
                onClick={handleClick}
              >
                <Icon name="Bell" size={20} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                    {count}
                  </span>
                )}
              </Button>
              {open && <NotificationDropdown />}
            </div>
            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={handleUserDropdownToggle}
                className="flex items-center space-x-3 p-2 rounded-lg bg-muted hover:bg-muted transition-smooth"
                aria-label="User account menu"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    <Avatar name={LogInuser.username} size="32" round={true} />
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-foreground">
                    {LogInuser.username}
                  </div>
                 
                </div>
                <Icon
                  name="ChevronDown"
                  size={16}
                  className={`transition-transform ${isUserDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isUserDropdownOpen && (
                <>
                  {/* blur overlay */}
                  <div
                    className="fixed inset-0 z-[10] bg-black/10 backdrop-blur-[2px]"
                    onClick={handleDropdownClose}
                  />

                  {/* dropdown */}
                  <div className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-2xl border border-white/20 bg-white/75 backdrop-blur-2xl shadow-[0_12px_40px_rgba(15,23,42,0.12)] z-[60] animate-in fade-in zoom-in-95 duration-200">

                    {/* top user section */}
                    <div className="p-5">
                      <div className="flex items-center gap-3">

                        {/* avatar */}
                        <div className="relative shrink-0">
                          <Avatar
                            name={LogInuser.username}
                            size="46"
                            round={true}
                          />

                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                        </div>

                        {/* user info */}
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {LogInuser.username}
                          </h3>

                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            Aajneeti Connect ltd
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* divider */}
                    <div className="h-px bg-slate-200/70" />

                    {/* menu */}
                    <div className="p-2">

                      {/* profile */}
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center gap-3 w-full rounded-xl px-3 py-3 text-sm text-slate-700 transition-all hover:bg-white/70"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                          <Icon name="User" size={17} />
                        </div>

                        <div className="flex-1 text-left">
                          <div className="font-medium">
                            Profile Settings
                          </div>

                          <div className="text-xs text-slate-500">
                            Manage account
                          </div>
                        </div>
                      </button>

                      {/* logout */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full rounded-xl px-3 py-3 text-sm text-red-500 transition-all hover:bg-red-50/80"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                          <Icon name="LogOut" size={17} />
                        </div>

                        <div className="flex-1 text-left">
                          <div className="font-medium">
                            Sign Out
                          </div>

                          <div className="text-xs text-red-400">
                            Logout from account
                          </div>
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

      {/* Backdrop for mobile dropdowns */}
      {/* {(isUserDropdownOpen || isHelpDropdownOpen) && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={handleDropdownClose}
        />
      )} */}
    </>
  );
};

export default Header;
