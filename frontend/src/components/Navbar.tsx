"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Trophy, Users, GitCompare, Sparkles, Activity,
  BarChart3, Shield, Layers, DollarSign, Bookmark,
  Settings, Menu, X, ChevronDown, FlaskConical, History,
  Award
} from "lucide-react";

const CURRENT_APP_VERSION = "1.3.0";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [hasUnseenRelease, setHasUnseenRelease] = useState(false);

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
    <header className="sticky top-0 z-50 bg-[#02000D]/95 backdrop-blur border-b border-[#D9AA90]/25 shadow-md no-print text-[#EBDED4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Editorial Title + Version Pill */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded bg-[#A65E46] flex items-center justify-center text-[#EBDED4] font-serif font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                E
              </div>
              <div>
                <span className="font-serif text-base font-bold tracking-tight text-[#EBDED4] block leading-none">
                  EPL ANALYTICS
                </span>
                <span className="text-[10px] tracking-widest uppercase text-[#D9AA90] block mt-0.5">
                  Exotica Premier League
                </span>
              </div>
            </Link>

            <Link
              href="/changelog"
              title="View Version 1.3.0 Release Notes & Changelog"
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#07203F] border border-[#D9AA90]/35 text-[10px] font-mono text-[#D9AA90] hover:bg-[#A65E46] hover:text-[#EBDED4] transition-colors"
            >
              <span>v{CURRENT_APP_VERSION}</span>
              {hasUnseenRelease && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-sans font-semibold text-[#EBDED4] bg-[#A65E46] px-1.5 py-0.2 rounded-full animate-pulse"
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
                  ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#07203F]"
              }`}
            >
              Overview
            </Link>

            <Link
              href="/players"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/players")
                  ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#07203F]"
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
                    ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                    : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#07203F]"
                }`}
              >
                <span>Analytics</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#D9AA90]" />
              </button>
              {analyticsOpen && (
                <div
                  className="absolute left-0 mt-1.5 w-56 bg-[#07203F] border border-[#D9AA90]/35 rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden"
                  onMouseLeave={() => setAnalyticsOpen(false)}
                >
                  <Link
                    href="/analytics/records"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs font-bold text-[#D9AA90] hover:bg-[#02000D] transition-colors border-b border-[#D9AA90]/20"
                  >
                    Tournament Records (v1.3)
                  </Link>
                  <Link
                    href="/analytics/advanced"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs font-semibold text-[#EBDED4] hover:bg-[#02000D] transition-colors"
                  >
                    Advanced Analytics
                  </Link>
                  <Link
                    href="/analytics/batting"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#EBDED4]/90 hover:bg-[#02000D] transition-colors"
                  >
                    Batting Leaderboards
                  </Link>
                  <Link
                    href="/analytics/bowling"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#EBDED4]/90 hover:bg-[#02000D] transition-colors"
                  >
                    Bowling Leaderboards
                  </Link>
                  <Link
                    href="/analytics/all-rounders"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#EBDED4]/90 hover:bg-[#02000D] transition-colors"
                  >
                    All-Rounder Rankings
                  </Link>
                  <Link
                    href="/similar-players"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#EBDED4]/90 hover:bg-[#02000D] transition-colors border-t border-[#D9AA90]/15"
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
                  ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                  : "text-[#D9AA90] hover:text-[#EBDED4] hover:bg-[#07203F]"
              }`}
            >
              Intel Lab
            </Link>

            <Link
              href="/comparison"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/comparison")
                  ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#07203F]"
              }`}
            >
              Compare
            </Link>

            <Link
              href="/insights"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/insights")
                  ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#07203F]"
              }`}
            >
              Insights
            </Link>

            <Link
              href="/teams"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/teams")
                  ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#07203F]"
              }`}
            >
              Teams
            </Link>

            <Link
              href="/seasons"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/seasons")
                  ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#07203F]"
              }`}
            >
              Seasons
            </Link>

            <Link
              href="/auction"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/auction")
                  ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#07203F]"
              }`}
            >
              Auction
            </Link>

            <Link
              href="/shortlists"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive("/shortlists")
                  ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#07203F]"
              }`}
            >
              Shortlists
            </Link>

            <Link
              href="/admin"
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors border border-[#D9AA90]/35 ml-1 ${
                isActive("/admin")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#D9AA90] hover:bg-[#07203F]"
              }`}
              title="Admin Portal"
            >
              <Settings className="w-3.5 h-3.5 inline mr-1 text-[#D9AA90]" />
              Admin
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/changelog"
              className="px-2 py-0.5 rounded-full bg-[#07203F] border border-[#D9AA90]/35 text-[10px] font-mono text-[#D9AA90]"
            >
              v{CURRENT_APP_VERSION}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#EBDED4] hover:text-[#D9AA90] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#D9AA90]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#A65E46]" /> : <Menu className="w-6 h-6 text-[#EBDED4]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#02000D] border-b border-[#D9AA90]/25 px-4 pt-2 pb-5 space-y-1.5 shadow-2xl">
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
                    ? "bg-[#A65E46] text-[#EBDED4] font-semibold"
                    : "text-[#EBDED4]/85 hover:bg-[#07203F] hover:text-[#D9AA90]"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-[#EBDED4]" : "text-[#D9AA90]"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
