"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Trophy, Users, GitCompare, Sparkles, Activity,
  BarChart3, Shield, Layers, DollarSign, Bookmark,
  Settings, Menu, X, ChevronDown, FlaskConical, History,
  Award, Sun, Moon
} from "lucide-react";
import { useTheme } from "@/lib/theme";

const CURRENT_APP_VERSION = "1.3.0";

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
    { name: "Overview", href: "/", icon: Trophy },
    { name: "Players", href: "/players", icon: Users },
    { name: "Records & Hall of Fame", href: "/analytics/records", icon: Award },
    { name: "Advanced Analytics", href: "/analytics/advanced", icon: Activity },
    { name: "Intelligence Lab", href: "/intelligence-lab", icon: FlaskConical },
    { name: "Comparison", href: "/comparison", icon: GitCompare },
    { name: "Similar Cohorts", href: "/similar-players", icon: Layers },
    { name: "Insights", href: "/insights", icon: Sparkles },
    { name: "Teams", href: "/teams", icon: Shield },
    { name: "Seasons", href: "/seasons", icon: BarChart3 },
    { name: "Auction", href: "/auction", icon: DollarSign },
    { name: "Shortlists", href: "/shortlists", icon: Bookmark },
    { name: "Release Notes", href: "/changelog", icon: History },
    { name: "Admin", href: "/admin", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm no-print text-[#101828] dark:text-[#F8FAFC] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Bold Space Grotesk Title + Version Pill */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0891B2] dark:from-[#3B82F6] dark:to-[#22D3EE] flex items-center justify-center text-white font-display font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                E
              </div>
              <div>
                <span className="font-display text-base font-bold tracking-tight text-[#101828] dark:text-[#F8FAFC] block leading-none">
                  EPL <span className="text-[#2563EB] dark:text-[#38BDF8]">INTELLIGENCE</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-medium text-[#64748B] dark:text-[#94A3B8] block mt-0.5">
                  Exotica Premier League
                </span>
              </div>
            </Link>

            <Link
              href="/changelog"
              title="View Version 1.3.0 Release Notes & Changelog"
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
              href="/"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/") && pathname === "/"
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
            >
              Overview
            </Link>

            <Link
              href="/players"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/players")
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
            >
              Players
            </Link>

            {/* Analytics Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors ${
                  pathname.startsWith("/analytics") || pathname.startsWith("/similar-players")
                    ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                    : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                }`}
              >
                <span>Analytics</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              {analyticsOpen && (
                <div
                  className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-[#151F32] border border-[#E2E8F0] dark:border-[#334155] rounded-xl shadow-xl py-1.5 z-50 overflow-hidden"
                  onMouseLeave={() => setAnalyticsOpen(false)}
                >
                  <Link
                    href="/analytics/records"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors border-b border-[#E2E8F0] dark:border-[#334155]"
                  >
                    Tournament Records (v1.3)
                  </Link>
                  <Link
                    href="/analytics/advanced"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs font-semibold text-[#101828] dark:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors"
                  >
                    Advanced Analytics
                  </Link>
                  <Link
                    href="/analytics/batting"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors"
                  >
                    Batting Leaderboards
                  </Link>
                  <Link
                    href="/analytics/bowling"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors"
                  >
                    Bowling Leaderboards
                  </Link>
                  <Link
                    href="/analytics/all-rounders"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors"
                  >
                    All-Rounder Rankings
                  </Link>
                  <Link
                    href="/similar-players"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors border-t border-[#E2E8F0] dark:border-[#334155]"
                  >
                    Similar Player Cohorts
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/intelligence-lab"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/intelligence-lab")
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
            >
              Intel Lab
            </Link>

            <Link
              href="/comparison"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/comparison")
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
            >
              Compare
            </Link>

            <Link
              href="/insights"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/insights")
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
            >
              Insights
            </Link>

            <Link
              href="/teams"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/teams")
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
            >
              Teams
            </Link>

            <Link
              href="/seasons"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/seasons")
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
            >
              Seasons
            </Link>

            <Link
              href="/auction"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/auction")
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
            >
              Auction
            </Link>

            <Link
              href="/shortlists"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/shortlists")
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold shadow-sm"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
            >
              Shortlists
            </Link>

            <Link
              href="/admin"
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors border border-[#E2E8F0] dark:border-[#334155] ml-1 ${
                isActive("/admin")
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              }`}
              title="Admin Portal"
            >
              <Settings className="w-3.5 h-3.5 inline mr-1 text-[#64748B] dark:text-[#94A3B8]" />
              Admin
            </Link>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="ml-2 p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#101828] dark:text-[#F8FAFC] hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors flex items-center justify-center shadow-sm"
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun className="w-4 h-4 text-[#FACC15] animate-in spin-in-180 duration-200" />
                ) : (
                  <Moon className="w-4 h-4 text-[#2563EB] animate-in spin-in-180 duration-200" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>
          </nav>

          {/* Mobile menu and theme toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#101828] dark:text-[#F8FAFC] shadow-sm"
            >
              {mounted && (theme === "dark" ? <Sun className="w-4 h-4 text-[#FACC15]" /> : <Moon className="w-4 h-4 text-[#2563EB]" />)}
            </button>
            <Link
              href="/changelog"
              className="px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]"
            >
              v{CURRENT_APP_VERSION}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#101828] dark:text-[#F8FAFC] hover:text-[#2563EB] dark:hover:text-[#38BDF8] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#3B82F6]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#2563EB] dark:text-[#38BDF8]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#0B1120] border-b border-[#E2E8F0] dark:border-[#334155] px-4 pt-2 pb-5 space-y-1.5 shadow-2xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href) && (link.href === "/" ? pathname === "/" : true);
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  active
                    ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold"
                    : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] hover:text-[#101828] dark:hover:text-[#F8FAFC]"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-[#2563EB] dark:text-[#38BDF8]"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
