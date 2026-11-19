"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Trophy, Users, GitCompare, Sparkles, Activity,
  BarChart3, Shield, Layers, DollarSign, Bookmark,
  Settings, Menu, X, ChevronDown, FlaskConical, History,
  Award, Sun, Moon, LayoutDashboard
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { EplBrandLogo } from "@/components/EplBrandLogo";

const CURRENT_APP_VERSION = "2.0.0";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [hasUnseenRelease, setHasUnseenRelease] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem("epl_seen_version");
      if (seen !== CURRENT_APP_VERSION) {
        setHasUnseenRelease(true);
      }
      if (pathname === "/changelog") {
        window.localStorage.setItem("epl_seen_version", CURRENT_APP_VERSION);
        setHasUnseenRelease(false);
      }
    } catch {
      // Ignore storage restrictions
    }
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { name: "Landing", href: "/", icon: Trophy },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Players", href: "/players", icon: Users },
    { name: "Records", href: "/analytics/records", icon: Award },
    { name: "Advanced", href: "/analytics/advanced", icon: Activity },
    { name: "Intel Lab", href: "/intelligence-lab", icon: FlaskConical },
    { name: "Comparison", href: "/comparison", icon: GitCompare },
    { name: "Cohorts", href: "/similar-players", icon: Layers },
    { name: "Insights", href: "/insights", icon: Sparkles },
    { name: "Teams", href: "/teams", icon: Shield },
    { name: "Seasons", href: "/seasons", icon: BarChart3 },
    { name: "Auction", href: "/auction", icon: DollarSign },
    { name: "Shortlists", href: "/shortlists", icon: Bookmark },
    { name: "Changelog", href: "/changelog", icon: History },
    { name: "Admin", href: "/admin", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm no-print text-[#101828] dark:text-[#F8FAFC] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Original EPL Insignia */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center group">
              <EplBrandLogo variant="full" size="md" />
            </Link>

            <Link
              href="/changelog"
              title="View Version 2.0 Signature Release Notes"
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors"
            >
              <span>v{CURRENT_APP_VERSION}</span>
              {hasUnseenRelease && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-sans font-semibold text-white bg-[#2563EB] dark:bg-[#3B82F6] px-1.5 py-0.2 rounded-full animate-pulse"
                  aria-label="New version available"
                >
                  NEW
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                pathname === "/dashboard"
                  ? "bg-[#2563EB] text-white shadow-sm font-bold"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B]"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Terminal</span>
            </Link>

            <Link
              href="/players"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive("/players")
                  ? "bg-[#2563EB] text-white shadow-sm font-bold"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Players</span>
            </Link>

            {/* Analytics Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1 ${
                  pathname.startsWith("/analytics")
                    ? "bg-[#2563EB] text-white shadow-sm font-bold"
                    : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B]"
                }`}
              >
                <span>Analytics</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {analyticsOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#151F32] border border-[#E2E8F0] dark:border-[#334155] shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setAnalyticsOpen(false)}
                >
                  <Link
                    href="/analytics/records"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#101828] dark:text-[#F8FAFC] hover:bg-blue-50 dark:hover:bg-[#1E293B] hover:text-[#2563EB] dark:hover:text-[#38BDF8]"
                  >
                    <Award className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
                    <span>Tournament Records</span>
                  </Link>
                  <Link
                    href="/analytics/batting"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#101828] dark:text-[#F8FAFC] hover:bg-blue-50 dark:hover:bg-[#1E293B] hover:text-[#2563EB] dark:hover:text-[#38BDF8]"
                  >
                    <Trophy className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
                    <span>Batting Analytics</span>
                  </Link>
                  <Link
                    href="/analytics/bowling"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#101828] dark:text-[#F8FAFC] hover:bg-blue-50 dark:hover:bg-[#1E293B] hover:text-[#2563EB] dark:hover:text-[#38BDF8]"
                  >
                    <Shield className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
                    <span>Bowling Analytics</span>
                  </Link>
                  <Link
                    href="/analytics/all-rounders"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#101828] dark:text-[#F8FAFC] hover:bg-blue-50 dark:hover:bg-[#1E293B] hover:text-[#2563EB] dark:hover:text-[#38BDF8]"
                  >
                    <Activity className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
                    <span>All-Rounder Index</span>
                  </Link>
                  <Link
                    href="/analytics/advanced"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#101828] dark:text-[#F8FAFC] hover:bg-blue-50 dark:hover:bg-[#1E293B] hover:text-[#2563EB] dark:hover:text-[#38BDF8]"
                  >
                    <Activity className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
                    <span>Advanced Analytics (6-in-1)</span>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/intelligence-lab"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive("/intelligence-lab")
                  ? "bg-[#2563EB] text-white shadow-sm font-bold"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B]"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Intel Lab</span>
            </Link>

            <Link
              href="/comparison"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive("/comparison")
                  ? "bg-[#2563EB] text-white shadow-sm font-bold"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B]"
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare</span>
            </Link>

            <Link
              href="/teams"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive("/teams")
                  ? "bg-[#2563EB] text-white shadow-sm font-bold"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B]"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Teams</span>
            </Link>

            <Link
              href="/auction"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive("/auction")
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "bg-blue-50 dark:bg-[#1E293B] text-[#2563EB] dark:text-[#38BDF8] border border-blue-200 dark:border-[#334155] hover:bg-blue-100 dark:hover:bg-[#283850]"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Live Auction</span>
            </Link>
          </nav>

          {/* Right Controls: Sun/Moon Theme Toggle + Mobile Menu Trigger */}
          <div className="flex items-center space-x-2">
            {/* Signature Page-Curl Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Page Curl)`}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] hover:text-[#2563EB] dark:hover:text-[#38BDF8] hover:border-[#2563EB] dark:hover:border-[#38BDF8] transition-all shadow-sm group"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-[#2563EB] group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] hover:text-[#2563EB]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0B1120] px-4 pt-3 pb-6 space-y-1.5 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    active
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#151F32] hover:text-[#101828] dark:hover:text-[#F8FAFC]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
